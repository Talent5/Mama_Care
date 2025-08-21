// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

// Authentication Configuration
export const AUTH_TOKEN_KEY = 'mamacare_auth_token';

// File Upload Configuration
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

// Notification Configuration
export const NOTIFICATION_DURATION = 3000; // 3 seconds

// Date Format Configuration
export const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';
export const DEFAULT_TIME_FORMAT = 'HH:mm:ss';

// Pagination Configuration
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];

// System Configuration
export const SYSTEM_VERSION = '2.1.0';
export const SYSTEM_NAME = 'MamaCare';

// Feature Flags
export const FEATURES = {
  ENABLE_2FA: true,
  ENABLE_DATA_EXPORT: true,
  ENABLE_DARK_MODE: false,
  ENABLE_NOTIFICATIONS: true
}; 