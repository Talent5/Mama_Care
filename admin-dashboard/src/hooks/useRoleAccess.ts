import { useAuth } from './useAuth';
import { hasPermission, canAccessMenuItem, getRoleConfig } from '../types/roles';
import { UserRole } from '../types/auth';

export const useRoleAccess = () => {
  const { user } = useAuth();

  const checkPermission = (permission: string): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  };

  const checkMenuAccess = (menuItem: string): boolean => {
    if (!user) return false;
    return canAccessMenuItem(user.role, menuItem);
  };

  const getUserRoleConfig = () => {
    if (!user) return null;
    return getRoleConfig(user.role);
  };

  const isRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const isAnyRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  // Role-specific checks
  const isNurse = (): boolean => isRole('nurse');
  const isDoctor = (): boolean => isRole('doctor');
  const isHealthcareProvider = (): boolean => isRole('healthcare_provider');
  const isMinistryOfficial = (): boolean => isRole('ministry_official');
  const isSystemAdmin = (): boolean => isRole('system_admin');

  // Permission groups
  const canManagePatients = (): boolean => {
    return checkPermission('edit_patients') || checkPermission('create_patients');
  };

  const canViewAnalytics = (): boolean => {
    return checkPermission('view_analytics') || checkPermission('view_reports');
  };

  const canManageUsers = (): boolean => {
    return checkPermission('view_users') || checkPermission('create_users') || checkPermission('edit_users');
  };

  const canManageSystem = (): boolean => {
    return checkPermission('manage_system_settings') || checkPermission('view_system_status');
  };

  const hasEmergencyAccess = (): boolean => {
    return checkPermission('emergency_access') || checkPermission('emergency_override');
  };

  return {
    user,
    checkPermission,
    checkMenuAccess,
    getUserRoleConfig,
    isRole,
    isAnyRole,
    isNurse,
    isDoctor,
    isHealthcareProvider,
    isMinistryOfficial,
    isSystemAdmin,
    canManagePatients,
    canViewAnalytics,
    canManageUsers,
    canManageSystem,
    hasEmergencyAccess,
  };
};
