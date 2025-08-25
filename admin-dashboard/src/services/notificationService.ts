import { alertsAPI } from './api';
import type { AlertData } from '../types/api';

export interface NotificationData {
  id: string;
  type: 'alert' | 'appointment' | 'system' | 'message';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationStats {
  unread: number;
  critical: number;
  warning: number;
  info: number;
  total: number;
}

class NotificationService {
  private notifications: NotificationData[] = [];
  private stats: NotificationStats = {
    unread: 0,
    critical: 0,
    warning: 0,
    info: 0,
    total: 0
  };
  private isLoading: boolean = false;
  private lastFetchTime: number = 0;
  private fetchCooldownMs: number = 60000; // Increased to 60 seconds cooldown between fetches
  private consecutiveErrors: number = 0;
  private maxConsecutiveErrors: number = 3;

  // Fetch notifications from alerts API
  async fetchNotifications(): Promise<NotificationData[]> {
    // Prevent multiple simultaneous requests and implement cooldown
    const now = Date.now();
    if (this.isLoading || (now - this.lastFetchTime) < this.fetchCooldownMs) {
      console.log('🔄 Skipping notification fetch (cooldown active or already loading)');
      return this.notifications;
    }

    // Exponential backoff for consecutive errors
    if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
      const backoffTime = Math.min(this.fetchCooldownMs * Math.pow(2, this.consecutiveErrors - this.maxConsecutiveErrors), 300000);
      if ((now - this.lastFetchTime) < backoffTime) {
        console.log(`🔄 Skipping notification fetch (error backoff active: ${backoffTime}ms)`);
        return this.notifications;
      }
    }

    this.isLoading = true;
    this.lastFetchTime = now;

    try {
      // Fetch unresolved alerts with a shorter timeout for this specific request
      const alertsResponse = await Promise.race([
        alertsAPI.getAlerts({
          resolved: 'false',
          limit: '50',
          page: '1'
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Notification fetch timeout')), 20000) // 20 second timeout
        )
      ]);

      if (alertsResponse.success && alertsResponse.data?.alerts) {
        this.notifications = alertsResponse.data.alerts.map(this.alertToNotification);
        this.updateStats();
        this.consecutiveErrors = 0; // Reset error count on success
        console.log('✅ Successfully fetched notifications');
        return this.notifications;
      }

      console.log('⚠️ No notification data in response');
      return [];
    } catch (error: unknown) {
      this.consecutiveErrors++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to fetch notifications:', errorMessage);
      // Return cached notifications on error
      return this.notifications;
    } finally {
      this.isLoading = false;
    }
  }

  // Convert alert to notification format
  private alertToNotification(alert: AlertData): NotificationData {
    const typeMap = {
      'high_risk': 'alert',
      'missed_appointment': 'appointment',
      'overdue_visit': 'appointment',
      'emergency': 'alert'
    } as const;

    const titleMap = {
      'high_risk': 'High Risk Patient Alert',
      'missed_appointment': 'Missed Appointment',
      'overdue_visit': 'Overdue Visit',
      'emergency': 'Emergency Alert'
    };

    return {
      id: alert.id,
      type: typeMap[alert.type] || 'alert',
      severity: alert.severity,
      title: titleMap[alert.type] || 'Alert',
      message: alert.message,
      timestamp: alert.timestamp,
      read: alert.resolved,
      actionUrl: alert.patientId ? `/patients/${alert.patientId}` : undefined,
      metadata: {
        alertType: alert.type,
        patientId: alert.patientId,
        patientName: alert.patientName,
        ...alert.metadata
      }
    };
  }

  // Get notification stats
  async getStats(): Promise<NotificationStats> {
    // Prevent multiple simultaneous requests and implement cooldown
    const now = Date.now();
    if (this.isLoading || (now - this.lastFetchTime) < this.fetchCooldownMs) {
      console.log('🔄 Returning cached notification stats (cooldown active)');
      return this.stats;
    }

    // Exponential backoff for consecutive errors
    if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
      const backoffTime = Math.min(this.fetchCooldownMs * Math.pow(2, this.consecutiveErrors - this.maxConsecutiveErrors), 300000);
      if ((now - this.lastFetchTime) < backoffTime) {
        console.log(`🔄 Returning cached stats (error backoff active: ${backoffTime}ms)`);
        return this.stats;
      }
    }

    try {
      // Race the API call with a timeout
      const alertStatsResponse = await Promise.race([
        alertsAPI.getAlertStats(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Stats fetch timeout')), 20000) // 20 second timeout
        )
      ]);
      
      if (alertStatsResponse.success && alertStatsResponse.data) {
        const alertStats = alertStatsResponse.data;
        
        this.stats = {
          unread: alertStats.totalUnresolved || 0,
          critical: alertStats.critical || 0,
          warning: alertStats.warning || 0,
          info: alertStats.info || 0,
          total: alertStats.totalUnresolved || 0
        };
        this.consecutiveErrors = 0; // Reset error count on success
        console.log('✅ Successfully fetched notification stats');
      }

      return this.stats;
    } catch (error: unknown) {
      this.consecutiveErrors++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to fetch notification stats:', errorMessage);
      // Return cached stats on error
      return this.stats;
    }
  }

  // Update local stats
  private updateStats(): void {
    this.stats = {
      unread: this.notifications.filter(n => !n.read).length,
      critical: this.notifications.filter(n => n.severity === 'critical').length,
      warning: this.notifications.filter(n => n.severity === 'warning').length,
      info: this.notifications.filter(n => n.severity === 'info').length,
      total: this.notifications.length
    };
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      // Find the notification
      const notification = this.notifications.find(n => n.id === notificationId);
      if (!notification) return false;

      // If it's an alert, resolve it
      if (notification.type === 'alert') {
        await alertsAPI.resolveAlert(notificationId, 'Marked as read from notification panel');
      }

      // Update local state
      notification.read = true;
      this.updateStats();

      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<boolean> {
    try {
      const unreadNotifications = this.notifications.filter(n => !n.read);
      
      // Resolve all alert notifications
      const alertPromises = unreadNotifications
        .filter(n => n.type === 'alert')
        .map(n => alertsAPI.resolveAlert(n.id, 'Marked as read (bulk action)'));

      await Promise.allSettled(alertPromises);

      // Update local state
      this.notifications.forEach(n => n.read = true);
      this.updateStats();

      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  }

  // Get recent notifications
  getRecentNotifications(limit: number = 10): NotificationData[] {
    return this.notifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Get unread notifications
  getUnreadNotifications(): NotificationData[] {
    return this.notifications.filter(n => !n.read);
  }

  // Get notifications by type
  getNotificationsByType(type: NotificationData['type']): NotificationData[] {
    return this.notifications.filter(n => n.type === type);
  }

  // Get notifications by severity
  getNotificationsBySeverity(severity: NotificationData['severity']): NotificationData[] {
    return this.notifications.filter(n => n.severity === severity);
  }

  // Format time ago for display
  formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - notificationTime.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) > 1 ? 's' : ''} ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) > 1 ? 's' : ''} ago`;
    
    return notificationTime.toLocaleDateString();
  }

  // Create a test notification (for development)
  createTestNotification(): NotificationData {
    const types: NotificationData['type'][] = ['alert', 'appointment', 'system', 'message'];
    const severities: NotificationData['severity'][] = ['critical', 'warning', 'info'];
    
    const type = types[Math.floor(Math.random() * types.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];

    const testNotification: NotificationData = {
      id: `test_${Date.now()}`,
      type,
      severity,
      title: `Test ${severity} notification`,
      message: `This is a test ${type} notification with ${severity} severity.`,
      timestamp: new Date().toISOString(),
      read: false,
      metadata: {
        isTest: true
      }
    };

    this.notifications.unshift(testNotification);
    this.updateStats();

    return testNotification;
  }

  // Get current stats without API call
  getCurrentStats(): NotificationStats {
    return { ...this.stats };
  }

  // Get current notifications without API call
  getCurrentNotifications(): NotificationData[] {
    return [...this.notifications];
  }

  // Reset fetch cooldown (for manual refresh)
  resetCooldown(): void {
    this.lastFetchTime = 0;
    this.consecutiveErrors = 0; // Also reset error count
    console.log('🔄 Notification fetch cooldown and error count reset');
  }

  // Check if service is currently loading
  isCurrentlyLoading(): boolean {
    return this.isLoading;
  }

  // Get current error state
  getErrorState(): { consecutiveErrors: number; isInBackoff: boolean } {
    const now = Date.now();
    const isInBackoff = this.consecutiveErrors >= this.maxConsecutiveErrors && 
      (now - this.lastFetchTime) < Math.min(this.fetchCooldownMs * Math.pow(2, this.consecutiveErrors - this.maxConsecutiveErrors), 300000);
    
    return {
      consecutiveErrors: this.consecutiveErrors,
      isInBackoff
    };
  }
}

export const notificationService = new NotificationService();
export default notificationService;
