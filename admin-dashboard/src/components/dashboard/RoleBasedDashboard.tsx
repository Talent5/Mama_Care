import React from 'react';
import { UserRole } from '../../types/auth';
import { getDashboardWidgets, getRoleConfig } from '../../types/roles';
import NurseDashboard from './role-dashboards/NurseDashboard';
import DoctorDashboard from './role-dashboards/DoctorDashboard';
import MinistryDashboard from './role-dashboards/MinistryDashboard';
import AdminDashboard from './role-dashboards/AdminDashboard';

interface RoleBasedDashboardProps {
  userRole: UserRole;
  userName: string;
}

const RoleBasedDashboard: React.FC<RoleBasedDashboardProps> = ({ userRole, userName }) => {
  const roleConfig = getRoleConfig(userRole);
  const widgets = getDashboardWidgets(userRole);

  const renderDashboard = () => {
    switch (userRole) {
      case 'nurse':
        return <NurseDashboard widgets={widgets} userName={userName} />;
      case 'doctor':
        return <DoctorDashboard widgets={widgets} userName={userName} />;
      case 'ministry_official':
        return <MinistryDashboard widgets={widgets} userName={userName} />;
      case 'system_admin':
        return <AdminDashboard widgets={widgets} userName={userName} />;
      default:
        return <NurseDashboard widgets={widgets} userName={userName} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Role-specific header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {userName}
            </h1>
            <p className="text-sm text-gray-600" style={{ color: roleConfig.color }}>
              {roleConfig.name} Dashboard
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
               style={{ backgroundColor: `${roleConfig.color}20`, color: roleConfig.color }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: roleConfig.color }}></div>
            {roleConfig.role.replace('_', ' ').toUpperCase()}
          </div>
        </div>
      </div>

      {/* Role-specific dashboard content */}
      {renderDashboard()}
    </div>
  );
};

export default RoleBasedDashboard;
