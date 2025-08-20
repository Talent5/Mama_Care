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
  const [retryCount, setRetryCount] = useState(0);

  const fetchDashboardData = useCallback(async (isRetry = false) => {
    try {
      // Don't show loading on retries to prevent UI flicker
      if (!isRetry) {
        setLoading(true);
      }
      setError(null);
      
      const result = await analyticsAPI.getDashboardStats(period);
      
      if (result.success && result.data) {
        setData(result.data);
        setLastUpdate(new Date());
        setRetryCount(0); // Reset retry count on success
      } else {
        throw new Error(result.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Dashboard data error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      
      // Check if it's a rate limit or auth error
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        setError('Rate limit exceeded. Please wait before refreshing.');
        // Stop auto-refresh temporarily when rate limited
        return 'rate_limited';
      } else if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        setError('Authentication failed. Please login again.');
        return 'auth_error';
      } else {
        setError(errorMessage);
        setRetryCount(prev => prev + 1);
      }
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
    }
    return 'success';
  }, [period]);

  useEffect(() => {
    let isMounted = true;
    let intervalId: number | null = null;

    const initData = async () => {
      if (!isMounted) return;
      await fetchDashboardData();
    };

    initData();
    
    // Auto-refresh with exponential backoff on errors
    if (autoRefresh && isMounted) {
      const refreshInterval = retryCount > 0 ? Math.min(60000 * Math.pow(2, retryCount), 300000) : 60000; // Start at 1 min, max 5 min
      
      intervalId = window.setInterval(async () => {
        if (!isMounted) return;
        
        // Skip refresh if too many retries
        if (retryCount >= 5) {
          console.warn('Dashboard auto-refresh disabled due to repeated failures');
          return;
        }
        
        const result = await fetchDashboardData(true);
        // Stop auto-refresh on rate limit or auth errors
        if (result === 'rate_limited' || result === 'auth_error') {
          if (intervalId) clearInterval(intervalId);
        }
      }, refreshInterval);
    }

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchDashboardData, autoRefresh, retryCount]);

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
