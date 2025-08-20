import { Expo } from 'expo-server-sdk';
import User from '../models/User.js';
import NotificationSettings from '../models/NotificationSettings.js';

// Create a new Expo SDK client
const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
  useFcmV1: true,
});

class PushNotificationService {
  /**
   * Send immediate push notification to users
   * @param {string|string[]} userIds - User ID(s) to send notifications to
   * @param {Object} notification - Notification data
   */
  async sendPushNotification(userIds, notification) {
    try {
      const userIdArray = Array.isArray(userIds) ? userIds : [userIds];
      
      // Get push tokens for users
      const users = await User.find({
        _id: { $in: userIdArray },
        pushToken: { $exists: true, $ne: null },
        isActive: true
      }).select('pushToken notificationSettings');

      if (users.length === 0) {
        console.warn('No users with push tokens found');
        return { success: false, errors: ['No users with push tokens found'] };
      }

      // Check notification settings for each user
      const validTokens = [];
      
      for (const user of users) {
        if (!user.pushToken) continue;
        
        // Check if push token is valid Expo token format
        if (!Expo.isExpoPushToken(user.pushToken)) {
          console.warn(`Invalid push token for user ${user._id}: ${user.pushToken}`);
          continue;
        }

        // Check user notification settings
        const canSendNotification = await this.canSendNotification(user._id, notification.categoryId);
        if (canSendNotification) {
          validTokens.push(user.pushToken);
        }
      }

      if (validTokens.length === 0) {
        return { success: false, errors: ['No valid tokens or notifications disabled'] };
      }

      // Create messages
      const messages = validTokens.map(token => ({
        to: token,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        categoryId: notification.categoryId,
        badge: notification.badge,
        channelId: notification.channelId || 'default',
        priority: notification.priority || 'high',
        ttl: notification.ttl || 2419200, // 4 weeks
      }));

      // Send notifications in chunks
      const chunks = expo.chunkPushNotifications(messages);
      const results = [];
      const errors = [];

      for (const chunk of chunks) {
        try {
          const chunkResult = await expo.sendPushNotificationsAsync(chunk);
          results.push(...chunkResult);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
          errors.push(error);
        }
      }

      console.log(`Sent ${results.length} push notifications`);
      
      return {
        success: results.length > 0,
        results,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('Error in sendPushNotification:', error);
      return {
        success: false,
        errors: [error.message || 'Unknown error'],
      };
    }
  }

  /**
   * Send appointment reminder notification
   */
  async sendAppointmentReminder(userId, appointmentData, reminderType) {
    try {
      const title = reminderType === '24h' 
        ? 'Appointment Tomorrow'
        : 'Appointment in 1 Hour';
      
      const body = reminderType === '24h'
        ? `You have an appointment with ${appointmentData.doctor} tomorrow at ${appointmentData.time}`
        : `Your appointment with ${appointmentData.doctor} is in 1 hour`;

      const result = await this.sendPushNotification(userId, {
        title,
        body,
        categoryId: 'appointment_reminder',
        data: {
          type: 'appointment_reminder',
          appointmentId: appointmentData.id,
          reminderType,
        },
      });

      return result.success;
    } catch (error) {
      console.error('Error sending appointment reminder:', error);
      return false;
    }
  }

  /**
   * Send medication reminder notification
   */
  async sendMedicationReminder(userId, medicationData) {
    try {
      const result = await this.sendPushNotification(userId, {
        title: 'Medication Reminder',
        body: `Time to take your ${medicationData.name}`,
        categoryId: 'medication_reminder',
        data: {
          type: 'medication_reminder',
          medicationId: medicationData.id,
        },
      });

      return result.success;
    } catch (error) {
      console.error('Error sending medication reminder:', error);
      return false;
    }
  }

  /**
   * Send health alert notification
   */
  async sendHealthAlert(userId, alertData) {
    try {
      const result = await this.sendPushNotification(userId, {
        title: 'Health Alert',
        body: alertData.message,
        categoryId: 'health_alert',
        priority: 'high',
        data: {
          type: 'health_alert',
          alertId: alertData.id,
          severity: alertData.severity,
        },
      });

      return result.success;
    } catch (error) {
      console.error('Error sending health alert:', error);
      return false;
    }
  }

  /**
   * Send general notification
   */
  async sendGeneralNotification(userIds, title, body, data) {
    try {
      const result = await this.sendPushNotification(userIds, {
        title,
        body,
        categoryId: 'general',
        data,
      });

      return result.success;
    } catch (error) {
      console.error('Error sending general notification:', error);
      return false;
    }
  }

  /**
   * Update user's push token
   */
  async updatePushToken(userId, pushToken) {
    try {
      // Validate token format
      if (!Expo.isExpoPushToken(pushToken)) {
        console.warn(`Invalid push token format: ${pushToken}`);
        return false;
      }

      await User.findByIdAndUpdate(userId, { pushToken });
      console.log(`Updated push token for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error updating push token:', error);
      return false;
    }
  }

  /**
   * Remove user's push token
   */
  async removePushToken(userId) {
    try {
      await User.findByIdAndUpdate(userId, { $unset: { pushToken: "" } });
      console.log(`Removed push token for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error removing push token:', error);
      return false;
    }
  }

  /**
   * Check if we can send a notification to a user based on their settings
   */
  async canSendNotification(userId, categoryId) {
    try {
      const settings = await NotificationSettings.findOne({ user: userId });
      
      if (!settings || !settings.isActive) {
        return true; // Default to allowing notifications
      }

      const currentTime = new Date();
      const effectiveSettings = settings.getEffectiveSettings(currentTime);

      // Check category-specific settings
      switch (categoryId) {
        case 'appointment_reminder':
          return effectiveSettings.pushNotifications.healthReminders;
        
        case 'medication_reminder':
          return effectiveSettings.pushNotifications.healthReminders;
        
        case 'health_alert':
          return effectiveSettings.pushNotifications.generalUpdates;
        
        case 'general':
        default:
          return effectiveSettings.pushNotifications.generalUpdates;
      }
    } catch (error) {
      console.error('Error checking notification settings:', error);
      return true; // Default to allowing notifications
    }
  }

  /**
   * Handle push notification receipts
   */
  async handlePushReceipts(receiptIds) {
    try {
      const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
      
      for (const chunk of receiptIdChunks) {
        try {
          const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
          
          for (const receiptId in receipts) {
            const receipt = receipts[receiptId];
            
            if (receipt.status === 'ok') {
              continue;
            } else if (receipt.status === 'error') {
              console.error(`Error in push receipt ${receiptId}:`, receipt.message);
              
              if (receipt.details && receipt.details.error) {
                const errorCode = receipt.details.error;
                
                if (errorCode === 'DeviceNotRegistered') {
                  // Remove invalid push token
                  console.log(`Removing invalid push token for receipt ${receiptId}`);
                  // You might want to track which user this belongs to and remove their token
                }
              }
            }
          }
        } catch (error) {
          console.error('Error handling push receipt chunk:', error);
        }
      }
    } catch (error) {
      console.error('Error handling push receipts:', error);
    }
  }

  /**
   * Send test notification (for development)
   */
  async sendTestNotification(userId) {
    try {
      const result = await this.sendPushNotification(userId, {
        title: 'Test Notification',
        body: 'This is a test notification from MamaCare backend',
        data: { type: 'test' },
      });

      return result.success;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }

  /**
   * Broadcast notification to all active users
   */
  async broadcastNotification(title, body, data) {
    try {
      const activeUsers = await User.find({
        isActive: true,
        pushToken: { $exists: true, $ne: null }
      }).select('_id');

      const userIds = activeUsers.map(user => user._id.toString());
      
      if (userIds.length === 0) {
        return { success: false, sentCount: 0, errorCount: 1 };
      }

      const result = await this.sendPushNotification(userIds, {
        title,
        body,
        data,
      });

      const sentCount = result.results?.length || 0;
      const errorCount = result.errors?.length || 0;

      return {
        success: result.success,
        sentCount,
        errorCount,
      };
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      return { success: false, sentCount: 0, errorCount: 1 };
    }
  }
}

export default new PushNotificationService();
