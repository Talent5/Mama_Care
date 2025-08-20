/**
 * Notification Configuration for MamaCare
 * Handles both development (Expo Go) and production environments
 */

import Constants from 'expo-constants';

export const NotificationConfig = {
  // Check if running in Expo Go
  isExpoGo: Constants.appOwnership === 'expo',
  
  // Development vs Production settings
  isDevelopment: __DEV__,
  
  // Push notification settings
  pushNotifications: {
    enabled: !Constants.appOwnership || Constants.appOwnership !== 'expo',
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
    
    // Fallback for development
    useMockToken: Constants.appOwnership === 'expo',
  },
  
  // Local notification settings (these work in Expo Go)
  localNotifications: {
    enabled: true,
    categories: {
      appointment: 'appointment_reminder',
      medication: 'medication_reminder',
      health: 'health_alert',
      general: 'general',
    },
  },
  
  // Notification channels for Android
  channels: {
    default: {
      name: 'Default',
      importance: 'NORMAL',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    },
    health: {
      name: 'Health Alerts',
      importance: 'HIGH',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    },
    reminders: {
      name: 'Reminders',
      importance: 'NORMAL',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    },
  },
  
  // Development warnings
  developmentWarnings: {
    showExpoGoLimitations: true,
    showPushTokenErrors: false, // Don't show in development
  },
};

export default NotificationConfig;
