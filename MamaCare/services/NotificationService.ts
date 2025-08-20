import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './apiService';
import NotificationConfig from '../config/notificationConfig';

// Configure how notifications should be handled when app is running
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  categoryId?: string;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  trigger: Notifications.NotificationTriggerInput;
  data?: any;
}

class NotificationService {
  private expoPushToken: string | null = null;

  async initialize() {
    try {
      console.log('[NotificationService] Initializing...');
      
      // Show development warnings if needed
      if (NotificationConfig.developmentWarnings.showExpoGoLimitations && NotificationConfig.isExpoGo) {
        console.warn('[NotificationService] Running in Expo Go - Push notifications will have limited functionality');
      }
      
      // Request permissions
      await this.requestPermissions();
      
      // Only try to register for push notifications if not in Expo Go
      if (NotificationConfig.pushNotifications.enabled) {
        await this.registerForPushNotifications();
      } else {
        console.log('[NotificationService] Push notifications disabled - using local notifications only');
      }
      
      // Set up notification categories (works in Expo Go)
      await this.setupNotificationCategories();
      
      // Listen for notifications
      this.setupNotificationListeners();
      
      console.log('[NotificationService] Initialization complete');
    } catch (error) {
      console.error('[NotificationService] Failed to initialize:', error);
    }
  }

  async requestPermissions(): Promise<boolean> {
    // For now, assume we're on a real device in development
    const isDevice = Platform.OS !== 'web';
    
    if (!isDevice) {
      console.warn('Push notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return false;
    }

    return true;
  }

  async registerForPushNotifications(): Promise<string | null> {
    try {
      const isDevice = Platform.OS !== 'web';
      
      if (!isDevice) {
        console.log('[NotificationService] Web platform - push notifications not supported');
        return null;
      }

      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        console.warn('[NotificationService] Push notification permissions not granted');
        return null;
      }

      // Handle Expo Go limitations
      if (NotificationConfig.isExpoGo) {
        console.log('[NotificationService] Expo Go detected - using mock token for development');
        this.expoPushToken = 'expo-go-mock-token';
        await AsyncStorage.setItem('pushToken', this.expoPushToken);
        return this.expoPushToken;
      }

      // Get the push token for production/development builds
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: NotificationConfig.pushNotifications.projectId,
      });

      this.expoPushToken = token.data;
      console.log('[NotificationService] Expo push token obtained:', this.expoPushToken?.substring(0, 20) + '...');

      // Store token locally and send to backend
      if (this.expoPushToken) {
        await AsyncStorage.setItem('pushToken', this.expoPushToken);
        try {
          await this.sendTokenToBackend(this.expoPushToken);
        } catch (backendError) {
          console.warn('[NotificationService] Failed to send token to backend:', backendError);
        }
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('[NotificationService] Failed to register for push notifications:', error);
      
      // Only show detailed errors in development
      if (NotificationConfig.isDevelopment && error instanceof Error) {
        if (error.message?.includes('projectId')) {
          console.warn('[NotificationService] Project ID not configured - this is expected in development');
        }
      }
      
      return null;
    }
  }

  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      const userData = await AsyncStorage.getItem('current_user');
      if (!userData) return;

      // Add PUT method to apiService or use a different approach
      const response = await fetch('/users/push-token', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers if needed
        },
        body: JSON.stringify({ pushToken: token }),
      });
      
      if (!response.ok) {
        console.error('Failed to send push token to backend');
      }
    } catch (error) {
      console.error('Failed to send push token to backend:', error);
    }
  }

  async setupNotificationCategories(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync('appointment_reminder', [
        {
          identifier: 'view_appointment',
          buttonTitle: 'View Details',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'reschedule',
          buttonTitle: 'Reschedule',
          options: { opensAppToForeground: true },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('health_alert', [
        {
          identifier: 'view_alert',
          buttonTitle: 'View Alert',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'dismiss',
          buttonTitle: 'Dismiss',
          options: { opensAppToForeground: false },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('medication_reminder', [
        {
          identifier: 'mark_taken',
          buttonTitle: 'Mark as Taken',
          options: { opensAppToForeground: false },
        },
        {
          identifier: 'snooze',
          buttonTitle: 'Remind Later',
          options: { opensAppToForeground: false },
        },
      ]);
    } catch (error) {
      console.error('Failed to setup notification categories:', error);
    }
  }

  setupNotificationListeners(): void {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification: Notifications.Notification) => {
      console.log('Notification received:', notification);
      // You can handle foreground notifications here
    });

    // Handle notification tapped
    Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { notification, actionIdentifier } = response;
    const data = notification.request.content.data;

    switch (actionIdentifier) {
      case 'view_appointment':
        // Navigate to appointment details
        if (data.appointmentId && typeof data.appointmentId === 'string') {
          this.navigateToAppointment(data.appointmentId);
        }
        break;
      case 'view_alert':
        // Navigate to alerts
        this.navigateToAlerts();
        break;
      case 'mark_taken':
        // Mark medication as taken
        if (data.medicationId && typeof data.medicationId === 'string') {
          this.markMedicationTaken(data.medicationId);
        }
        break;
      case 'snooze':
        // Snooze medication reminder
        if (data.medicationId && typeof data.medicationId === 'string') {
          this.snoozeMedicationReminder(data.medicationId);
        }
        break;
      default:
        // Handle default tap
        this.handleDefaultTap(data);
    }
  }

  async scheduleLocalNotification(notification: ScheduledNotification): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          categoryIdentifier: notification.data?.categoryId,
        },
        trigger: notification.trigger,
      });

      console.log('Scheduled local notification:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule local notification:', error);
      throw error;
    }
  }

  async scheduleAppointmentReminder(appointment: any): Promise<string[]> {
    const scheduledIds: string[] = [];
    
    try {
      const appointmentDate = new Date(appointment.date + ' ' + appointment.time);
      
      // Schedule reminder 24 hours before
      const oneDayBefore = new Date(appointmentDate);
      oneDayBefore.setHours(oneDayBefore.getHours() - 24);
      
      if (oneDayBefore > new Date()) {
        const id1 = await this.scheduleLocalNotification({
          id: `appointment_${appointment.id}_24h`,
          title: 'Appointment Tomorrow',
          body: `You have an appointment with ${appointment.doctor} tomorrow at ${appointment.time}`,
          trigger: {
            date: oneDayBefore,
          } as any,
          data: {
            type: 'appointment_reminder',
            appointmentId: appointment.id,
            categoryId: 'appointment_reminder',
          },
        });
        scheduledIds.push(id1);
      }

      // Schedule reminder 1 hour before
      const oneHourBefore = new Date(appointmentDate);
      oneHourBefore.setHours(oneHourBefore.getHours() - 1);
      
      if (oneHourBefore > new Date()) {
        const id2 = await this.scheduleLocalNotification({
          id: `appointment_${appointment.id}_1h`,
          title: 'Appointment in 1 Hour',
          body: `Your appointment with ${appointment.doctor} is in 1 hour`,
          trigger: {
            date: oneHourBefore,
          } as any,
          data: {
            type: 'appointment_reminder',
            appointmentId: appointment.id,
            categoryId: 'appointment_reminder',
          },
        });
        scheduledIds.push(id2);
      }

      return scheduledIds;
    } catch (error) {
      console.error('Failed to schedule appointment reminders:', error);
      return scheduledIds;
    }
  }

  async scheduleMedicationReminder(medication: any): Promise<string[]> {
    const scheduledIds: string[] = [];
    
    try {
      // Schedule daily reminders at specified times
      const times = medication.times || ['09:00', '13:00', '19:00']; // Default times
      
      for (const time of times) {
        const [hours, minutes] = time.split(':').map(Number);
        
        const id = await this.scheduleLocalNotification({
          id: `medication_${medication.id}_${time}`,
          title: 'Medication Reminder',
          body: `Time to take your ${medication.name}`,
          trigger: {
            repeats: true,
            hour: hours,
            minute: minutes,
          } as any,
          data: {
            type: 'medication_reminder',
            medicationId: medication.id,
            categoryId: 'medication_reminder',
          },
        });
        scheduledIds.push(id);
      }

      return scheduledIds;
    } catch (error) {
      console.error('Failed to schedule medication reminders:', error);
      return scheduledIds;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Cancelled notification:', notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all notifications');
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  async getPendingNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get pending notifications:', error);
      return [];
    }
  }

  // Navigation handlers (implement based on your navigation structure)
  private navigateToAppointment(appointmentId: string): void {
    // Implement navigation to appointment details
    console.log('Navigate to appointment:', appointmentId);
  }

  private navigateToAlerts(): void {
    // Implement navigation to alerts screen
    console.log('Navigate to alerts');
  }

  private markMedicationTaken(medicationId: string): void {
    // Implement medication tracking
    console.log('Mark medication taken:', medicationId);
  }

  private snoozeMedicationReminder(medicationId: string): void {
    // Implement snooze functionality
    console.log('Snooze medication reminder:', medicationId);
  }

  private handleDefaultTap(data: any): void {
    // Handle default notification tap
    console.log('Default notification tap:', data);
  }

  // Get current push token
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  // Test notification (for development)
  async sendTestNotification(): Promise<void> {
    try {
      await this.scheduleLocalNotification({
        id: 'test',
        title: 'Test Notification',
        body: 'This is a test notification from MamaCare',
        trigger: { 
          seconds: 1 
        } as any,
        data: { type: 'test' },
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  }
}

export const notificationService = new NotificationService();
