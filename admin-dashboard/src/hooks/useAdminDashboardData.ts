import { useState, useEffect, useCallback } from 'react';
import { adminAPI, userManagementAPI } from '../services/api';

export interface AdminDashboardData {
  users: {
    total: number;
    active: number;
    recent: number;
    byRole: Record<string, number>;
  };
  system: {
    uptime: string;
    uptimeHours: number;
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    networkLatency: number;
    errorRate: string;
  };
  activity: {
    apiCalls: number;
    apiCallsChange: string;
    errorRateChange: string;
    uptimeChange: string;
  };
  alerts: Array<{
    id: number;
    type: string;
    severity: string;
    message: string;
    timestamp: string;
  }>;
}

export const useAdminDashboardData = (autoRefresh: boolean = true) => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchAdminDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await adminAPI.getDashboardStats();
      
      if (result.success) {
        setData(result.data);
        setLastUpdate(new Date());
      } else {
        throw new Error(result.message || 'Failed to fetch admin dashboard data');
      }
    } catch (err) {
      console.error('Admin dashboard data error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminDashboardData();
    
    // Auto-refresh every 60 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchAdminDashboardData, 60000);
      return () => clearInterval(interval);
    }
  }, [fetchAdminDashboardData, autoRefresh]);

  const refetch = () => {
    fetchAdminDashboardData();
  };

  return {
    data,
    loading,
    error,
    refetch,
    lastUpdate
  };
};
