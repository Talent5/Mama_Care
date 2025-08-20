import { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '../services/api';

export interface DashboardData {
  totalPatients: number;
  activePatients: number;
  todaysAppointments: number;
  pendingAppointments: number;
  highRiskPatients: number;
  ancCompletionRate: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  ancVisitsByStage: Record<string, number>;
  monthlyTrends: Array<{
    _id: string;
    count: number;
  }>;
  recentActivity: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    createdAt: string;
    riskFactors?: {
      level: string;
    };
  }>;
  upcomingAppointments: Array<{
    _id: string;
    appointmentDate: string;
    type: string;
    status: string;
    patient: {
      firstName: string;
      lastName: string;
      phone?: string;
    };
  }>;
}

export const useDashboardData = (period: string = '30d', autoRefresh: boolean = true) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await analyticsAPI.getDashboardStats(period);
      
      if (result.success) {
        setData(result.data);
        setLastUpdate(new Date());
      } else {
        throw new Error(result.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Dashboard data error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchDashboardData, autoRefresh]);

  const refetch = () => {
    fetchDashboardData();
  };

  return {
    data,
    loading,
    error,
    refetch,
    lastUpdate
  };
};
