import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/Layout';
import Dashboard from './Dashboard';
import UserManagement from './users/UserManagement';
import PatientManagement from './patients/PatientManagement';
import AppointmentManagement from './appointments/AppointmentManagement';
import AnalyticsReports from './analytics/AnalyticsReports';
import AlertCenter from './alerts/AlertCenter';
import SettingsPanel from './settings/SettingsPanel';
import LoginForm from './auth/LoginForm';
import { useAuth } from '../hooks/useAuth';
import PermissionGuard from './common/PermissionGuard';
import PatientActivityDashboard from './PatientActivityDashboard';
import AppUsersManagement from './AppUsersManagement';
import MyPatients from './MyPatients';

// Import new admin components
import SystemManagement from './admin/SystemManagement';
import SecurityManagement from './admin/SecurityManagement';
import AdminAnalyticsReports from './admin/AdminAnalyticsReports';
import AdvancedUserManagement from './admin/AdvancedUserManagement';
import AdminControlPanel from './admin/AdminControlPanel';

// Import system components
import SystemStatus from './system/SystemStatus';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* User Management - Only for System Admins */}
        <Route 
          path="/users" 
          element={
            <PermissionGuard 
              permission="view_users"
              fallback={
                <div className="p-6 text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                  <p className="text-gray-600">You don't have permission to access user management.</p>
                </div>
              }
            >
              <UserManagement />
            </PermissionGuard>
          } 
        />
        
        {/* Advanced Admin Routes - Only for System Admins */}
        <Route 
          path="/admin" 
          element={
            <PermissionGuard 
              permission="manage_system_settings"
              fallback={
                <div className="p-6 text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                  <p className="text-gray-600">You don't have permission to access admin control panel.</p>
                </div>
              }
            >
              <AdminControlPanel />
            </PermissionGuard>
          } 
        />
        
        <Route 
          path="/admin/users" 
          element={
            <PermissionGuard 
              permission="view_users"
              fallback={
                <div className="p-6 text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                  <p className="text-gray-600">You don't have permission to access advanced user management.</p>
                </div>
              }
            >
              <AdvancedUserManagement />
            </PermissionGuard>
          } 
        />
        
        <Route 
          path="/admin/system" 
          element={
            <PermissionGuard 
              permission="view_system_status"
              fallback={
                <div className="p-6 text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                  <p className="text-gray-600">You don't have permission to access system management.</p>
                </div>
              }
            >
              <SystemManagement />
            </PermissionGuard>
          } 
        />
        
        <Route 
          path="/admin/security" 
          element={
            <PermissionGuard 
              permission="view_audit_logs"
              fallback={
                <div className="p-6 text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                  <p className="text-gray-600">You don't have permission to access security management.</p>
                </div>
              }
            >
              <SecurityManagement />
            </PermissionGuard>
          } 
        />
        
        <Route 
          path="/admin/analytics" 
          element={
            <PermissionGuard 
              permission="view_system_analytics"
              fallback={
                <div className="p-6 text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                  <p className="text-gray-600">You don't have permission to access admin analytics.</p>
                </div>
              }
            >
              <AdminAnalyticsReports />
            </PermissionGuard>
          } 
        />
        
        {/* App Users Management - Only for System Admins */}
        <Route 
          path="/app-users" 
          element={
            <PermissionGuard 
              permission="view_users"
              fallback={
                <div className="p-6 text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                  <p className="text-gray-600">You don't have permission to access app users management.</p>
                </div>
              }
            >
              <AppUsersManagement />
            </PermissionGuard>
          } 
        />

        {/* My Patients - Only for Doctors */}
        <Route 
          path="/my-patients" 
          element={
            <PermissionGuard 
              permission="view_own_patients"
              fallback={
                <div className="p-6 text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                  <p className="text-gray-600">You don't have permission to access patient management.</p>
                </div>
              }
            >
              <MyPatients />
            </PermissionGuard>
          } 
        />
        
        {/* Other Routes */}
        <Route path="/patients" element={<PatientManagement />} />
        <Route path="/patient-activity" element={<PatientActivityDashboard />} />
        <Route path="/appointments" element={<AppointmentManagement />} />
        <Route path="/analytics" element={<AnalyticsReports />} />
        <Route path="/alerts" element={<AlertCenter />} />
        <Route path="/settings" element={<SettingsPanel />} />
        
        {/* System Status - Only for System Admins */}
        <Route 
          path="/system-status" 
          element={
            <PermissionGuard 
              permission="view_system_status"
              fallback={
                <div className="p-6 text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                  <p className="text-gray-600">You don't have permission to access system status.</p>
                </div>
              }
            >
              <SystemStatus />
            </PermissionGuard>
          } 
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

export default AppRoutes;
