// Development configuration and utilities
export const DEV_CONFIG = {
  // Enable console logging
  enableLogging: __DEV__,
  
  // Test user credentials for quick testing
  testUser: {
    fullName: 'Test User',
    phoneNumber: '+263771234567',
    password: 'test123',
  },
  
  // Default language for testing
  defaultLanguage: 'en',
  
  // Skip onboarding for development (set to true to skip language selection)
  skipOnboarding: false,
  
  // Auto-login for development (set to true to automatically log in test user)
  autoLogin: false,
  
  // Storage keys (for debugging)
  storageKeys: {
    onboardingCompleted: 'onboarding_completed',
    registeredUsers: 'registered_users',
    currentUser: 'current_user',
    userLanguage: 'userLanguage',
  },
};

// Development utilities
export const DevUtils = {
  log: (message: string, data?: any) => {
    if (DEV_CONFIG.enableLogging) {
      console.log(`[MamaCare Dev] ${message}`, data || '');
    }
  },
  
  error: (message: string, error?: any) => {
    if (DEV_CONFIG.enableLogging) {
      console.error(`[MamaCare Error] ${message}`, error || '');
    }
  },
  
  warn: (message: string, data?: any) => {
    if (DEV_CONFIG.enableLogging) {
      console.warn(`[MamaCare Warning] ${message}`, data || '');
    }
  },
};
