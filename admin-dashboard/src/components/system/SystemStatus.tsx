import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon,
  GlobeAltIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface SystemMetric {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  value: string | number;
  unit?: string;
  description: string;
  lastUpdated: Date;
}

interface ServiceStatus {
  id: string;
  name: string;
  status: 'online' | 'degraded' | 'offline' | 'maintenance';
  uptime: string;
  responseTime: number;
  lastCheck: Date;
  endpoint?: string;
}

const SystemStatus: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [services, setServices] = useState<ServiceStatus[]>([]);

  const fetchSystemStatus = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual API endpoints
      const [metricsResponse, servicesResponse] = await Promise.all([
        fetch('/api/admin/system/metrics'),
        fetch('/api/admin/system/services')
      ]);

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setSystemMetrics(metricsData);
      } else {
        // Fallback with mock data
        setSystemMetrics([
          {
            id: 'cpu',
            name: 'CPU Usage',
            status: 'healthy',
            value: 35,
            unit: '%',
            description: 'Current CPU utilization',
            lastUpdated: new Date()
          },
          {
            id: 'memory',
            name: 'Memory Usage',
            status: 'healthy',
            value: 68,
            unit: '%',
            description: 'Current memory utilization',
            lastUpdated: new Date()
          },
          {
            id: 'disk',
            name: 'Disk Usage',
            status: 'warning',
            value: 82,
            unit: '%',
            description: 'Current disk space utilization',
            lastUpdated: new Date()
          },
          {
            id: 'connections',
            name: 'Active Connections',
            status: 'healthy',
            value: 147,
            description: 'Current active database connections',
            lastUpdated: new Date()
          }
        ]);
      }

      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setServices(servicesData);
      } else {
        // Fallback with mock data
        setServices([
          {
            id: 'api',
            name: 'API Server',
            status: 'online',
            uptime: '99.9%',
            responseTime: 145,
            lastCheck: new Date(),
            endpoint: '/api/health'
          },
          {
            id: 'database',
            name: 'Database',
            status: 'online',
            uptime: '99.8%',
            responseTime: 23,
            lastCheck: new Date()
          },
          {
            id: 'email',
            name: 'Email Service',
            status: 'online',
            uptime: '98.7%',
            responseTime: 890,
            lastCheck: new Date()
          },
          {
            id: 'storage',
            name: 'File Storage',
            status: 'degraded',
            uptime: '97.2%',
            responseTime: 1250,
            lastCheck: new Date()
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => {
    fetchSystemStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
      case 'degraded':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'critical':
      case 'offline':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'warning':
      case 'degraded':
        return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'critical':
      case 'offline':
        return 'text-red-500 bg-red-50 border-red-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getMetricIcon = (id: string) => {
    switch (id) {
      case 'cpu':
        return <CpuChipIcon className="h-6 w-6" />;
      case 'memory':
        return <ServerIcon className="h-6 w-6" />;
      case 'disk':
        return <CircleStackIcon className="h-6 w-6" />;
      case 'connections':
        return <GlobeAltIcon className="h-6 w-6" />;
      default:
        return <ChartBarIcon className="h-6 w-6" />;
    }
  };

  const overallStatus = () => {
    const criticalCount = [...systemMetrics, ...services].filter(
      item => item.status === 'critical' || item.status === 'offline'
    ).length;
    
    const warningCount = [...systemMetrics, ...services].filter(
      item => item.status === 'warning' || item.status === 'degraded'
    ).length;

    if (criticalCount > 0) return 'critical';
    if (warningCount > 0) return 'warning';
    return 'healthy';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
            <p className="text-gray-600 mt-1">Monitor system health and service availability</p>
          </div>
          <button
            onClick={fetchSystemStatus}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        
        {/* Overall Status */}
        <div className={`mt-4 p-4 rounded-lg border ${getStatusColor(overallStatus())}`}>
          <div className="flex items-center">
            {getStatusIcon(overallStatus())}
            <span className="ml-2 font-semibold">
              {overallStatus() === 'healthy' && 'All Systems Operational'}
              {overallStatus() === 'warning' && 'Some Systems Need Attention'}
              {overallStatus() === 'critical' && 'Critical Issues Detected'}
            </span>
            <span className="ml-auto text-sm">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {systemMetrics.map((metric) => (
            <div key={metric.id} className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${getStatusColor(metric.status)}`}>
                  {getMetricIcon(metric.id)}
                </div>
                {getStatusIcon(metric.status)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{metric.name}</h3>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {metric.value}{metric.unit}
              </div>
              <p className="text-sm text-gray-600 mt-2">{metric.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                Updated: {metric.lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Services Status */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Services</h2>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uptime
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Check
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {service.name}
                        </div>
                        {service.endpoint && (
                          <div className="text-xs text-gray-500 ml-2">
                            {service.endpoint}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(service.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(service.status)}`}>
                          {service.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {service.uptime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={service.responseTime > 1000 ? 'text-red-600' : service.responseTime > 500 ? 'text-yellow-600' : 'text-green-600'}>
                        {service.responseTime}ms
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.lastCheck.toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center">
              <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-600 mr-3" />
              <span>Refreshing system status...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemStatus;
