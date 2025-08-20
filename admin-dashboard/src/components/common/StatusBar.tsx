import React from 'react';
import { Activity, Clock, Database, Wifi, Shield, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getRoleConfig } from '../../types/roles';

interface StatusBarProps {
  lastUpdate: Date | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ lastUpdate, loading, error, onRefresh }) => {
  const { user } = useAuth();
  const roleConfig = user ? getRoleConfig(user.role) : null;
  
  const formatLastUpdate = (date: Date | string | null) => {
    if (!date) return 'Never';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    return dateObj.toLocaleDateString();
  };

  const getDataFreshnessStatus = () => {
    if (error) return { text: 'Offline Mode', color: 'red' };
    if (loading) return { text: 'Syncing Data', color: 'blue' };
    if (user?.role === 'system_admin') return { text: 'Real-time Monitoring', color: 'green' };
    return { text: 'Live Data', color: 'green' };
  };

  const dataStatus = getDataFreshnessStatus();

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'} ${!error && 'animate-pulse'}`}></div>
            <Wifi className={`w-4 h-4 ${error ? 'text-red-500' : 'text-green-500'}`} />
            <span className={`text-sm font-medium ${error ? 'text-red-600' : 'text-green-600'}`}>
              {error ? 'Offline' : 'Connected'}
            </span>
          </div>

          {/* Database Status */}
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">
              {loading ? 'Syncing...' : 'Database OK'}
            </span>
          </div>

          {/* Last Update */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Last update: {formatLastUpdate(lastUpdate)}
            </span>
          </div>
        </div>

        {/* Data Freshness Indicator */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            dataStatus.color === 'green' ? 'bg-green-50 text-green-700' :
            dataStatus.color === 'blue' ? 'bg-blue-50 text-blue-700' :
            'bg-red-50 text-red-700'
          }`}>
            <Activity className="w-3 h-3" />
            <span>{dataStatus.text}</span>
          </div>
          
          {roleConfig && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm"
                 style={{ backgroundColor: `${roleConfig.color}20`, color: roleConfig.color }}>
              <Users className="w-3 h-3" />
              <span>{roleConfig.role.replace('_', ' ').toUpperCase()}</span>
            </div>
          )}
          
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-xs text-gray-500 hover:text-[#4ea674] transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            <strong>Connection Error:</strong> {error}
          </p>
          <p className="text-xs text-red-500 mt-1">
            Using cached data. Click refresh to retry connection.
          </p>
        </div>
      )}
    </div>
  );
};

export default StatusBar;
