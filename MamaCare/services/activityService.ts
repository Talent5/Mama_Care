import { apiClient, ApiResponse } from '../config/api';

export interface ActivityData {
  type: 'health_metric' | 'symptom_log' | 'appointment_action' | 'emergency_call' | 'app_usage' | 'medication' | 'reading';
  description: string;
  metadata?: {
    [key: string]: any;
  };
  value?: number;
  unit?: string;
  severity?: 'mild' | 'moderate' | 'severe';
}

export interface HealthMetric {
  type: 'water_intake' | 'prenatal_vitamins' | 'exercise' | 'sleep' | 'weight' | 'blood_pressure' | 'heart_rate';
  value: number;
  unit: string;
  notes?: string;
  recordedAt?: string;
}

export interface SymptomLog {
  symptoms: string[];
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
  recordedAt?: string;
}

class ActivityService {
  private static instance: ActivityService;

  static getInstance(): ActivityService {
    if (!ActivityService.instance) {
      ActivityService.instance = new ActivityService();
    }
    return ActivityService.instance;
  }

  // Track general activity
  async trackActivity(activityData: ActivityData): Promise<ApiResponse> {
    try {
      return await apiClient.post('/dashboard/activity', activityData);
    } catch (error) {
      console.error('Failed to track activity:', error);
      // Don't throw error - activity tracking should be silent
      return { success: false, message: 'Failed to track activity' };
    }
  }

  // Record health metrics (water, vitamins, etc.)
  async recordHealthMetric(metric: HealthMetric): Promise<ApiResponse> {
    try {
      const response = await apiClient.post('/dashboard/health-metrics', metric);
      
      // Also track as general activity
      await this.trackActivity({
        type: 'health_metric',
        description: `Recorded ${metric.type}: ${metric.value} ${metric.unit}`,
        metadata: {
          metricType: metric.type,
          value: metric.value,
          unit: metric.unit
        }
      });

      return response;
    } catch (error) {
      console.error('Failed to record health metric:', error);
      throw error;
    }
  }

  // Log symptoms
  async logSymptoms(symptomLog: SymptomLog): Promise<ApiResponse> {
    try {
      const response = await apiClient.post('/dashboard/symptom-logs', symptomLog);
      
      // Also track as general activity
      await this.trackActivity({
        type: 'symptom_log',
        description: `Logged symptoms: ${symptomLog.symptoms.join(', ')}`,
        metadata: {
          symptoms: symptomLog.symptoms,
          severity: symptomLog.severity
        },
        severity: symptomLog.severity
      });

      return response;
    } catch (error) {
      console.error('Failed to log symptoms:', error);
      throw error;
    }
  }

  // Track medication taking
  async trackMedication(medicationName: string, taken: boolean = true): Promise<ApiResponse> {
    try {
      const response = await this.trackActivity({
        type: 'medication',
        description: taken ? `Completed ${medicationName}` : `Missed ${medicationName}`,
        metadata: {
          medicationName,
          taken,
          timestamp: new Date().toISOString()
        }
      });

      return response;
    } catch (error) {
      console.error('Failed to track medication:', error);
      return { success: false, message: 'Failed to track medication' };
    }
  }

  // Track emergency calls
  async trackEmergencyCall(type: 'ambulance' | 'maternity_ward'): Promise<ApiResponse> {
    try {
      const response = await apiClient.post('/dashboard/emergency-call', { type });
      
      // Also track as general activity
      await this.trackActivity({
        type: 'emergency_call',
        description: `Initiated emergency call: ${type}`,
        metadata: {
          callType: type,
          timestamp: new Date().toISOString()
        }
      });

      return response;
    } catch (error) {
      console.error('Failed to track emergency call:', error);
      throw error;
    }
  }

  // Track app usage patterns
  async trackAppUsage(screen: string, duration?: number): Promise<ApiResponse> {
    try {
      return await this.trackActivity({
        type: 'app_usage',
        description: `Viewed ${screen}`,
        metadata: {
          screen,
          duration,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to track app usage:', error);
      return { success: false, message: 'Failed to track app usage' };
    }
  }

  // Track educational content reading
  async trackReading(contentTitle: string, contentType: 'article' | 'tip' | 'guide'): Promise<ApiResponse> {
    try {
      return await this.trackActivity({
        type: 'reading',
        description: `Read ${contentType}: ${contentTitle}`,
        metadata: {
          contentTitle,
          contentType,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to track reading:', error);
      return { success: false, message: 'Failed to track reading' };
    }
  }

  // Get user's activity history
  async getActivityHistory(limit: number = 20): Promise<ApiResponse<any[]>> {
    try {
      return await apiClient.get(`/dashboard/activity?limit=${limit}`);
    } catch (error) {
      console.error('Failed to get activity history:', error);
      throw error;
    }
  }

  // Sync offline activities when connection is restored
  async syncOfflineActivities(activities: ActivityData[]): Promise<ApiResponse> {
    try {
      return await apiClient.post('/dashboard/activity/sync', { activities });
    } catch (error) {
      console.error('Failed to sync offline activities:', error);
      throw error;
    }
  }
}

export default ActivityService.getInstance();
