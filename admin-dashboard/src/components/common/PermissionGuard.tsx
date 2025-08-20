import React from 'react';
import { useRoleAccess } from '../../hooks/useRoleAccess';
import { UserRole } from '../../types/auth';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  roles?: UserRole[];
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, user must have ALL permissions/roles
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  roles,
  fallback = null,
  requireAll = false
}) => {
  const { checkPermission, isAnyRole, user } = useRoleAccess();

  if (!user) {
    return <>{fallback}</>;
  }

  let hasAccess = true;

  // Check permission if provided
  if (permission) {
    hasAccess = checkPermission(permission);
  }

  // Check roles if provided
  if (roles && roles.length > 0) {
    const roleAccess = requireAll 
      ? roles.every(role => user.role === role)
      : isAnyRole(roles);
    
    hasAccess = permission ? (hasAccess && roleAccess) : roleAccess;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGuard;
