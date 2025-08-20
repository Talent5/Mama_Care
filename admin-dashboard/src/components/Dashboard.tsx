import React from 'react';
import { useAuth } from '../hooks/useAuth';
import RoleBasedDashboard from './dashboard/RoleBasedDashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
          <p className="text-gray-600">Please wait while we load your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <RoleBasedDashboard 
      userRole={user.role} 
      userName={user.name}
    />
  );
};

export default Dashboard;