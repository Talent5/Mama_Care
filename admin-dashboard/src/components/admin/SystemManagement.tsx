import React, { useState, useEffect } from 'react';
import {
  Server,
  Database,
  Activity,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Monitor,
  HardDrive,
  Cpu,
  MemoryStick,
  Clock
} from 'lucide-react';

interface SystemManagementProps {
  className?: string;
}

interface SystemStatus {
  overall: 'healthy' | 'warning' | 'error';
  uptime: string;
  totalUsers: number;
  activeUsers: number;
  systemLoad: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  lastUpdated: Date;
}

interface ServerInfo {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'error';
  cpu: number;
  memory: number;
  disk: number;
  uptime: string;
  location: string;
  lastCheck: string;
  ipAddress: string;
  os: string;
  version: string;
}

interface DatabaseInfo {
  type: string;
  version: string;
  size: string;
  connections: number;
  maxConnections: number;
  queriesPerSecond: number;
  slowQueries: number;
  indexEfficiency: string;
  replicationLag: string;
  lastOptimized: Date;
}

interface BackupInfo {
  id: number;
  type: 'full' | 'incremental' | 'differential';
  size: string;
  status: 'completed' | 'running' | 'failed' | 'scheduled';
  timestamp: string;
  duration: string;
  retention: string;
  location: string;
  checksum: string;
}

const SystemManagement: React.FC<SystemManagementProps> = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'servers' | 'database' | 'backups' | 'monitoring'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for real system data
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [backups, setBackups] = useState<BackupInfo[]>([]);

  // API endpoints - replace with your actual backend URLs
  const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
  
  const apiEndpoints = {
    systemStatus: `${API_BASE_URL}/admin/system/status`,
    servers: `${API_BASE_URL}/admin/system/servers`,
    database: `${API_BASE_URL}/admin/system/database`,
    backups: `${API_BASE_URL}/admin/system/backups`,
    monitoring: `${API_BASE_URL}/admin/system/monitoring`
  };

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('Authentication required');
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        // Fetch all system data in parallel
        const [statusRes, serversRes, dbRes, backupsRes] = await Promise.all([
          fetch(apiEndpoints.systemStatus, { headers }),
          fetch(apiEndpoints.servers, { headers }),
          fetch(apiEndpoints.database, { headers }),
          fetch(apiEndpoints.backups, { headers })
        ]);

        // Check for errors
        if (!statusRes.ok || !serversRes.ok || !dbRes.ok || !backupsRes.ok) {
          throw new Error('One or more requests failed');
        }

        // Parse responses
        const [statusData, serversData, dbData, backupsData] = await Promise.all([
          statusRes.json(),
          serversRes.json(),
          dbRes.json(),
          backupsRes.json()
        ]);

        setSystemStatus(statusData.data || statusData);
        setServers(serversData.data || serversData);
        setDatabaseInfo(dbData.data || dbData);
        setBackups(backupsData.data || backupsData);

      } catch (err) {
        console.error('Failed to initialize system data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load system data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [apiEndpoints.systemStatus, apiEndpoints.servers, apiEndpoints.database, apiEndpoints.backups]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [statusRes, serversRes, dbRes, backupsRes] = await Promise.all([
        fetch(apiEndpoints.systemStatus, { headers }),
        fetch(apiEndpoints.servers, { headers }),
        fetch(apiEndpoints.database, { headers }),
        fetch(apiEndpoints.backups, { headers })
      ]);

      if (!statusRes.ok || !serversRes.ok || !dbRes.ok || !backupsRes.ok) {
        throw new Error('Failed to refresh some data');
      }

      const [statusData, serversData, dbData, backupsData] = await Promise.all([
        statusRes.json(),
        serversRes.json(),
        dbRes.json(),
        backupsRes.json()
      ]);

      setSystemStatus(statusData.data || statusData);
      setServers(serversData.data || serversData);
      setDatabaseInfo(dbData.data || dbData);
      setBackups(backupsData.data || backupsData);

    } catch (err) {
      console.error('Failed to refresh data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  // Create manual backup
  const createBackup = async (type: 'full' | 'incremental' = 'full') => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiEndpoints.backups}/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Refresh backup list
      const backupsRes = await fetch(apiEndpoints.backups, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (backupsRes.ok) {
        const backupsData = await backupsRes.json();
        setBackups(backupsData.data || backupsData);
      }
      
      alert('Backup initiated successfully');
    } catch (err) {
      console.error('Failed to create backup:', err);
      alert('Failed to create backup');
    }
  };

  // Restore from backup
  const restoreBackup = async (backupId: number) => {
    if (!confirm('Are you sure you want to restore from this backup? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiEndpoints.backups}/${backupId}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      alert('Backup restoration initiated successfully');
    } catch (err) {
      console.error('Failed to restore backup:', err);
      alert('Failed to restore backup');
    }
  };

  // Optimize database
  const optimizeDatabase = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiEndpoints.database}/optimize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Refresh database info
      const dbRes = await fetch(apiEndpoints.database, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (dbRes.ok) {
        const dbData = await dbRes.json();
        setDatabaseInfo(dbData.data || dbData);
      }
      
      alert('Database optimization initiated successfully');
    } catch (err) {
      console.error('Failed to optimize database:', err);
      alert('Failed to optimize database');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[#4ea674]" />
          <span className="text-lg text-gray-600">Loading system information...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">Error Loading System Data</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If no system status data available
  if (!systemStatus) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No System Data Available</h2>
        <p className="text-gray-600">Unable to retrieve system information.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-orange-600 bg-orange-50';
      case 'error':
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'running':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'error':
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'System Overview', icon: Monitor },
    { id: 'servers', label: 'Server Status', icon: Server },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'backups', label: 'Backups', icon: Download },
    { id: 'monitoring', label: 'Monitoring', icon: Activity }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Management</h1>
          <p className="text-gray-600">Monitor and manage system infrastructure</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#4ea674] text-white rounded-lg hover:bg-[#3d8f5f] disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className="text-2xl font-bold text-green-600">
                {systemStatus.overall === 'healthy' ? '100%' : '95%'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-blue-600">{systemStatus.activeUsers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Uptime</p>
              <p className="text-2xl font-bold text-purple-600">{systemStatus.uptime}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-orange-600">{systemStatus.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'servers' | 'database' | 'backups' | 'monitoring')}
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
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* System Resources */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-500" />
                  CPU Usage
                </h3>
                <span className="text-2xl font-bold text-blue-600">{systemStatus.systemLoad}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${systemStatus.systemLoad}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">Average across all servers</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MemoryStick className="w-5 h-5 text-green-500" />
                  Memory Usage
                </h3>
                <span className="text-2xl font-bold text-green-600">{systemStatus.memoryUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${systemStatus.memoryUsage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">System memory utilization</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-purple-500" />
                  Storage Usage
                </h3>
                <span className="text-2xl font-bold text-purple-600">{systemStatus.diskUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-purple-500 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${systemStatus.diskUsage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">Total storage utilization</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'servers' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Server Infrastructure</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Server</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Memory</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uptime</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Check</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {servers.map((server) => (
                  <tr key={server.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{server.name}</div>
                        <div className="text-sm text-gray-500">{server.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(server.status)}
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(server.status)}`}>
                          {server.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {server.cpu}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {server.memory}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {server.disk}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {server.uptime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {server.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {server.lastCheck}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'database' && (
        <div className="space-y-6">
          {databaseInfo ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Information</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Database Type:</span>
                    <span className="font-medium">{databaseInfo.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium">{databaseInfo.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Size:</span>
                    <span className="font-medium">{databaseInfo.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Connections:</span>
                    <span className="font-medium">{databaseInfo.connections} / {databaseInfo.maxConnections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Queries/Second:</span>
                    <span className="font-medium">{databaseInfo.queriesPerSecond.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Slow Queries:</span>
                    <span className="font-medium text-orange-600">{databaseInfo.slowQueries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Index Efficiency:</span>
                    <span className="font-medium text-green-600">{databaseInfo.indexEfficiency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Replication Lag:</span>
                    <span className="font-medium text-green-600">{databaseInfo.replicationLag}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Operations</h3>
                <div className="space-y-3">
                  <button 
                    onClick={optimizeDatabase}
                    className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Database className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <p className="font-medium text-blue-900">Optimize Database</p>
                      <p className="text-sm text-blue-600">Run maintenance and optimization</p>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => createBackup('full')}
                    className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <Download className="w-5 h-5 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium text-green-900">Create Backup</p>
                      <p className="text-sm text-green-600">Manual database backup</p>
                    </div>
                  </button>
                  
                  <button className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                    <Activity className="w-5 h-5 text-purple-600" />
                    <div className="text-left">
                      <p className="font-medium text-purple-900">View Query Logs</p>
                      <p className="text-sm text-purple-600">Monitor database queries</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Database Information Unavailable</h3>
              <p className="text-gray-600 mb-4">Unable to retrieve database information at this time.</p>
              <button 
                onClick={handleRefresh}
                className="px-4 py-2 bg-[#4ea674] text-white rounded-lg hover:bg-[#3d8660] transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'backups' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Backup Management</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => createBackup('incremental')}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Incremental
                </button>
                <button 
                  onClick={() => createBackup('full')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#4ea674] text-white rounded-lg hover:bg-[#3d8f5f] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Full Backup
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retention</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backups.map((backup) => (
                  <tr key={backup.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {backup.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {backup.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(backup.status)}
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(backup.status)}`}>
                          {backup.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {backup.timestamp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {backup.duration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {backup.retention}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-900">Download</button>
                        {backup.status === 'completed' && (
                          <button 
                            onClick={() => restoreBackup(backup.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Restore
                          </button>
                        )}
                        <button className="text-red-600 hover:text-red-900">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Latency:</span>
                  <span className="font-medium text-green-600">{systemStatus.networkLatency}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Packet Loss:</span>
                  <span className="font-medium text-green-600">0.01%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bandwidth Usage:</span>
                  <span className="font-medium">45.2 Mbps / 100 Mbps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Connections:</span>
                  <span className="font-medium">1,247</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Time:</span>
                  <span className="font-medium text-green-600">145ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Error Rate:</span>
                  <span className="font-medium text-green-600">0.02%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Requests/Minute:</span>
                  <span className="font-medium">2,450</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cache Hit Rate:</span>
                  <span className="font-medium text-green-600">94.7%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemManagement;
