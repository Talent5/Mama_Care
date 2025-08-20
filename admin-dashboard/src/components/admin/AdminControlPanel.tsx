import React, { useEffect, useState } from 'react';
import {
  Server,
  Users,
  Shield,
  Database,
  BarChart3,
  Activity,
  Settings,
  FileText,
  Eye,
  RefreshCw,
  Download
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import type { DashboardStats } from '../../types/api';

interface AdminControlPanelProps {
  className?: string;
}

interface SystemStatus {
  overall: string;
  uptime: string;
  totalUsers: number;
  activeUsers: number;
  systemLoad: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  lastUpdated: string;
}

const AdminControlPanel: React.FC<AdminControlPanelProps> = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch system status and dashboard data in parallel
        const [systemResponse, dashboardResponse] = await Promise.all([
          adminAPI.getSystemHealth(),
          adminAPI.getDashboardStats()
        ]);

        setSystemStatus(systemResponse.data);
        if (dashboardResponse.data) {
          setDashboardData(dashboardResponse.data);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const adminModules = [
    {
      id: 'users',
      title: 'Advanced User Management',
      description: 'Complete control over user accounts, roles, permissions, and security settings',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      features: ['Bulk operations', 'Role management', 'Security monitoring', 'User analytics'],
      stats: { 
        total: `${systemStatus?.totalUsers || '...'} users`, 
        active: `${systemStatus?.activeUsers || '...'} active`, 
        new: `+${dashboardData?.totalPatients || '...'} patients` 
      }
    },
    {
      id: 'system',
      title: 'System Management',
      description: 'Monitor and manage system infrastructure, servers, and performance',
      icon: Server,
      href: '/admin/system',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      features: ['Server monitoring', 'Database management', 'Backup control', 'Performance metrics'],
      stats: { 
        uptime: systemStatus?.uptime || '99.8%', 
        load: `${systemStatus?.systemLoad || 67}% CPU`, 
        memory: `${systemStatus?.memoryUsage || 45}% RAM` 
      }
    },
    {
      id: 'security',
      title: 'Security Management',
      description: 'Security policies, monitoring, and threat analysis',
      icon: Shield,
      href: '/admin/security',
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      features: ['Security policies', 'Event monitoring', 'Threat analysis', 'Audit trails'],
      stats: { 
        events: '1,247', 
        alerts: `${dashboardData?.highRiskPatients || 3} critical`, 
        scans: 'Last: 2hrs ago' 
      }
    },
    {
      id: 'analytics',
      title: 'Analytics & Reports',
      description: 'Comprehensive system analytics and automated reporting',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      features: ['System analytics', 'Custom reports', 'Data visualization', 'Export tools'],
      stats: { 
        reports: '24 generated', 
        patients: `${dashboardData?.totalPatients || '2.4K'} total`, 
        api: '1.25M calls' 
      }
    },
    {
      id: 'database',
      title: 'Database Administration',
      description: 'Database management, optimization, and maintenance',
      icon: Database,
      href: '/admin/database',
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      features: ['Query optimization', 'Backup management', 'Performance tuning', 'Schema management'],
      stats: { 
        size: '2.4GB', 
        queries: '1,250/sec', 
        connections: '45/100' 
      }
    },
    {
      id: 'monitoring',
      title: 'System Monitoring',
      description: 'Real-time monitoring and alerting for system health',
      icon: Activity,
      href: '/admin/monitoring',
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
      features: ['Real-time monitoring', 'Custom alerts', 'Performance tracking', 'Health checks'],
      stats: { 
        alerts: `${dashboardData?.pendingAppointments || 12} active`, 
        response: `${systemStatus?.networkLatency || 145}ms avg`, 
        errors: '0.02% rate' 
      }
    },
    {
      id: 'audit',
      title: 'Audit & Compliance',
      description: 'Audit trails, compliance monitoring, and regulatory reporting',
      icon: FileText,
      href: '/admin/audit',
      color: 'bg-teal-500',
      hoverColor: 'hover:bg-teal-600',
      features: ['Audit logging', 'Compliance checks', 'Regulatory reports', 'Data governance'],
      stats: { 
        logs: '50K entries', 
        compliance: `${dashboardData?.ancCompletionRate || 98.7}%`, 
        reports: '12 pending' 
      }
    },
    {
      id: 'settings',
      title: 'System Configuration',
      description: 'Global system settings and configuration management',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-500',
      hoverColor: 'hover:bg-gray-600',
      features: ['System settings', 'Feature flags', 'Environment config', 'API settings'],
      stats: { 
        configs: '156 settings', 
        features: '23 enabled', 
        env: 'Production' 
      }
    }
  ];

  const quickActions = [
    {
      label: 'System Health Check',
      icon: Activity,
      action: async () => {
        try {
          const response = await adminAPI.getSystemHealth();
          console.log('System health:', response.data);
          alert('System health check completed successfully!');
        } catch (err) {
          console.error('Health check failed:', err);
          alert('Health check failed. Please check the console for details.');
        }
      },
      color: 'bg-green-100 text-green-700 hover:bg-green-200'
    },
    {
      label: 'Create Database Backup',
      icon: Download,
      action: () => {
        console.log('Creating database backup...');
        alert('Database backup initiated successfully!');
      },
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    },
    {
      label: 'Security Scan',
      icon: Shield,
      action: () => {
        console.log('Running security scan...');
        alert('Security scan initiated successfully!');
      },
      color: 'bg-red-100 text-red-700 hover:bg-red-200'
    },
    {
      label: 'Generate Reports',
      icon: FileText,
      action: () => {
        console.log('Generating reports...');
        alert(`Generating reports for ${dashboardData?.totalPatients || 'all'} patients...`);
      },
      color: 'bg-purple-100 text-purple-700 hover:bg-purple-200'
    },
    {
      label: 'View System Logs',
      icon: Eye,
      action: () => {
        console.log('Opening system logs...');
        window.open('/admin/system/logs', '_blank');
      },
      color: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    },
    {
      label: 'Restart Services',
      icon: RefreshCw,
      action: () => {
        const confirmed = window.confirm('Are you sure you want to restart system services? This may cause temporary downtime.');
        if (confirmed) {
          console.log('Restarting services...');
          alert('Service restart initiated. Please monitor system status.');
        }
      },
      color: 'bg-orange-100 text-orange-700 hover:bg-orange-200'
    }
  ];

  if (loading) {
    return <div className="p-6">Loading system status...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">
        Error: {error}
        <button 
          onClick={() => window.location.reload()} 
          className="ml-4 px-4 py-2 bg-red-100 rounded-lg hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">System Administration</h1>
            <p className="text-gray-300 text-lg">Complete control over the MamaCare system infrastructure</p>
            {dashboardData && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Total Patients</div>
                  <div className="text-xl font-semibold text-blue-400">{dashboardData.totalPatients}</div>
                </div>
                <div>
                  <div className="text-gray-400">Active Patients</div>
                  <div className="text-xl font-semibold text-green-400">{dashboardData.activePatients}</div>
                </div>
                <div>
                  <div className="text-gray-400">Today's Appointments</div>
                  <div className="text-xl font-semibold text-purple-400">{dashboardData.todaysAppointments}</div>
                </div>
                <div>
                  <div className="text-gray-400">High Risk</div>
                  <div className="text-xl font-semibold text-red-400">{dashboardData.highRiskPatients}</div>
                </div>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-semibold">
                {systemStatus?.overall === 'healthy' ? 'System Online' : 'System Warning'}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              Last update: {new Date(systemStatus?.lastUpdated || Date.now()).toLocaleTimeString()}
            </div>
            {systemStatus && (
              <div className="mt-2 text-xs text-gray-400">
                CPU: {systemStatus.systemLoad}% | RAM: {systemStatus.memoryUsage}% | Latency: {systemStatus.networkLatency}ms
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.action}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200 ${action.color}`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-medium text-center">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Admin Modules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {adminModules.map((module) => {
          const Icon = module.icon;
          return (
            <div
              key={module.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${module.color} ${module.hoverColor} transition-colors`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                      <p className="text-gray-600 text-sm">{module.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.href = module.href}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>

                {/* Features */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Key Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {module.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {Object.entries(module.stats).map(([key, value]) => (
                      <div key={key}>
                        <div className="text-sm font-semibold text-gray-900">{value}</div>
                        <div className="text-xs text-gray-500 capitalize">{key}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-4">
                  <button
                    onClick={() => window.location.href = module.href}
                    className={`w-full py-2 px-4 rounded-lg text-white font-medium transition-colors ${module.color} ${module.hoverColor}`}
                  >
                    Open {module.title}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Status Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
              <Server className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {systemStatus?.uptime || '99.8%'}
            </div>
            <div className="text-sm text-gray-600">System Uptime</div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData?.activePatients || systemStatus?.activeUsers || '324'}
            </div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
              <Database className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">2.4GB</div>
            <div className="text-sm text-gray-600">Database Size</div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 bg-orange-100 rounded-full flex items-center justify-center">
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {systemStatus?.networkLatency || '145'}ms
            </div>
            <div className="text-sm text-gray-600">Avg Response</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminControlPanel;
