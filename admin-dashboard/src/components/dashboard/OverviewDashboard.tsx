import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Heart, 
  Calendar, 
  AlertTriangle, 
  Activity, 
  Plus,
  FileText,
  Clock,
  Phone,
  MessageCircle,
  RefreshCw
} from 'lucide-react';
import MetricCard from './MetricCard';
import ChartCard from './ChartCard';
import FloatingNotification from '../common/FloatingNotification';
import { useDashboardData } from '../../hooks/useDashboardData';
import { MetricCardSkeleton, ChartCardSkeleton, QuickActionSkeleton } from '../common/Skeleton';
import StatusBar from '../common/StatusBar';
import InsightsPanel from './InsightsPanel';
import ExportButton from '../common/ExportButton';

interface OverviewDashboardProps {
  userRole: 'admin' | 'healthcare_provider';
}

const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ userRole }) => {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'warning' | 'error';
    message: string;
  }>>([]);
  
  const [timePeriod, setTimePeriod] = useState('30d');
  const { data: dashboardData, loading, error, refetch, lastUpdate } = useDashboardData(timePeriod);

  const showNotification = (type: 'success' | 'warning' | 'error', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Demo notifications
  useEffect(() => {
    const demoNotifications = [
      { type: 'success' as const, message: 'Dashboard data updated successfully', delay: 2000 },
      { type: 'warning' as const, message: 'High-risk patient requires attention', delay: 8000 },
      { type: 'success' as const, message: 'ANC visit completed successfully', delay: 15000 },
    ];

    demoNotifications.forEach(({ type, message, delay }) => {
      setTimeout(() => {
        showNotification(type, message);
      }, delay);
    });
  }, []);

  // Generate metrics from API data
  const metrics = dashboardData ? [
    {
      title: 'Active Patients',
      value: dashboardData.totalPatients.toLocaleString(),
      change: `+${Math.round((dashboardData.activePatients / dashboardData.totalPatients) * 100)}% active`,
      changeType: 'positive' as const,
      icon: Users,
      trend: [65, 72, 68, 75, 82, 78, dashboardData.totalPatients % 100]
    },
    {
      title: 'ANC Completion Rate',
      value: `${dashboardData.ancCompletionRate}%`,
      change: '+3.1% from last month',
      changeType: 'positive' as const,
      icon: Heart,
      trend: [78, 80, 82, 81, 83, 84, dashboardData.ancCompletionRate]
    },
    {
      title: 'Appointments Today',
      value: dashboardData.todaysAppointments.toString(),
      change: `${dashboardData.pendingAppointments} pending`,
      changeType: 'neutral' as const,
      icon: Calendar,
      trend: [120, 135, 115, 140, 130, 125, dashboardData.todaysAppointments]
    },
    {
      title: 'High-Risk Cases',
      value: dashboardData.highRiskPatients.toString(),
      change: `${Math.round((dashboardData.highRiskPatients / dashboardData.totalPatients) * 100)}% of total`,
      changeType: dashboardData.highRiskPatients > 100 ? 'negative' as const : 'positive' as const,
      icon: AlertTriangle,
      trend: [95, 92, 88, 91, 85, 87, dashboardData.highRiskPatients]
    }
  ] : [];

  const riskAssessmentData = dashboardData ? [
    { label: 'Low Risk', value: dashboardData.riskDistribution.low, color: '#4ea674' },
    { label: 'Medium Risk', value: dashboardData.riskDistribution.medium, color: '#f59e0b' },
    { label: 'High Risk', value: dashboardData.riskDistribution.high, color: '#ef4444' }
  ] : [];

  const ancVisitsData = dashboardData ? [
    { label: 'Visit 1', value: dashboardData.ancVisitsByStage['Visit 1'] || 0 },
    { label: 'Visit 2', value: dashboardData.ancVisitsByStage['Visit 2'] || 0 },
    { label: 'Visit 3', value: dashboardData.ancVisitsByStage['Visit 3'] || 0 },
    { label: 'Visit 4', value: dashboardData.ancVisitsByStage['Visit 4'] || 0 },
    { label: 'Visit 5+', value: dashboardData.ancVisitsByStage['Visit 5+'] || 0 }
  ] : [];

  const monthlyTrends = dashboardData ? dashboardData.monthlyTrends.map(trend => ({
    label: new Date(trend._id + '-01').toLocaleDateString('en-US', { month: 'short' }),
    value: trend.count
  })) : [];

  // Transform upcoming appointments for display
  const upcomingAppointments = dashboardData?.upcomingAppointments.map(appointment => ({
    time: new Date(appointment.appointmentDate).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    patient: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
    type: appointment.type,
    status: appointment.status,
    phone: appointment.patient.phone || 'N/A'
  })) || [];

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {userRole === 'admin' ? 'Administrative Dashboard' : 'Healthcare Provider Dashboard'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Loading dashboard data...</p>
          </div>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(4)].map((_, index) => (
              <QuickActionSkeleton key={index} />
            ))}
          </div>
        </div>

        {/* Metrics Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, index) => (
            <MetricCardSkeleton key={index} />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <ChartCardSkeleton />
              <ChartCardSkeleton />
            </div>
            <ChartCardSkeleton />
          </div>
          <div className="space-y-4 sm:space-y-6">
            <ChartCardSkeleton />
            <ChartCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4">Error loading dashboard data: {error}</div>
        <button 
          onClick={refetch}
          className="px-4 py-2 bg-[#4ea674] text-white rounded-lg hover:bg-[#3d8660] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'New Patient',
      description: 'Register a new patient',
      icon: Plus,
      color: '#4ea674',
      bgColor: '#c0e6b9'
    },
    {
      title: 'Schedule Appointment',
      description: 'Book new appointment',
      icon: Calendar,
      color: '#3b82f6',
      bgColor: '#dbeafe'
    },
    {
      title: 'Generate Report',
      description: 'Create health report',
      icon: FileText,
      color: '#8b5cf6',
      bgColor: '#ede9fe'
    },
    {
      title: 'Emergency Alert',
      description: 'Send urgent notification',
      icon: AlertTriangle,
      color: '#ef4444',
      bgColor: '#fee2e2'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Status Bar */}
      <StatusBar 
        lastUpdate={lastUpdate} 
        loading={loading} 
        error={error} 
        onRefresh={refetch} 
      />
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {userRole === 'admin' ? 'Administrative Dashboard' : 'Healthcare Provider Dashboard'}
          </h1>
          <p className="text-lg text-gray-600">
            {userRole === 'admin' 
              ? 'Monitor system-wide maternal health metrics and trends'
              : 'Track your patients and manage daily healthcare activities'
            }
          </p>
        </div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          <div className="flex items-center gap-3 order-2 lg:order-1">
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent bg-white shadow-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={refetch}
              className="p-2 text-gray-500 hover:text-[#4ea674] transition-colors rounded-lg hover:bg-gray-100"
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            {dashboardData && (
              <ExportButton 
                data={dashboardData} 
                filename={`mamacare-dashboard-${timePeriod}`} 
              />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 order-1 lg:order-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <Activity className="w-4 h-4" />
            <span>Live data</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                showNotification('success', `${action.title} initiated successfully!`);
              }}
              className="p-4 rounded-xl border-2 border-gray-200 hover:border-[#4ea674] transition-all duration-200 text-left group hover:shadow-lg hover:scale-105"
            >
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="p-3 rounded-lg transition-all duration-200 group-hover:scale-110 flex-shrink-0"
                  style={{ backgroundColor: action.bgColor }}
                >
                  <action.icon className="w-5 h-5" style={{ color: action.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 group-hover:text-[#4ea674] transition-colors">{action.title}</h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <MetricCard {...metric} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Risk Assessment Distribution"
              data={riskAssessmentData}
              type="doughnut"
            />
            <ChartCard
              title="ANC Visit Completion Rates"
              data={ancVisitsData}
              type="bar"
            />
          </div>
          <ChartCard
            title="Monthly Completion Trends"
            data={monthlyTrends}
            type="line"
          />
        </div>
        
        {/* Right sidebar with appointments, activity, and insights */}
        <div className="space-y-6">
          {/* Insights Panel */}
          <InsightsPanel 
            data={{
              totalPatients: dashboardData?.totalPatients || 0,
              highRiskPatients: dashboardData?.highRiskPatients || 0,
              ancCompletionRate: dashboardData?.ancCompletionRate || 0,
              activePatients: dashboardData?.activePatients || 0
            }}
          />

          {/* Today's Appointments */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Today's Appointments</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{upcomingAppointments.length} scheduled</span>
              </div>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {upcomingAppointments.map((appointment, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="text-center flex-shrink-0">
                    <div className="text-sm font-medium text-gray-900">{appointment.time}</div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      appointment.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.status}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{appointment.patient}</div>
                    <div className="text-sm text-gray-500 truncate">{appointment.type}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Phone className="w-3 h-3" />
                      <span className="truncate">{appointment.phone}</span>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-[#4ea674] transition-colors flex-shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {dashboardData?.recentActivity.map((activity) => (
                <div key={activity._id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    activity.riskFactors?.level === 'high' ? 'bg-red-500' :
                    activity.riskFactors?.level === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      New patient registered: {activity.firstName} {activity.lastName}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                    {activity.riskFactors?.level && (
                      <span className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                        activity.riskFactors.level === 'high' ? 'bg-red-100 text-red-800' :
                        activity.riskFactors.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {activity.riskFactors.level} risk
                      </span>
                    )}
                  </div>
                </div>
              )) || [
                { action: 'New high-risk patient registered', time: '5 minutes ago', type: 'patient', priority: 'high' },
                { action: 'ANC visit completed successfully', time: '12 minutes ago', type: 'assessment', priority: 'normal' },
                { action: 'Emergency alert resolved', time: '25 minutes ago', type: 'alert', priority: 'high' },
                { action: 'Weekly report generated', time: '1 hour ago', type: 'report', priority: 'normal' }
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    activity.priority === 'high' ? 'bg-red-500' :
                    activity.type === 'patient' ? 'bg-blue-500' :
                    activity.type === 'assessment' ? 'bg-green-500' :
                    activity.type === 'alert' ? 'bg-orange-500' :
                    'bg-gray-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="fixed top-20 right-6 z-50 space-y-2">
        {notifications.map((notification, index) => (
          <div key={notification.id} style={{ animationDelay: `${index * 0.1}s` }}>
            <FloatingNotification 
              type={notification.type} 
              message={notification.message} 
              onClose={() => removeNotification(notification.id)} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverviewDashboard;