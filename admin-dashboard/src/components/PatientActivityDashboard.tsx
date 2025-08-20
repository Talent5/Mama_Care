import React, { useState, useMemo } from 'react';
import usePatientActivityData from '../hooks/usePatientActivityData';

const PatientActivityDashboard: React.FC = () => {
  const [period, setPeriod] = useState('7d');
  
  const {
    data: analytics,
    recentActivities,
    loading,
    error,
    isRefreshing,
    lastUpdate,
    refetch,
    getActivityStats,
    getRecentActivitySummary
  } = usePatientActivityData(period, true, 60000); // 60-second refresh to reduce flashing

  const activityStats = useMemo(() => getActivityStats(), [getActivityStats]);
  const recentSummary = useMemo(() => getRecentActivitySummary(), [getRecentActivitySummary]);

  const getActivityIcon = (type: string) => {
    const icons = {
      health_metric: '📊',
      medication: '💊',
      symptom_log: '📝',
      app_usage: '📱',
      reading: '📖',
      appointment_action: '📅',
      emergency_call: '🚨'
    };
    return icons[type as keyof typeof icons] || '📋';
  };

  const getActivityColor = (type: string) => {
    const colors = {
      health_metric: 'bg-blue-100 text-blue-800',
      medication: 'bg-green-100 text-green-800',
      symptom_log: 'bg-yellow-100 text-yellow-800',
      app_usage: 'bg-purple-100 text-purple-800',
      reading: 'bg-indigo-100 text-indigo-800',
      appointment_action: 'bg-orange-100 text-orange-800',
      emergency_call: 'bg-red-100 text-red-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never';
    return `${formatTimestamp(lastUpdate.toISOString())}`;
  };

  if (loading && !analytics) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading patient activity</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={refetch}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <div className="p-6 text-center text-gray-500">No data available</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">Patient Activity Dashboard</h1>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              isRefreshing ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isRefreshing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400 animate-pulse'
              }`}></div>
              <span>{isRefreshing ? 'Updating...' : 'Live'}</span>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Real-time insights into patient engagement and app usage • Last updated: {formatLastUpdate()}
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={refetch}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm">👥</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Patients</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics.activePatients}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm">📊</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Activities</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics.totalActivities}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm">💊</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Medication Compliance</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics.medicationComplianceRate}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm">🚨</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Emergency Calls</dt>
                  <dd className="text-lg font-medium text-gray-900">{analytics.emergencyCallsCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Statistics */}
      {activityStats && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Activity Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{activityStats.averagePerUser}</div>
                <div className="text-sm text-gray-500">Average per User</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 capitalize">{activityStats.mostActiveType}</div>
                <div className="text-sm text-gray-500">Most Active Type</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  activityStats.engagementTrend > 0 ? 'text-green-600' : 
                  activityStats.engagementTrend < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {activityStats.engagementTrend > 0 ? '📈' : activityStats.engagementTrend < 0 ? '📉' : '➡️'}
                </div>
                <div className="text-sm text-gray-500">Engagement Trend</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Types Breakdown */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Activity Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(analytics.activitiesByType).map(([type, count]) => (
              <div key={type} className="text-center">
                <div className="text-2xl mb-2">{getActivityIcon(type)}</div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-500 capitalize">{type.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Patient Activities</h3>
            <div className="text-sm text-gray-500">
              {recentSummary.totalCount} activities • {recentSummary.emergencyCount} emergencies
            </div>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentActivities.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activities</p>
            ) : (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0">
                    <span className="text-xl">{getActivityIcon(activity.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityColor(activity.type)}`}>
                      {activity.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientActivityDashboard;
