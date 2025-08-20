import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

interface ActivityAnalytics {
  totalActivities: number;
  activeUsers: number;
  activePatients: number;
  averageActivitiesPerUser: number;
  activitiesByType: Record<string, number>;
  emergencyCallsCount: number;
  healthMetricsCount: number;
  symptomLogsCount: number;
  medicationComplianceRate: number;
  engagementTrends: Record<string, number>;
}

interface PatientActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  user?: string;
  patient?: string;
}

interface PatientActivityData {
  analytics: ActivityAnalytics | null;
  recentActivities: PatientActivity[];
  lastUpdate: Date | null;
}

export const usePatientActivityData = (
  period: string = '7d',
  autoRefresh: boolean = true,
  refreshInterval: number = 30000 // 30 seconds to reduce flashing
) => {
  const [data, setData] = useState<PatientActivityData>({
    analytics: null,
    recentActivities: [],
    lastUpdate: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchData = useCallback(async (isBackground = false) => {
    try {
      // Prevent too frequent requests
      const now = Date.now();
      if (now - lastFetchRef.current < 10000 && isBackground) {
        return;
      }
      lastFetchRef.current = now;

      if (!isBackground) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      // Fetch analytics and activities in parallel
      const [overviewRes, activitiesRes] = await Promise.all([
        api.get(`/dashboard/analytics/overview?period=${period}`),
        api.get('/dashboard/analytics/patient-activity?limit=50&includeMetadata=false')
      ]);

      // Process overview data
      const overviewData = overviewRes.data;
      if (!overviewData?.success) {
        throw new Error(overviewData?.message || 'Failed to load analytics');
      }

      // Process activities data
      const activitiesData = activitiesRes.data;
      let recentActivities: PatientActivity[] = [];
      
      if (activitiesData?.success && activitiesData.data?.recentActivities) {
        recentActivities = activitiesData.data.recentActivities;
      }

      setData({
        analytics: overviewData.data,
        recentActivities,
        lastUpdate: new Date()
      });

    } catch (err) {
      console.error('Error fetching patient activity data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load patient activity data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [period]);

  // Manual refresh function
  const refetch = useCallback(() => {
    fetchData(false);
  }, [fetchData]);

  // Set up auto-refresh
  useEffect(() => {
    // Initial load
    fetchData(false);

    if (autoRefresh) {
      intervalRef.current = window.setInterval(() => {
        fetchData(true);
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [fetchData, autoRefresh, refreshInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Real-time activity tracking
  const trackActivity = useCallback(async (activity: {
    type: string;
    description: string;
    metadata?: Record<string, unknown>;
  }) => {
    try {
      await api.post('/dashboard/activity', activity);
      // Refresh data after tracking new activity
      setTimeout(() => fetchData(true), 1000);
    } catch (err) {
      console.error('Error tracking activity:', err);
    }
  }, [fetchData]);

  // Get activity statistics
  const getActivityStats = useCallback(() => {
    if (!data.analytics) return null;

    const stats = {
      totalActivities: data.analytics.totalActivities,
      averagePerUser: data.analytics.averageActivitiesPerUser,
      mostActiveType: Object.entries(data.analytics.activitiesByType)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none',
      engagementTrend: Object.values(data.analytics.engagementTrends || {})
        .slice(-2)
        .reduce((_prev, curr, index, arr) => {
          if (index === 0) return 0;
          return curr > arr[index - 1] ? 1 : curr < arr[index - 1] ? -1 : 0;
        }, 0)
    };

    return stats;
  }, [data.analytics]);

  // Get recent activity summary
  const getRecentActivitySummary = useCallback(() => {
    const summary = {
      totalCount: data.recentActivities.length,
      lastActivity: data.recentActivities[0]?.timestamp || null,
      typeBreakdown: data.recentActivities.reduce((acc, activity) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      emergencyCount: data.recentActivities.filter(a => a.type === 'emergency_call').length,
      healthMetricsCount: data.recentActivities.filter(a => a.type === 'health_metric').length
    };

    return summary;
  }, [data.recentActivities]);

  return {
    data: data.analytics,
    recentActivities: data.recentActivities,
    loading,
    error,
    isRefreshing,
    lastUpdate: data.lastUpdate,
    refetch,
    trackActivity,
    getActivityStats,
    getRecentActivitySummary
  };
};

export default usePatientActivityData;
