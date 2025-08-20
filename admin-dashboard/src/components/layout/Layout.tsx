import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/auth';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Map router paths to our sidebar view names
  const getActiveViewFromPath = (pathname: string) => {
    switch (pathname) {
      case '/dashboard':
      case '/':
        return 'dashboard';
      case '/patients':
        return 'patients';
      case '/patient-activity':
        return 'patient-activity';
      case '/appointments':
        return 'appointments';
      case '/analytics':
        return 'analytics';
      case '/settings':
        return 'settings';
      case '/system-status':
        return 'system_status';
      case '/my-patients':
        return 'my-patients';
      case '/app-users':
        return 'app-users';
      case '/alerts':
        return 'alerts';
      case '/users':
        return 'users';
      case '/admin':
        return 'admin_control';
      case '/admin/users':
        return 'admin_users';
      case '/admin/system':
        return 'system_management';
      case '/admin/security':
        return 'security_management';
      case '/admin/analytics':
        return 'admin_analytics';
      default:
        return 'dashboard';
    }
  };

  const activeView = getActiveViewFromPath(location.pathname);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e9f8e7] to-[#f0f9ff]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - Always Fixed */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out shadow-xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar 
          activeView={activeView} 
          onViewChange={() => {
            // Navigation is handled by router, just close mobile sidebar
            setSidebarOpen(false);
          }}
          userRole={(user?.role || 'nurse') as UserRole}
        />
      </div>

      {/* Main content */}
      <div className="ml-0 lg:ml-64 min-h-screen">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
        <main className="pt-16 bg-transparent">
          <div className="h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
            <div className="px-3 sm:px-6 lg:px-8 py-6 lg:py-8 min-h-full">
              <div className="animate-fade-in w-full max-w-full bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 p-4 lg:p-6">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
