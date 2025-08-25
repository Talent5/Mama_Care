import React, { useState, useCallback } from 'react';
import { 
  Server, 
  Users, 
  Database, 
  Shield, 
  Activity,
  AlertTriangle,
  CheckCircle,
  HardDrive,
  Cpu,
  Eye,
  Settings,
  BarChart3,
  FileText,
  Bell,
  Lock,
  RefreshCw,
  Loader2
} from 'lucide-react';
import MetricCard from '../MetricCard';
import ChartCard from '../ChartCard';
import { useDashboardData } from '../../../hooks/useDashboardData';
import { useAdminDashboardData } from '../../../hooks/useAdminDashboardData';
import { getCompleteGreeting } from '../../../utils/greetingUtils';

interface AdminDashboardProps {
  widgets: string[];
  userName: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AdminDashboard: React.FC<AdminDashboardProps> = ({ widgets, userName }) => {
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useDashboardData('30d');
  const { data: adminData, loading: adminLoading, error: adminError, refetch: refetchAdmin } = useAdminDashboardData();
  
  // Loading states for different actions
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    userManagement: false,
    systemManagement: false,
    securityManagement: false,
    analyticsReports: false,
    databaseManagement: false,
    alertManagement: false,
    auditLogs: false,
    systemSettings: false
  });
  
  // Combine loading states
  const loading = dashboardLoading || adminLoading;
  const error = dashboardError || adminError;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchDashboard(), refetchAdmin()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchDashboard, refetchAdmin]);

  const handleNavigation = useCallback(async (action: keyof typeof loadingStates, url: string) => {
    setLoadingStates(prev => ({ ...prev, [action]: true }));
    
    try {
      // Simulate some processing time for saving/preparing data
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.href = url;
    } catch (error) {
      console.error(`Navigation to ${url} failed:`, error);
      setLoadingStates(prev => ({ ...prev, [action]: false }));
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'inactive': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading || !dashboardData || !adminData) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          <p>Error loading dashboard data: {error}</p>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isRefreshing ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{getCompleteGreeting({ firstName: userName, role: 'admin' }).greeting}</h2>
            <p className="text-gray-600">{getCompleteGreeting({ firstName: userName, role: 'admin' }).message}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* System Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={adminData.users.total.toString()}
          change={`+${adminData.users.recent}`}
          changeType="positive"
          icon={Users}
        />
        <MetricCard
          title="System Uptime"
          value={adminData.system.uptime}
          change={adminData.activity.uptimeChange}
          changeType="positive"
          icon={Server}
        />
        <MetricCard
          title="API Calls Today"
          value={adminData.activity.apiCalls.toLocaleString()}
          change={adminData.activity.apiCallsChange}
          changeType="positive"
          icon={Activity}
        />
        <MetricCard
          title="Error Rate"
          value={adminData.system.errorRate}
          change={adminData.activity.errorRateChange}
          changeType={adminData.activity.errorRateChange.includes('-') ? 'positive' : 'negative'}
          icon={Shield}
        />
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-500" />
              CPU Usage
            </h3>
            <span className="text-2xl font-bold text-blue-600">{adminData.system.cpuUsage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all duration-300" 
              style={{ width: `${adminData.system.cpuUsage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Normal operation</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-green-500" />
              Memory Usage
            </h3>
            <span className="text-2xl font-bold text-green-600">{adminData.system.memoryUsage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-500 h-3 rounded-full transition-all duration-300" 
              style={{ width: `${adminData.system.memoryUsage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Optimal performance</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-purple-500" />
              Disk Usage
            </h3>
            <span className="text-2xl font-bold text-purple-600">{adminData.system.diskUsage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-purple-500 h-3 rounded-full transition-all duration-300" 
              style={{ width: `${adminData.system.diskUsage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Space available</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Recent User Activity
              </h3>
              <button 
                onClick={() => handleNavigation('userManagement', '/admin/users')}
                disabled={loadingStates.userManagement}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {loadingStates.userManagement && <Loader2 className="w-3 h-3 animate-spin" />}
                {loadingStates.userManagement ? 'Loading...' : 'Manage Users'}
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.recentActivity.map((activity) => (
                <div key={activity._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{activity.firstName} {activity.lastName}</p>
                      <p className="text-xs text-gray-500">Registered: {new Date(activity.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.riskFactors?.level || 'low')}`}>
                      {activity.riskFactors?.level || 'low'} risk
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                System Alerts
              </h3>
              <button 
                onClick={() => handleNavigation('alertManagement', '/admin/alerts')}
                disabled={loadingStates.alertManagement}
                className="text-sm text-orange-600 hover:text-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {loadingStates.alertManagement && <Loader2 className="w-3 h-3 animate-spin" />}
                {loadingStates.alertManagement ? 'Loading...' : 'View All'}
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {adminData.alerts.map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border ${getAlertTypeColor(alert.type)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {getSeverityIcon(alert.severity)}
                      <div>
                        <p className="font-medium text-gray-900">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {alert.type.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">System Administration</h3>
          <p className="text-sm text-gray-600 mt-1">Complete control over system components and operations</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => handleNavigation('userManagement', '/admin/users')}
              disabled={loadingStates.userManagement}
              className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingStates.userManagement ? (
                <Loader2 className="w-6 h-6 text-blue-600 flex-shrink-0 animate-spin" />
              ) : (
                <Users className="w-6 h-6 text-blue-600 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium text-blue-900">
                  {loadingStates.userManagement ? 'Loading...' : 'Advanced User Management'}
                </p>
                <p className="text-sm text-blue-600">Complete user control & analytics</p>
              </div>
            </button>
            
            <button 
              onClick={() => handleNavigation('systemManagement', '/admin/system')}
              disabled={loadingStates.systemManagement}
              className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingStates.systemManagement ? (
                <Loader2 className="w-6 h-6 text-green-600 flex-shrink-0 animate-spin" />
              ) : (
                <Server className="w-6 h-6 text-green-600 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium text-green-900">
                  {loadingStates.systemManagement ? 'Loading...' : 'System Management'}
                </p>
                <p className="text-sm text-green-600">Monitor servers & infrastructure</p>
              </div>
            </button>
            
            <button 
              onClick={() => handleNavigation('securityManagement', '/admin/security')}
              disabled={loadingStates.securityManagement}
              className="flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingStates.securityManagement ? (
                <Loader2 className="w-6 h-6 text-red-600 flex-shrink-0 animate-spin" />
              ) : (
                <Lock className="w-6 h-6 text-red-600 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium text-red-900">
                  {loadingStates.securityManagement ? 'Loading...' : 'Security Management'}
                </p>
                <p className="text-sm text-red-600">Security policies & monitoring</p>
              </div>
            </button>
            
            <button 
              onClick={() => handleNavigation('analyticsReports', '/admin/analytics')}
              disabled={loadingStates.analyticsReports}
              className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingStates.analyticsReports ? (
                <Loader2 className="w-6 h-6 text-purple-600 flex-shrink-0 animate-spin" />
              ) : (
                <BarChart3 className="w-6 h-6 text-purple-600 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium text-purple-900">
                  {loadingStates.analyticsReports ? 'Loading...' : 'Analytics & Reports'}
                </p>
                <p className="text-sm text-purple-600">System analytics & reporting</p>
              </div>
            </button>

            <button 
              onClick={() => handleNavigation('databaseManagement', '/admin/database')}
              disabled={loadingStates.databaseManagement}
              className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingStates.databaseManagement ? (
                <Loader2 className="w-6 h-6 text-orange-600 flex-shrink-0 animate-spin" />
              ) : (
                <Database className="w-6 h-6 text-orange-600 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium text-orange-900">
                  {loadingStates.databaseManagement ? 'Loading...' : 'Database Management'}
                </p>
                <p className="text-sm text-orange-600">Backup, optimize & maintain</p>
              </div>
            </button>
            
            <button 
              onClick={() => handleNavigation('alertManagement', '/admin/alerts')}
              disabled={loadingStates.alertManagement}
              className="flex items-center gap-3 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingStates.alertManagement ? (
                <Loader2 className="w-6 h-6 text-indigo-600 flex-shrink-0 animate-spin" />
              ) : (
                <Bell className="w-6 h-6 text-indigo-600 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium text-indigo-900">
                  {loadingStates.alertManagement ? 'Loading...' : 'Alert Management'}
                </p>
                <p className="text-sm text-indigo-600">Configure system alerts</p>
              </div>
            </button>

            <button 
              onClick={() => handleNavigation('auditLogs', '/admin/audit')}
              disabled={loadingStates.auditLogs}
              className="flex items-center gap-3 p-4 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingStates.auditLogs ? (
                <Loader2 className="w-6 h-6 text-pink-600 flex-shrink-0 animate-spin" />
              ) : (
                <FileText className="w-6 h-6 text-pink-600 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium text-pink-900">
                  {loadingStates.auditLogs ? 'Loading...' : 'Audit Logs'}
                </p>
                <p className="text-sm text-pink-600">System activity & compliance</p>
              </div>
            </button>

            <button 
              onClick={() => handleNavigation('systemSettings', '/admin/settings')}
              disabled={loadingStates.systemSettings}
              className="flex items-center gap-3 p-4 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingStates.systemSettings ? (
                <Loader2 className="w-6 h-6 text-teal-600 flex-shrink-0 animate-spin" />
              ) : (
                <Settings className="w-6 h-6 text-teal-600 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium text-teal-900">
                  {loadingStates.systemSettings ? 'Loading...' : 'System Settings'}
                </p>
                <p className="text-sm text-teal-600">Global configuration</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Security Events */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" />
              Recent Security Events
            </h3>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-gray-900">Multiple Failed Login Attempts</p>
                  <p className="text-sm text-gray-600">admin@example.com - 192.168.1.100</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">2 min ago</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">System Security Scan Completed</p>
                  <p className="text-sm text-gray-600">No threats detected</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">1 hour ago</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">New Admin User Login</p>
                  <p className="text-sm text-gray-600">system_admin@mamacare.com</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">3 hours ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="User Registration Trends"
          data={dashboardData.monthlyTrends.map((trend) => ({
            label: trend._id,
            value: trend.count
          }))}
          type="line"
        />
        
        <ChartCard
          title="User Distribution by Role"
          data={Object.entries(adminData.users.byRole).map(([role, count]) => ({
            label: role.replace('_', ' '),
            value: count as number
          }))}
          type="doughnut"
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
