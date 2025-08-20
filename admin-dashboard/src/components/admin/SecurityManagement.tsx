import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Lock,
  Eye,
  UserX,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Settings,
  Key,
  Database,
  Activity,
  FileText,
  Download,
  RefreshCw,
  Search,
  Filter,
  Calendar
} from 'lucide-react';
import { adminAPI } from '../../services/api';

interface SecurityEvent {
  id: string;
  type: 'login_failure' | 'login_success' | 'logout' | 'password_change' | 'role_change' | 'data_access' | 'data_export' | 'suspicious_activity' | 'unauthorized_access' | 'account_locked' | 'account_unlocked' | 'security_scan' | 'system_change';
  userId?: string;
  user?: string; // For backward compatibility
  userName?: string;
  email?: string; // For backward compatibility  
  userEmail?: string;
  ipAddress: string;
  userAgent?: string;
  location: string;
  timestamp?: Date;
  createdAt?: Date;
  details: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  notes?: string;
  metadata?: Record<string, any>;
}

interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    maxAge: number;
  };
  loginSecurity: {
    maxFailedAttempts: number;
    lockoutDuration: number;
    twoFactorRequired: boolean;
    sessionTimeout: number;
  };
  auditSettings: {
    logRetention: number;
    realTimeAlerts: boolean;
    emailNotifications: boolean;
  };
}

const SecurityManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'policies' | 'audit' | 'threats'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters for events
  const [eventFilters, setEventFilters] = useState({
    type: 'all',
    riskLevel: 'all',
    resolved: 'all',
    page: '1',
    limit: '20'
  });

  // Real data from API
  const [securityMetrics, setSecurityMetrics] = useState({
    totalEvents: 0,
    criticalAlerts: 0,
    failedLogins: 0,
    blockedIPs: 0,
    activeSessions: 0,
    lastSecurityScan: 'Never',
    vulnerabilities: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }
  });

  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [eventsPagination, setEventsPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 20
  });

  // Fetch security metrics
  const fetchSecurityMetrics = useCallback(async () => {
    try {
      const response = await adminAPI.getSecurityMetrics();
      if (response.success) {
        setSecurityMetrics(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch security metrics:', err);
      setError('Failed to load security metrics');
    }
  }, []);

  // Fetch security events
  const fetchSecurityEvents = useCallback(async () => {
    try {
      const response = await adminAPI.getSecurityEvents(eventFilters);
      if (response.success) {
        setRecentEvents(response.data.data || response.data);
        if (response.data.pagination) {
          setEventsPagination(response.data.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to fetch security events:', err);
      setError('Failed to load security events');
    }
  }, [eventFilters]);

  // Fetch security settings
  const fetchSecuritySettings = useCallback(async () => {
    try {
      const response = await adminAPI.getSecuritySettings();
      if (response.success) {
        setSecuritySettings(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch security settings:', err);
      // Keep default settings if API fails
    }
  }, []);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchSecurityMetrics(),
          fetchSecurityEvents(),
          fetchSecuritySettings()
        ]);
      } catch (err) {
        console.error('Failed to initialize security data:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [fetchSecurityMetrics, fetchSecurityEvents, fetchSecuritySettings]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchSecurityMetrics(),
        fetchSecurityEvents()
      ]);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh data:', err);
      setError('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle security scan
  const handleSecurityScan = async () => {
    try {
      setRefreshing(true);
      const response = await adminAPI.triggerSecurityScan();
      if (response.success) {
        await fetchSecurityMetrics();
        alert('Security scan initiated successfully');
      }
    } catch (err) {
      console.error('Failed to trigger security scan:', err);
      alert('Failed to trigger security scan');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle security report download
  const handleDownloadReport = async () => {
    try {
      const response = await adminAPI.generateSecurityReport();
      if (response.success) {
        // Create and download the report
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `security-report-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      }
    } catch (err) {
      console.error('Failed to generate security report:', err);
      alert('Failed to generate security report');
    }
  };

  // Handle event resolution
  const handleResolveEvent = async (eventId: string, notes?: string) => {
    try {
      const response = await adminAPI.resolveSecurityEvent(eventId, notes);
      if (response.success) {
        await fetchSecurityEvents();
      }
    } catch (err) {
      console.error('Failed to resolve security event:', err);
      alert('Failed to resolve security event');
    }
  };

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
      maxAge: 90
    },
    loginSecurity: {
      maxFailedAttempts: 5,
      lockoutDuration: 30,
      twoFactorRequired: false,
      sessionTimeout: 480
    },
    auditSettings: {
      logRetention: 365,
      realTimeAlerts: true,
      emailNotifications: true
    }
  });

  // Update security settings
  const updateSecuritySettings = useCallback(async (newSettings: SecuritySettings) => {
    try {
      const response = await adminAPI.updateSecuritySettings(newSettings);
      if (response.success) {
        setSecuritySettings(newSettings);
        alert('Security settings updated successfully');
      }
    } catch (err) {
      console.error('Failed to update security settings:', err);
      alert('Failed to update security settings');
    }
  }, []);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'login_failure':
        return <UserX className="w-4 h-4 text-red-500" />;
      case 'login_success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'password_change':
        return <Key className="w-4 h-4 text-blue-500" />;
      case 'role_change':
        return <Settings className="w-4 h-4 text-purple-500" />;
      case 'data_access':
        return <Database className="w-4 h-4 text-orange-500" />;
      case 'suspicious_activity':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleSettingsUpdate = async (section: keyof SecuritySettings, field: string, value: string | number | boolean) => {
    const newSettings = {
      ...securitySettings,
      [section]: {
        ...securitySettings[section],
        [field]: value
      }
    };
    
    await updateSecuritySettings(newSettings);
  };

  return (
    <div className="p-6 space-y-6">
      {loading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#4ea674]" />
            <span className="text-lg text-gray-600">Loading security data...</span>
          </div>
        </div>
      ) : (
        <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Management</h1>
          <p className="text-gray-600">Monitor security events and manage system security policies</p>
          {error && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-md">
              {error}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-4 py-2 bg-[#4ea674] text-white rounded-lg hover:bg-[#3d8f5f] transition-colors"
          >
            <Download className="w-4 h-4" />
            Security Report
          </button>
          <button 
            onClick={handleSecurityScan}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <Shield className="w-4 h-4" />
            Security Scan
          </button>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Security Events</p>
              <p className="text-2xl font-bold text-blue-600">{securityMetrics.totalEvents}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
              <p className="text-2xl font-bold text-red-600">{securityMetrics.criticalAlerts}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed Logins</p>
              <p className="text-2xl font-bold text-orange-600">{securityMetrics.failedLogins}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <UserX className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-green-600">{securityMetrics.activeSessions}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Security Overview', icon: Shield },
            { id: 'events', label: 'Security Events', icon: Eye },
            { id: 'policies', label: 'Security Policies', icon: Lock },
            { id: 'audit', label: 'Audit Trail', icon: FileText },
            { id: 'threats', label: 'Threat Analysis', icon: AlertTriangle }
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
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Vulnerability Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vulnerability Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{securityMetrics.vulnerabilities.critical}</div>
                <div className="text-sm text-gray-600">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{securityMetrics.vulnerabilities.high}</div>
                <div className="text-sm text-gray-600">High</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{securityMetrics.vulnerabilities.medium}</div>
                <div className="text-sm text-gray-600">Medium</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{securityMetrics.vulnerabilities.low}</div>
                <div className="text-sm text-gray-600">Low</div>
              </div>
            </div>
          </div>

          {/* Recent Critical Events */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Security Events</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentEvents.filter(event => event.riskLevel === 'high' || event.riskLevel === 'critical').slice(0, 3).map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {getEventTypeIcon(event.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{event.details}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(event.riskLevel)}`}>
                          {event.riskLevel.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.timestamp || event.createdAt ? new Date(event.timestamp || event.createdAt).toLocaleString('en-ZW', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          }) : 'Unknown'}
                        </span>
                        <span className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {event.ipAddress} - {event.location}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Security Event Log</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentEvents.map((event) => (
                  <tr key={event.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getEventTypeIcon(event.type)}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {event.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          <div className="text-sm text-gray-500">{event.details}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{event.userName || event.user || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{event.userEmail || event.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {event.ipAddress}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.location || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskColor(event.riskLevel)}`}>
                        {event.riskLevel.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.timestamp || event.createdAt ? new Date(event.timestamp || event.createdAt).toLocaleString('en-ZW', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      }) : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => alert(`Event details: ${event.details}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          View
                        </button>
                        {!event.resolved && event.riskLevel !== 'low' && (
                          <button 
                            onClick={() => handleResolveEvent(event.id, `Resolved by admin at ${new Date().toISOString()}`)}
                            className="text-green-600 hover:text-green-900"
                            title="Mark as Resolved"
                          >
                            Resolve
                          </button>
                        )}
                        {(event.type === 'login_failure' || event.type === 'suspicious_activity') && (
                          <button 
                            onClick={() => alert(`IP ${event.ipAddress} would be blocked`)}
                            className="text-red-600 hover:text-red-900"
                            title="Block IP"
                          >
                            Block IP
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'policies' && (
        <div className="space-y-6">
          {/* Password Policy */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Password Policy</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  value={securitySettings.passwordPolicy.minLength}
                  onChange={(e) => handleSettingsUpdate('passwordPolicy', 'minLength', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Max Age (days)
                </label>
                <input
                  type="number"
                  value={securitySettings.passwordPolicy.maxAge}
                  onChange={(e) => handleSettingsUpdate('passwordPolicy', 'maxAge', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={securitySettings.passwordPolicy.requireUppercase}
                  onChange={(e) => handleSettingsUpdate('passwordPolicy', 'requireUppercase', e.target.checked)}
                  className="rounded border-gray-300 text-[#4ea674] focus:ring-[#4ea674]"
                />
                <span className="ml-2 text-sm text-gray-700">Require uppercase letters</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={securitySettings.passwordPolicy.requireLowercase}
                  onChange={(e) => handleSettingsUpdate('passwordPolicy', 'requireLowercase', e.target.checked)}
                  className="rounded border-gray-300 text-[#4ea674] focus:ring-[#4ea674]"
                />
                <span className="ml-2 text-sm text-gray-700">Require lowercase letters</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={securitySettings.passwordPolicy.requireNumbers}
                  onChange={(e) => handleSettingsUpdate('passwordPolicy', 'requireNumbers', e.target.checked)}
                  className="rounded border-gray-300 text-[#4ea674] focus:ring-[#4ea674]"
                />
                <span className="ml-2 text-sm text-gray-700">Require numbers</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={securitySettings.passwordPolicy.requireSymbols}
                  onChange={(e) => handleSettingsUpdate('passwordPolicy', 'requireSymbols', e.target.checked)}
                  className="rounded border-gray-300 text-[#4ea674] focus:ring-[#4ea674]"
                />
                <span className="ml-2 text-sm text-gray-700">Require special characters</span>
              </label>
            </div>
          </div>

          {/* Login Security */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Login Security</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Failed Login Attempts
                </label>
                <input
                  type="number"
                  value={securitySettings.loginSecurity.maxFailedAttempts}
                  onChange={(e) => handleSettingsUpdate('loginSecurity', 'maxFailedAttempts', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Lockout Duration (minutes)
                </label>
                <input
                  type="number"
                  value={securitySettings.loginSecurity.lockoutDuration}
                  onChange={(e) => handleSettingsUpdate('loginSecurity', 'lockoutDuration', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={securitySettings.loginSecurity.twoFactorRequired}
                  onChange={(e) => handleSettingsUpdate('loginSecurity', 'twoFactorRequired', e.target.checked)}
                  className="rounded border-gray-300 text-[#4ea674] focus:ring-[#4ea674]"
                />
                <span className="ml-2 text-sm text-gray-700">Require Two-Factor Authentication</span>
              </label>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default SecurityManagement;
