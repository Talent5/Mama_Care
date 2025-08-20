import React from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  AlertTriangle, 
  BarChart3, 
  Settings,
  Heart,
  Shield,
  Activity,
  FileText,
  CheckSquare,
  Server,
  Lock,
  UserCheck,
  Database
} from 'lucide-react';
import Logo from '../../../assets/Logo.png';
import { UserRole } from '../../types/auth';
import { getRoleConfig } from '../../types/roles';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  userRole: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, userRole }) => {
  const roleConfig = getRoleConfig(userRole);
  
  // Safety check for undefined roleConfig
  if (!roleConfig) {
    console.error('Unknown user role:', userRole);
    return (
      <div className="w-64 bg-gray-900 text-white p-4">
        <div className="text-red-400">
          Error: Unknown user role "{userRole}"
        </div>
      </div>
    );
  }
  
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      href: '/dashboard',
      roles: ['nurse', 'healthcare_provider', 'doctor', 'ministry_official', 'system_admin']
    },
    {
      id: 'my-patients',
      label: 'My Patients',
      icon: Heart,
      href: '/my-patients',
      roles: ['doctor']
    },
    {
      id: 'patients',
      label: 'Patient Management',
      icon: Users,
      href: '/patients',
      roles: ['nurse', 'healthcare_provider', 'doctor']
    },
    {
      id: 'app-users',
      label: 'App Users',
      icon: Users,
      href: '/app-users',
      roles: ['system_admin']
    },
    {
      id: 'patient-activity',
      label: 'Patient Activity',
      icon: Activity,
      href: '/patient-activity',
      roles: ['healthcare_provider', 'doctor', 'system_admin']
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: Calendar,
      href: '/appointments',
      roles: ['nurse', 'healthcare_provider', 'doctor']
    },
    {
      id: 'alerts',
      label: 'Alert Center',
      icon: AlertTriangle,
      href: '/alerts',
      roles: ['nurse', 'healthcare_provider', 'doctor', 'system_admin']
    },
    {
      id: 'analytics',
      label: 'Analytics & Reports',
      icon: BarChart3,
      href: '/analytics',
      roles: ['doctor', 'ministry_official', 'system_admin']
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      href: '/reports',
      roles: ['ministry_official', 'system_admin']
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: CheckSquare,
      href: '/compliance',
      roles: ['ministry_official']
    },
    {
      id: 'admin_control',
      label: 'Admin Control Panel',
      icon: Settings,
      href: '/admin',
      roles: ['system_admin']
    },
    {
      id: 'users',
      label: 'User Management',
      icon: UserCheck,
      href: '/users',
      roles: ['healthcare_provider', 'system_admin']
    },
    {
      id: 'admin_users',
      label: 'Advanced Users',
      icon: Users,
      href: '/admin/users',
      roles: ['system_admin']
    },
    {
      id: 'system_management',
      label: 'System Management',
      icon: Server,
      href: '/admin/system',
      roles: ['system_admin']
    },
    {
      id: 'security_management',
      label: 'Security Management',
      icon: Lock,
      href: '/admin/security',
      roles: ['system_admin']
    },
    {
      id: 'admin_analytics',
      label: 'Admin Analytics',
      icon: BarChart3,
      href: '/admin/analytics',
      roles: ['system_admin']
    },
    {
      id: 'system_status',
      label: 'System Status',
      icon: Server,
      href: '/system-status',
      roles: ['system_admin']
    },
    {
      id: 'audit_logs',
      label: 'Audit Logs',
      icon: Database,
      href: '/audit-logs',
      roles: ['ministry_official', 'system_admin']
    },
    {
      id: 'security',
      label: 'Security',
      icon: Lock,
      href: '/security',
      roles: ['system_admin']
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/settings',
      roles: ['nurse', 'healthcare_provider', 'doctor', 'ministry_official', 'system_admin']
    }
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <div className="w-64 h-screen bg-[#023337] shadow-xl flex flex-col">
      <div className="p-4 lg:p-6 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl transition-all duration-300 hover:scale-110 bg-white">
            <img 
              src={Logo} 
              alt="MamaCare Logo" 
              className="w-6 h-6 object-contain"
            />
          </div>
          <div>
            <h1 className="text-white text-lg font-bold">MamaCare</h1>
            <p className="text-gray-300 text-sm">Zimbabwe</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-sm font-medium">System Online</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {roleConfig.name}
          </div>
          <div className="text-xs text-gray-300 mt-1" style={{ color: roleConfig.color }}>
            {roleConfig.description}
          </div>
        </div>
      </div>

      <nav className="mt-6 flex-1 overflow-y-auto px-3">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <Link
              key={item.id}
              to={item.href}
              onClick={() => onViewChange('')}
              className={`w-full flex items-center gap-3 px-3 py-3 mb-1 text-left transition-all duration-200 group rounded-lg ${
                isActive 
                  ? 'bg-[#4ea674] text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 transition-all duration-200 flex-shrink-0 ${
                isActive ? 'scale-110' : 'group-hover:scale-110'
              }`} />
              <span className="font-medium truncate">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 rounded-full bg-white flex-shrink-0"></div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 lg:p-6 border-t border-gray-700 flex-shrink-0">
        <div className="text-center">
          <p className="text-gray-400 text-xs mb-2">
            © 2025 MamaCare Zimbabwe
          </p>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Shield className="w-3 h-3" />
            <span className="text-xs">Secure & Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;