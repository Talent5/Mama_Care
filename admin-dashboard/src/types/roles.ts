import { UserRole } from './auth';

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface RoleConfig {
  role: UserRole;
  name: string;
  description: string;
  permissions: string[];
  menuItems: string[];
  dashboardWidgets: string[];
  color: string;
  icon: string;
}

export const PERMISSIONS = {
  // Patient Management
  VIEW_PATIENTS: 'view_patients',
  CREATE_PATIENTS: 'create_patients',
  EDIT_PATIENTS: 'edit_patients',
  DELETE_PATIENTS: 'delete_patients',
  VIEW_MEDICAL_RECORDS: 'view_medical_records',
  EDIT_MEDICAL_RECORDS: 'edit_medical_records',
  VIEW_OWN_PATIENTS: 'view_own_patients',
  
  // Appointments
  VIEW_APPOINTMENTS: 'view_appointments',
  CREATE_APPOINTMENTS: 'create_appointments',
  EDIT_APPOINTMENTS: 'edit_appointments',
  CANCEL_APPOINTMENTS: 'cancel_appointments',
  
  // Analytics & Reports
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_REPORTS: 'view_reports',
  EXPORT_DATA: 'export_data',
  VIEW_SYSTEM_ANALYTICS: 'view_system_analytics',
  
  // User Management
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  MANAGE_ROLES: 'manage_roles',
  
  // System Management
  VIEW_SYSTEM_STATUS: 'view_system_status',
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_BACKUPS: 'manage_backups',
  
  // Alerts & Notifications
  VIEW_ALERTS: 'view_alerts',
  MANAGE_ALERTS: 'manage_alerts',
  SEND_NOTIFICATIONS: 'send_notifications',
  
  // Emergency
  EMERGENCY_ACCESS: 'emergency_access',
  EMERGENCY_OVERRIDE: 'emergency_override'
} as const;

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  patient: {
    role: 'patient',
    name: 'Patient (Mobile App User)',
    description: 'End users of the MamaCare mobile app with access to personal health features',
    permissions: [
      // Keep minimal; patients should not access admin dashboard features
    ],
    menuItems: [
      // Patients do not see admin dashboard menu
    ],
    dashboardWidgets: [],
    color: '#6b7280',
    icon: 'user'
  },
  nurse: {
    role: 'nurse',
    name: 'Healthcare Provider (Nurse)',
    description: 'Frontline healthcare providers focused on patient care and data entry',
    permissions: [
      PERMISSIONS.VIEW_PATIENTS,
      PERMISSIONS.CREATE_PATIENTS,
      PERMISSIONS.EDIT_PATIENTS,
      PERMISSIONS.VIEW_MEDICAL_RECORDS,
      PERMISSIONS.EDIT_MEDICAL_RECORDS,
      PERMISSIONS.VIEW_APPOINTMENTS,
      PERMISSIONS.CREATE_APPOINTMENTS,
      PERMISSIONS.EDIT_APPOINTMENTS,
      PERMISSIONS.VIEW_ALERTS,
      PERMISSIONS.EMERGENCY_ACCESS
    ],
    menuItems: [
      'dashboard',
      'patients',
      'appointments',
      'alerts',
      'settings'
    ],
    dashboardWidgets: [
      'patient_overview',
      'today_appointments',
      'pending_tasks',
      'alerts_summary',
      'quick_patient_registration'
    ],
    color: '#10b981',
    icon: 'stethoscope'
  },

  healthcare_provider: {
    role: 'healthcare_provider',
    name: 'Healthcare Provider',
    description: 'General healthcare providers with patient care and basic management capabilities',
    permissions: [
      PERMISSIONS.VIEW_PATIENTS,
      PERMISSIONS.CREATE_PATIENTS,
      PERMISSIONS.EDIT_PATIENTS,
      PERMISSIONS.VIEW_MEDICAL_RECORDS,
      PERMISSIONS.EDIT_MEDICAL_RECORDS,
      PERMISSIONS.VIEW_APPOINTMENTS,
      PERMISSIONS.CREATE_APPOINTMENTS,
      PERMISSIONS.EDIT_APPOINTMENTS,
      PERMISSIONS.VIEW_ALERTS,
      PERMISSIONS.VIEW_USERS,
      PERMISSIONS.EMERGENCY_ACCESS
    ],
    menuItems: [
      'dashboard',
      'patients',
      'appointments',
      'users',
      'alerts',
      'settings'
    ],
    dashboardWidgets: [
      'patient_overview',
      'today_appointments',
      'pending_tasks',
      'alerts_summary',
      'quick_patient_registration',
      'user_overview'
    ],
    color: '#059669',
    icon: 'user-nurse'
  },
  
  doctor: {
    role: 'doctor',
    name: 'Medical Doctor',
    description: 'Medical professionals with full patient management and diagnostic capabilities',
    permissions: [
      PERMISSIONS.VIEW_PATIENTS,
      PERMISSIONS.CREATE_PATIENTS,
      PERMISSIONS.EDIT_PATIENTS,
      PERMISSIONS.DELETE_PATIENTS,
      PERMISSIONS.VIEW_MEDICAL_RECORDS,
      PERMISSIONS.EDIT_MEDICAL_RECORDS,
      PERMISSIONS.VIEW_OWN_PATIENTS,
      PERMISSIONS.VIEW_APPOINTMENTS,
      PERMISSIONS.CREATE_APPOINTMENTS,
      PERMISSIONS.EDIT_APPOINTMENTS,
      PERMISSIONS.CANCEL_APPOINTMENTS,
      PERMISSIONS.VIEW_ANALYTICS,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.EXPORT_DATA,
      PERMISSIONS.VIEW_ALERTS,
      PERMISSIONS.MANAGE_ALERTS,
      PERMISSIONS.SEND_NOTIFICATIONS,
      PERMISSIONS.EMERGENCY_ACCESS,
      PERMISSIONS.EMERGENCY_OVERRIDE
    ],
    menuItems: [
      'dashboard',
      'patients',
      'appointments',
      'analytics',
      'alerts',
      'settings'
    ],
    dashboardWidgets: [
      'patient_overview',
      'medical_insights',
      'appointment_summary',
      'patient_analytics',
      'treatment_outcomes',
      'urgent_cases',
      'department_stats'
    ],
    color: '#3b82f6',
    icon: 'user-md'
  },
  
  ministry_official: {
    role: 'ministry_official',
    name: 'Ministry of Health Official',
    description: 'Government officials focused on oversight, analytics, and policy compliance',
    permissions: [
      PERMISSIONS.VIEW_PATIENTS,
      PERMISSIONS.VIEW_MEDICAL_RECORDS,
      PERMISSIONS.VIEW_APPOINTMENTS,
      PERMISSIONS.VIEW_ANALYTICS,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.EXPORT_DATA,
      PERMISSIONS.VIEW_SYSTEM_ANALYTICS,
      PERMISSIONS.VIEW_ALERTS,
      PERMISSIONS.VIEW_AUDIT_LOGS
    ],
    menuItems: [
      'dashboard',
      'analytics',
      'reports',
      'compliance',
      'audit_logs',
      'settings'
    ],
    dashboardWidgets: [
      'national_overview',
      'regional_analytics',
      'compliance_metrics',
      'public_health_indicators',
      'facility_performance',
      'data_quality_metrics',
      'trend_analysis'
    ],
    color: '#8b5cf6',
    icon: 'building'
  },
  
  system_admin: {
    role: 'system_admin',
    name: 'System Administrator',
    description: 'Technical administrators with full system access and user management',
    permissions: Object.values(PERMISSIONS),
    menuItems: [
      'dashboard',
      'users',
      'system_status',
      'analytics',
      'settings',
      'audit_logs',
      'backups',
      'security'
    ],
    dashboardWidgets: [
      'system_health',
      'user_activity',
      'performance_metrics',
      'security_alerts',
      'database_status',
      'server_resources',
      'backup_status',
      'api_monitoring',
      'error_tracking'
    ],
    color: '#ef4444',
    icon: 'shield'
  }
};

export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  const roleConfig = ROLE_CONFIGS[userRole];
  return roleConfig.permissions.includes(permission);
};

export const canAccessMenuItem = (userRole: UserRole, menuItem: string): boolean => {
  const roleConfig = ROLE_CONFIGS[userRole];
  return roleConfig.menuItems.includes(menuItem);
};

export const getDashboardWidgets = (userRole: UserRole): string[] => {
  const roleConfig = ROLE_CONFIGS[userRole];
  return roleConfig.dashboardWidgets;
};

export const getRoleConfig = (userRole: UserRole): RoleConfig => {
  const config = ROLE_CONFIGS[userRole as keyof typeof ROLE_CONFIGS];
  if (!config) {
    // Provide better fallback logic
    console.warn(`Role config not found for role: ${userRole}. Available roles:`, Object.keys(ROLE_CONFIGS));
    
    // Try to match similar roles
    if (userRole.includes('nurse') || userRole.includes('healthcare')) {
      return ROLE_CONFIGS.healthcare_provider;
    } else if (userRole.includes('doctor') || userRole.includes('physician')) {
      return ROLE_CONFIGS.doctor;
    } else if (userRole.includes('admin') || userRole.includes('system')) {
      return ROLE_CONFIGS.system_admin;
    } else if (userRole.includes('ministry') || userRole.includes('official')) {
      return ROLE_CONFIGS.ministry_official;
    }
    
    // Default fallback to healthcare_provider as it has user viewing permissions
    console.warn(`No suitable role match found. Defaulting to healthcare_provider role.`);
    return ROLE_CONFIGS.healthcare_provider;
  }
  return config;
};
