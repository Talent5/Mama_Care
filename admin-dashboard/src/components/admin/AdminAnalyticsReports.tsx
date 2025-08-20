import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Database,
  Clock,
  Download,
  RefreshCw,
  FileText
} from 'lucide-react';
import ChartCard from '../dashboard/ChartCard';

interface AnalyticsData {
  userActivity: Array<{ label: string; value: number; }>;
  systemPerformance: Array<{ label: string; value: number; }>;
  dataUsage: Array<{ label: string; value: number; }>;
  errorRates: Array<{ label: string; value: number; }>;
}

const AdminAnalyticsReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'system' | 'data' | 'performance' | 'reports'>('users');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  // Mock analytics data
  const analyticsData: AnalyticsData = {
    userActivity: [
      { label: 'Mon', value: 145 },
      { label: 'Tue', value: 167 },
      { label: 'Wed', value: 143 },
      { label: 'Thu', value: 189 },
      { label: 'Fri', value: 201 },
      { label: 'Sat', value: 98 },
      { label: 'Sun', value: 87 }
    ],
    systemPerformance: [
      { label: '00:00', value: 85 },
      { label: '04:00', value: 92 },
      { label: '08:00', value: 78 },
      { label: '12:00', value: 65 },
      { label: '16:00', value: 72 },
      { label: '20:00', value: 88 }
    ],
    dataUsage: [
      { label: 'Patient Records', value: 45.2 },
      { label: 'Appointment Data', value: 28.7 },
      { label: 'Medical Images', value: 15.3 },
      { label: 'Reports', value: 6.8 },
      { label: 'System Logs', value: 4.0 }
    ],
    errorRates: [
      { label: 'Week 1', value: 0.12 },
      { label: 'Week 2', value: 0.08 },
      { label: 'Week 3', value: 0.15 },
      { label: 'Week 4', value: 0.09 }
    ]
  };

  const systemMetrics = {
    totalUsers: 1247,
    activeUsers: 324,
    newUsersThisMonth: 45,
    systemUptime: 99.8,
    avgResponseTime: 142,
    totalDataProcessed: '2.4TB',
    apiCalls: 1250000,
    errorRate: 0.02
  };

  const usersByRole = [
    { role: 'Nurses', count: 567, percentage: 45.5, color: '#10b981' },
    { role: 'Doctors', count: 234, percentage: 18.8, color: '#3b82f6' },
    { role: 'Ministry Officials', count: 89, percentage: 7.1, color: '#8b5cf6' },
    { role: 'System Admins', count: 12, percentage: 1.0, color: '#ef4444' },
    { role: 'Others', count: 345, percentage: 27.6, color: '#6b7280' }
  ];

  const popularFeatures = [
    { feature: 'Patient Registration', usage: 89.5, trend: '+5.2%' },
    { feature: 'Appointment Scheduling', usage: 76.3, trend: '+12.1%' },
    { feature: 'Medical Records', usage: 68.7, trend: '-2.3%' },
    { feature: 'Analytics Dashboard', usage: 45.2, trend: '+8.9%' },
    { feature: 'User Management', usage: 34.1, trend: '+15.6%' }
  ];

  const systemReports = [
    { id: 1, name: 'User Activity Report', type: 'PDF', size: '2.4 MB', generated: '2025-07-19 09:00', status: 'Ready' },
    { id: 2, name: 'System Performance Report', type: 'PDF', size: '3.1 MB', generated: '2025-07-19 06:00', status: 'Ready' },
    { id: 3, name: 'Security Audit Report', type: 'PDF', size: '5.7 MB', generated: '2025-07-18 23:00', status: 'Ready' },
    { id: 4, name: 'Data Usage Report', type: 'Excel', size: '1.8 MB', generated: '2025-07-18 18:00', status: 'Ready' },
    { id: 5, name: 'Compliance Report', type: 'PDF', size: '4.2 MB', generated: '2025-07-17 15:00', status: 'Ready' }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  const generateReport = (reportType: string) => {
    // In real app, this would trigger report generation
    console.log(`Generating ${reportType} report...`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">System analytics and comprehensive reporting</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#4ea674] text-white rounded-lg hover:bg-[#3d8f5f] disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-blue-600">{systemMetrics.totalUsers.toLocaleString()}</p>
              <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +{systemMetrics.newUsersThisMonth} this month
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-green-600">{systemMetrics.activeUsers}</p>
              <p className="text-sm text-gray-600 mt-1">
                {((systemMetrics.activeUsers / systemMetrics.totalUsers) * 100).toFixed(1)}% of total
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Uptime</p>
              <p className="text-2xl font-bold text-purple-600">{systemMetrics.systemUptime}%</p>
              <p className="text-sm text-green-600 mt-1">Excellent performance</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-orange-600">{systemMetrics.avgResponseTime}ms</p>
              <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 rotate-180" />
                -15ms improved
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'users', label: 'User Analytics', icon: Users },
            { id: 'system', label: 'System Performance', icon: Activity },
            { id: 'data', label: 'Data Usage', icon: Database },
            { id: 'performance', label: 'Feature Usage', icon: BarChart3 },
            { id: 'reports', label: 'Generated Reports', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-[#4ea674] text-[#4ea674]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="User Activity Over Time"
              data={analyticsData.userActivity}
              type="line"
            />
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Role</h3>
              <div className="space-y-4">
                {usersByRole.map((roleData) => (
                  <div key={roleData.role} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: roleData.color }}
                      ></div>
                      <span className="font-medium text-gray-900">{roleData.role}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{roleData.count}</div>
                      <div className="text-sm text-gray-600">{roleData.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="System Performance"
              data={analyticsData.systemPerformance}
              type="line"
            />
            
            <ChartCard
              title="Error Rates"
              data={analyticsData.errorRates}
              type="bar"
            />
          </div>

          {/* System Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">Total API Calls</p>
                <p className="text-2xl font-bold text-blue-600">{systemMetrics.apiCalls.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Data Processed</p>
                <p className="text-2xl font-bold text-green-600">{systemMetrics.totalDataProcessed}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold text-red-600">{systemMetrics.errorRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Data Usage by Category"
              data={analyticsData.dataUsage}
              type="doughnut"
            />
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Details</h3>
              <div className="space-y-4">
                {analyticsData.dataUsage.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-gray-700">{item.label}</span>
                    <div className="text-right">
                      <span className="font-semibold">{item.value} GB</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-[#4ea674] h-2 rounded-full"
                          style={{ width: `${(item.value / 100) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Usage Analytics</h3>
            <div className="space-y-4">
              {popularFeatures.map((feature) => (
                <div key={feature.feature} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{feature.feature}</p>
                    <p className="text-sm text-gray-600">{feature.usage}% adoption rate</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-[#4ea674] h-3 rounded-full"
                        style={{ width: `${feature.usage}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${
                      feature.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {feature.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Report Generation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate New Report</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => generateReport('User Activity')}
                className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Users className="w-6 h-6 text-blue-600" />
                <div className="text-left">
                  <p className="font-medium text-blue-900">User Activity Report</p>
                  <p className="text-sm text-blue-600">Comprehensive user analytics</p>
                </div>
              </button>
              
              <button 
                onClick={() => generateReport('System Performance')}
                className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <Activity className="w-6 h-6 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-green-900">Performance Report</p>
                  <p className="text-sm text-green-600">System metrics and uptime</p>
                </div>
              </button>
              
              <button 
                onClick={() => generateReport('Security Audit')}
                className="flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <FileText className="w-6 h-6 text-red-600" />
                <div className="text-left">
                  <p className="font-medium text-red-900">Security Audit</p>
                  <p className="text-sm text-red-600">Security events and compliance</p>
                </div>
              </button>
            </div>
          </div>

          {/* Generated Reports */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Generated Reports</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {systemReports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {report.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.size}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.generated}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex gap-2">
                          <button className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            Download
                          </button>
                          <button className="text-red-600 hover:text-red-900">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalyticsReports;
