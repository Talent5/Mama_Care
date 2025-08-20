import { apiClient, ApiResponse } from '../config/api';

export interface Alert {
  _id: string;
  type: 'system' | 'security' | 'health' | 'appointment' | 'medication' | 'emergency';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  targetUser?: string;
  targetRole?: string;
  patient?: string;
  appointment?: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface CreateAlertData {
  type: 'system' | 'security' | 'health' | 'appointment' | 'medication' | 'emergency';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  targetUser?: string;
  targetRole?: string;
  patient?: string;
  appointment?: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
}

export interface AlertFilters {
  type?: string;
  severity?: string;
  status?: string;
  targetUser?: string;
  targetRole?: string;
  patient?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}

export interface AlertStats {
  total: number;
  active: number;
  critical: number;
  acknowledged: number;
  resolved: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

class AlertService {
  async getAlerts(filters?: AlertFilters): Promise<ApiResponse<PaginatedResponse<Alert>>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/alerts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await apiClient.get<PaginatedResponse<Alert>>(endpoint);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      throw error;
    }
  }

  async getAlertById(id: string): Promise<ApiResponse<Alert>> {
    try {
      return await apiClient.get<Alert>(`/alerts/${id}`);
    } catch (error) {
      console.error('Failed to fetch alert:', error);
      throw error;
    }
  }

  async createAlert(alertData: CreateAlertData): Promise<ApiResponse<Alert>> {
    try {
      return await apiClient.post<Alert>('/alerts', alertData);
    } catch (error) {
      console.error('Failed to create alert:', error);
      throw error;
    }
  }

  async acknowledgeAlert(id: string): Promise<ApiResponse<Alert>> {
    try {
      return await apiClient.patch<Alert>(`/alerts/${id}/acknowledge`);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      throw error;
    }
  }

  async resolveAlert(id: string, resolution?: string): Promise<ApiResponse<Alert>> {
    try {
      const data = resolution ? { resolution } : {};
      return await apiClient.patch<Alert>(`/alerts/${id}/resolve`, data);
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      throw error;
    }
  }

  async dismissAlert(id: string): Promise<ApiResponse<Alert>> {
    try {
      return await apiClient.patch<Alert>(`/alerts/${id}/dismiss`);
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
      throw error;
    }
  }

  async deleteAlert(id: string): Promise<ApiResponse> {
    try {
      return await apiClient.delete(`/alerts/${id}`);
    } catch (error) {
      console.error('Failed to delete alert:', error);
      throw error;
    }
  }

  // Specific alert queries
  async getMyAlerts(filters?: Omit<AlertFilters, 'targetUser'>): Promise<ApiResponse<PaginatedResponse<Alert>>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/alerts/my${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await apiClient.get<PaginatedResponse<Alert>>(endpoint);
    } catch (error) {
      console.error('Failed to fetch my alerts:', error);
      throw error;
    }
  }

  async getActiveAlerts(): Promise<ApiResponse<Alert[]>> {
    try {
      const response = await this.getAlerts({ status: 'active' });
      return {
        ...response,
        data: response.data?.data || []
      };
    } catch (error) {
      console.error('Failed to fetch active alerts:', error);
      throw error;
    }
  }

  async getCriticalAlerts(): Promise<ApiResponse<Alert[]>> {
    try {
      const response = await this.getAlerts({ severity: 'critical', status: 'active' });
      return {
        ...response,
        data: response.data?.data || []
      };
    } catch (error) {
      console.error('Failed to fetch critical alerts:', error);
      throw error;
    }
  }

  async getUnacknowledgedAlerts(): Promise<ApiResponse<Alert[]>> {
    try {
      const response = await this.getAlerts({ status: 'active' });
      return {
        ...response,
        data: response.data?.data?.filter(alert => !alert.acknowledgedAt) || []
      };
    } catch (error) {
      console.error('Failed to fetch unacknowledged alerts:', error);
      throw error;
    }
  }

  // Patient-specific alerts
  async getPatientAlerts(patientId: string, filters?: Omit<AlertFilters, 'patient'>): Promise<ApiResponse<PaginatedResponse<Alert>>> {
    try {
      return await this.getAlerts({ ...filters, patient: patientId });
    } catch (error) {
      console.error('Failed to fetch patient alerts:', error);
      throw error;
    }
  }

  // Alert creation helpers
  async createHealthAlert(patientId: string, title: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<ApiResponse<Alert>> {
    try {
      return await this.createAlert({
        type: 'health',
        title,
        message,
        severity,
        patient: patientId
      });
    } catch (error) {
      console.error('Failed to create health alert:', error);
      throw error;
    }
  }

  async createAppointmentAlert(appointmentId: string, title: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<ApiResponse<Alert>> {
    try {
      return await this.createAlert({
        type: 'appointment',
        title,
        message,
        severity,
        appointment: appointmentId
      });
    } catch (error) {
      console.error('Failed to create appointment alert:', error);
      throw error;
    }
  }

  async createEmergencyAlert(title: string, message: string, patientId?: string): Promise<ApiResponse<Alert>> {
    try {
      return await this.createAlert({
        type: 'emergency',
        title,
        message,
        severity: 'critical',
        patient: patientId
      });
    } catch (error) {
      console.error('Failed to create emergency alert:', error);
      throw error;
    }
  }

  // Statistics
  async getAlertStats(): Promise<ApiResponse<AlertStats>> {
    try {
      return await apiClient.get<AlertStats>('/alerts/stats');
    } catch (error) {
      console.error('Failed to fetch alert stats:', error);
      throw error;
    }
  }

  // Bulk operations
  async bulkAcknowledgeAlerts(alertIds: string[]): Promise<ApiResponse<{ acknowledged: number }>> {
    try {
      return await apiClient.patch<{ acknowledged: number }>('/alerts/bulk-acknowledge', {
        alertIds
      });
    } catch (error) {
      console.error('Failed to bulk acknowledge alerts:', error);
      throw error;
    }
  }

  async bulkResolveAlerts(alertIds: string[], resolution?: string): Promise<ApiResponse<{ resolved: number }>> {
    try {
      return await apiClient.patch<{ resolved: number }>('/alerts/bulk-resolve', {
        alertIds,
        resolution
      });
    } catch (error) {
      console.error('Failed to bulk resolve alerts:', error);
      throw error;
    }
  }

  async bulkDismissAlerts(alertIds: string[]): Promise<ApiResponse<{ dismissed: number }>> {
    try {
      return await apiClient.patch<{ dismissed: number }>('/alerts/bulk-dismiss', {
        alertIds
      });
    } catch (error) {
      console.error('Failed to bulk dismiss alerts:', error);
      throw error;
    }
  }
}

export default new AlertService();
