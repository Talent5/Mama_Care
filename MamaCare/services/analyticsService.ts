import { apiClient, ApiResponse } from '../config/api';

export interface DashboardStats {
  patients: {
    total: number;
    active: number;
    pregnant: number;
    highRisk: number;
    newThisMonth: number;
  };
  appointments: {
    total: number;
    today: number;
    thisWeek: number;
    completed: number;
    cancelled: number;
    pending: number;
  };
  alerts: {
    total: number;
    active: number;
    critical: number;
    acknowledged: number;
    resolved: number;
  };
  health: {
    averageRiskScore: number;
    totalVisits: number;
    completionRate: number;
    emergencyRate: number;
  };
}

export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  patientId?: string;
  providerId?: string;
  location?: string;
}

export interface TrendData {
  date: string;
  value: number;
  label?: string;
}

export interface PerformanceMetrics {
  appointmentCompletionRate: number;
  averageWaitTime: number;
  patientSatisfactionScore: number;
  emergencyResponseTime: number;
  followUpComplianceRate: number;
}

export interface HealthMetrics {
  totalPatients: number;
  pregnantPatients: number;
  highRiskPatients: number;
  deliveries: number;
  vaccinations: number;
  ancVisits: number;
  complications: number;
  mortalityRate: number;
}

export interface GeographicData {
  region: string;
  patientCount: number;
  riskLevel: 'low' | 'medium' | 'high';
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ReportData {
  summary: DashboardStats;
  trends: {
    patients: TrendData[];
    appointments: TrendData[];
    alerts: TrendData[];
  };
  performance: PerformanceMetrics;
  health: HealthMetrics;
  geographic: GeographicData[];
  recommendations: string[];
}

class AnalyticsService {
  async getDashboardStats(filters?: AnalyticsFilters): Promise<ApiResponse<DashboardStats>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/analytics/dashboard${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await apiClient.get<DashboardStats>(endpoint);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  }

  async getPatientTrends(filters?: AnalyticsFilters): Promise<ApiResponse<TrendData[]>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/analytics/trends/patients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await apiClient.get<TrendData[]>(endpoint);
    } catch (error) {
      console.error('Failed to fetch patient trends:', error);
      throw error;
    }
  }

  async getAppointmentTrends(filters?: AnalyticsFilters): Promise<ApiResponse<TrendData[]>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/analytics/trends/appointments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await apiClient.get<TrendData[]>(endpoint);
    } catch (error) {
      console.error('Failed to fetch appointment trends:', error);
      throw error;
    }
  }

  async getPerformanceMetrics(filters?: AnalyticsFilters): Promise<ApiResponse<PerformanceMetrics>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/analytics/performance${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await apiClient.get<PerformanceMetrics>(endpoint);
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
      throw error;
    }
  }

  async getHealthMetrics(filters?: AnalyticsFilters): Promise<ApiResponse<HealthMetrics>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/analytics/health${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await apiClient.get<HealthMetrics>(endpoint);
    } catch (error) {
      console.error('Failed to fetch health metrics:', error);
      throw error;
    }
  }

  async getGeographicData(filters?: AnalyticsFilters): Promise<ApiResponse<GeographicData[]>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/analytics/geographic${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await apiClient.get<GeographicData[]>(endpoint);
    } catch (error) {
      console.error('Failed to fetch geographic data:', error);
      throw error;
    }
  }

  async generateReport(filters?: AnalyticsFilters): Promise<ApiResponse<ReportData>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/analytics/report${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await apiClient.get<ReportData>(endpoint);
    } catch (error) {
      console.error('Failed to generate report:', error);
      throw error;
    }
  }

  // Specific analytics queries
  async getPatientGrowth(period: 'month' | 'quarter' | 'year' = 'month'): Promise<ApiResponse<TrendData[]>> {
    try {
      return await this.getPatientTrends({ period });
    } catch (error) {
      console.error('Failed to fetch patient growth:', error);
      throw error;
    }
  }

  async getAppointmentCompletion(period: 'month' | 'quarter' | 'year' = 'month'): Promise<ApiResponse<TrendData[]>> {
    try {
      return await this.getAppointmentTrends({ period });
    } catch (error) {
      console.error('Failed to fetch appointment completion:', error);
      throw error;
    }
  }

  async getRiskAnalysis(): Promise<ApiResponse<{
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    riskFactors: {
      factor: string;
      count: number;
      percentage: number;
    }[];
  }>> {
    try {
      return await apiClient.get('/analytics/risk-analysis');
    } catch (error) {
      console.error('Failed to fetch risk analysis:', error);
      throw error;
    }
  }

  async getResourceUtilization(): Promise<ApiResponse<{
    bedOccupancy: number;
    staffUtilization: number;
    equipmentUsage: number;
    facilityCapacity: number;
  }>> {
    try {
      return await apiClient.get('/analytics/resource-utilization');
    } catch (error) {
      console.error('Failed to fetch resource utilization:', error);
      throw error;
    }
  }

  // Export and sharing
  async exportReport(format: 'pdf' | 'excel' | 'csv', filters?: AnalyticsFilters): Promise<ApiResponse<{ downloadUrl: string }>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/analytics/export?${queryParams.toString()}`;
      return await apiClient.get<{ downloadUrl: string }>(endpoint);
    } catch (error) {
      console.error('Failed to export report:', error);
      throw error;
    }
  }

  // Real-time data
  async getRealtimeStats(): Promise<ApiResponse<{
    activeUsers: number;
    ongoingAppointments: number;
    criticalAlerts: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  }>> {
    try {
      return await apiClient.get('/analytics/realtime');
    } catch (error) {
      console.error('Failed to fetch realtime stats:', error);
      throw error;
    }
  }

  // Custom analytics
  async runCustomQuery(query: {
    metrics: string[];
    dimensions: string[];
    filters: Record<string, any>;
    dateRange: {
      start: string;
      end: string;
    };
  }): Promise<ApiResponse<any>> {
    try {
      return await apiClient.post('/analytics/custom', query);
    } catch (error) {
      console.error('Failed to run custom query:', error);
      throw error;
    }
  }
}

export default new AnalyticsService();
