import React from 'react';
import { AlertTriangle, Info, CheckCircle, Users, Shield, Activity } from 'lucide-react';
import { useRoleAccess } from '../../hooks/useRoleAccess';

interface RoleSpecificAlert {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  action?: string;
  roles: string[];
}

const RoleBasedAlerts: React.FC = () => {
  const { user, isNurse, isDoctor, isHealthcareProvider, isMinistryOfficial, isSystemAdmin } = useRoleAccess();

  // Sample role-specific alerts - in real app, these would come from API
  const alerts: RoleSpecificAlert[] = [
    {
      id: '1',
      type: 'warning',
      message: 'You have 5 pending patient record updates',
      action: 'Review Now',
      roles: ['nurse', 'healthcare_provider']
    },
    {
      id: '2',
      type: 'info',
      message: '3 critical patients require immediate attention',
      action: 'View Patients',
      roles: ['doctor']
    },
    {
      id: '3',
      type: 'success',
      message: 'Monthly compliance report ready for review',
      action: 'Download Report',
      roles: ['ministry_official']
    },
    {
      id: '4',
      type: 'warning',
      message: 'Server CPU usage at 85% - consider scaling',
      action: 'Check Status',
      roles: ['system_admin']
    },
    {
      id: '5',
      type: 'info',
      message: 'New maternal health guidelines published',
      action: 'Read Guidelines',
      roles: ['nurse', 'healthcare_provider', 'doctor']
    },
    {
      id: '6',
      type: 'info',
      message: 'User management permissions updated',
      action: 'View Changes',
      roles: ['healthcare_provider']
    }
  ];

  if (!user) return null;

  const relevantAlerts = alerts.filter(alert => 
    alert.roles.includes(user.role)
  );

  if (relevantAlerts.length === 0) return null;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getRoleInfo = () => {
    if (isNurse()) return { icon: Users, label: 'Nursing Tasks', color: 'text-green-600' };
    if (isDoctor()) return { icon: Activity, label: 'Medical Alerts', color: 'text-blue-600' };
    if (isMinistryOfficial()) return { icon: CheckCircle, label: 'Compliance Updates', color: 'text-purple-600' };
    if (isSystemAdmin()) return { icon: Shield, label: 'System Alerts', color: 'text-red-600' };
    return { icon: Info, label: 'Notifications', color: 'text-gray-600' };
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <RoleIcon className={`w-5 h-5 ${roleInfo.color}`} />
          <h3 className={`font-medium ${roleInfo.color}`}>{roleInfo.label}</h3>
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
            {relevantAlerts.length}
          </span>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        {relevantAlerts.slice(0, 3).map((alert) => (
          <div key={alert.id} className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}>
            <div className="flex items-start gap-3">
              {getAlertIcon(alert.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{alert.message}</p>
                {alert.action && (
                  <button className="text-xs mt-1 hover:underline font-medium">
                    {alert.action} →
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {relevantAlerts.length > 3 && (
          <button className="w-full text-center text-sm text-gray-600 hover:text-gray-800 py-2">
            View {relevantAlerts.length - 3} more alerts
          </button>
        )}
      </div>
    </div>
  );
};

export default RoleBasedAlerts;
