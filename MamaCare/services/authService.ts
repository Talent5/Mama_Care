import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, ApiResponse, User, setAuthServiceReference } from '../config/api';
import ApiService from './apiService';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private user: User | null = null;
  private onAuthFailureCallbacks: (() => void)[] = [];

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
      // Register this service with the API client for global auth error handling
      setAuthServiceReference(AuthService.instance);
    }
    return AuthService.instance;
  }

  // Register callback for authentication failure
  onAuthenticationFailure(callback: () => void): void {
    this.onAuthFailureCallbacks.push(callback);
  }

  // Remove authentication failure callback
  removeAuthenticationFailureCallback(callback: () => void): void {
    this.onAuthFailureCallbacks = this.onAuthFailureCallbacks.filter(cb => cb !== callback);
  }

  // Notify all callbacks about authentication failure
  private notifyAuthenticationFailure(): void {
    this.onAuthFailureCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in auth failure callback:', error);
      }
    });
  }

  async initialize(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (token && userData) {
        this.token = token;
        this.user = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
    }
  }

  async register(credentials: RegisterCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      // Force mobile registrations to be patients
      const response = await apiClient.post<AuthResponse>('/auth/register', {
        ...credentials,
        role: 'patient',
      });

      if (response.success && response.data) {
        if (response.data.user.role !== 'patient') {
          // Defensive: ensure non-patient accounts cannot be stored on device
          await this.performCompleteLogout();
          return {
            success: false,
            message: 'Only patients can register via the mobile app',
          } as ApiResponse<AuthResponse>;
        }
        await this.saveAuthData(response.data);
      }

      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);

      if (response.success && response.data) {
        if (response.data.user.role !== 'patient') {
          // Prevent non-patient roles from using the mobile app
          await this.performCompleteLogout();
          return {
            success: false,
            message: 'Only patients can sign in to the mobile app',
          } as ApiResponse<AuthResponse>;
        }
        await this.saveAuthData(response.data);
      }

      return response;
    } catch (error) {
      console.error('Login failed:', error);
      // Don't trigger authentication failure for login errors - these are user input errors
      // The API client will already avoid calling handleAuthenticationFailure for /auth/login endpoints
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('[AuthService] Starting complete logout process...');
      
      // Call logout endpoint if token exists
      if (this.token) {
        try {
          await apiClient.post('/auth/logout');
          console.log('[AuthService] Server logout successful');
        } catch (apiError) {
          console.error('Logout API call failed:', apiError);
          // Continue with local logout even if API call fails
        }
      }
    } catch (error) {
      console.error('Logout process error:', error);
      // Continue with local logout even if there are errors
    } finally {
      // Comprehensive cleanup - ensure total logout
      await this.performCompleteLogout();
    }
  }

  // Perform complete logout with all cleanup operations
  async performCompleteLogout(): Promise<void> {
    try {
      console.log('[AuthService] Performing complete logout cleanup...');
      
      // 1. Clear all localStorage data
      await this.clearAllLocalStorage();
      
      // 2. Reset internal authentication state
      this.token = null;
      this.user = null;
      
      // 3. Clear all authentication callbacks to prevent interference
      this.onAuthFailureCallbacks = [];
      
      // 4. Force clear specific critical keys (extra safety)
      try {
        await AsyncStorage.multiRemove([
          'auth_token',
          'user_data', 
          'onboarding_completed',
          'cached_user',
          'cached_medical_records',
          'registered_users',
          'user_preferences',
          'app_settings'
        ]);
      } catch (specificClearError) {
        console.error('Specific key clearing failed:', specificClearError);
      }
      
      // 5. Verify logout by checking if any auth data remains
      const remainingToken = await AsyncStorage.getItem('auth_token');
      const remainingUser = await AsyncStorage.getItem('user_data');
      
      if (remainingToken || remainingUser) {
        console.warn('[AuthService] Warning: Some auth data still present after logout');
        // Force clear again
        await AsyncStorage.multiRemove(['auth_token', 'user_data']);
      } else {
        console.log('[AuthService] Complete logout verified - all auth data cleared');
      }
      
      console.log('[AuthService] Complete logout finished successfully');
      
    } catch (error) {
      console.error('Complete logout cleanup error:', error);
      // Even if cleanup fails, ensure internal state is reset
      this.token = null;
      this.user = null;
      this.onAuthFailureCallbacks = [];
    }
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    try {
      if (!this.token) {
        throw new Error('No authentication token');
      }
      
      const response = await apiClient.get<{ user: User }>('/auth/me');
      
      if (response.success && response.data) {
        this.user = response.data.user;
        await AsyncStorage.setItem('user_data', JSON.stringify(this.user));
      } else {
        // API call succeeded but returned failure - token might be invalid
        throw new Error('Failed to get user data - token may be invalid');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to get current user:', error);
      
      // Check if this is an authentication error (401, 403, or token-related errors)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('401') || 
          errorMessage.includes('403') || 
          errorMessage.includes('token') ||
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('authentication')) {
        console.log('[AuthService] Authentication error detected, triggering failure handler');
        await this.handleAuthenticationFailure();
      }
      
      throw error;
    }
  }

  async changePassword(data: ChangePasswordData): Promise<ApiResponse> {
    try {
      return await apiClient.put('/auth/change-password', data);
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      return await ApiService.refreshTokenAsync();
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.handleAuthenticationFailure();
      return false;
    }
  }

  // Handle authentication failure by clearing all data and redirecting to onboarding
  async handleAuthenticationFailure(): Promise<void> {
    console.log('[AuthService] Handling authentication failure - clearing all localStorage');
    try {
      // Clear all localStorage data
      await this.clearAllLocalStorage();
      // Notify all registered callbacks
      this.notifyAuthenticationFailure();
    } catch (error) {
      console.error('Error during authentication failure cleanup:', error);
    }
  }

  // Validate token by making an authenticated request
  async validateToken(): Promise<boolean> {
    try {
      if (!this.token) {
        return false;
      }
      
      const response = await this.getCurrentUser();
      if (response.success) {
        return true;
      } else {
        // Token is invalid, clear everything
        await this.handleAuthenticationFailure();
        return false;
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      await this.handleAuthenticationFailure();
      return false;
    }
  }

  // Refresh localStorage for new user login/signup
  async refreshLocalStorageForNewUser(authData: AuthResponse): Promise<void> {
    try {
      console.log('[AuthService] Refreshing localStorage for new user:', authData.user.email);
      
      // First, clear all existing localStorage data to prevent data mixing
      await this.clearAllLocalStorage();
      
      // Set new user's auth data
      this.token = authData.token;
      this.user = authData.user;
      
      // Save new user's authentication data
      await AsyncStorage.multiSet([
        ['auth_token', authData.token],
        ['user_data', JSON.stringify(authData.user)]
      ]);
      
      // Mark onboarding as completed for this new session
      await this.setOnboardingCompleted();
      
      console.log('[AuthService] Successfully refreshed localStorage for user:', authData.user.firstName);
    } catch (error) {
      console.error('Failed to refresh localStorage for new user:', error);
      throw error;
    }
  }

  // Clear all localStorage data (comprehensive cleanup)
  async clearAllLocalStorage(): Promise<void> {
    try {
      console.log('[AuthService] Clearing all localStorage data');
      
      // Get all AsyncStorage keys
      const keys = await AsyncStorage.getAllKeys();
      
      // Filter out system keys that shouldn't be cleared
      const userDataKeys = keys.filter(key => 
        !key.startsWith('ReactNativeAsyncStorageDevtools') &&
        !key.startsWith('RCTAsyncLocalStorage') &&
        !key.startsWith('MMKV') &&
        key !== 'expo-constants@installationId'
      );
      
      // Clear all user data keys
      if (userDataKeys.length > 0) {
        await AsyncStorage.multiRemove(userDataKeys);
        console.log('[AuthService] Cleared localStorage keys:', userDataKeys);
      }
      
      // Reset internal state
      this.token = null;
      this.user = null;
      
    } catch (error) {
      console.error('Failed to clear all localStorage:', error);
      // Try to clear at least the essential keys
      try {
        await AsyncStorage.multiRemove([
          'auth_token',
          'user_data',
          'onboarding_completed',
          'cached_user',
          'cached_medical_records',
          'registered_users'
        ]);
      } catch (fallbackError) {
        console.error('Fallback localStorage clear also failed:', fallbackError);
      }
    }
  }

  private async saveAuthData(authData: AuthResponse): Promise<void> {
    try {
      // Use the new refresh method to ensure clean localStorage
      await this.refreshLocalStorageForNewUser(authData);
    } catch (error) {
      console.error('Failed to save auth data:', error);
      throw error;
    }
  }

  private async clearAuthData(): Promise<void> {
    try {
      this.token = null;
      this.user = null;
      
      await AsyncStorage.multiRemove([
        'auth_token',
        'user_data'
      ]);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  // Getters
  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.token !== null && this.user !== null;
  }

  // Check if user has completed onboarding (legacy support)
  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem('onboarding_completed');
      return completed === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  // Mark onboarding as completed
  async setOnboardingCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
    } catch (error) {
      console.error('Error setting onboarding completed:', error);
    }
  }

  // Clear onboarding status (for logout)
  async clearOnboardingStatus(): Promise<void> {
    try {
      await AsyncStorage.removeItem('onboarding_completed');
    } catch (error) {
      console.error('Error clearing onboarding status:', error);
    }
  }

  // Force complete logout - can be called from anywhere in the app
  async forceCompleteLogout(): Promise<void> {
    console.log('[AuthService] Force complete logout initiated');
    try {
      // Perform complete logout without API call (for emergency logout)
      await this.performCompleteLogout();
      
      // Trigger authentication failure callbacks to force app redirect
      this.notifyAuthenticationFailure();
      
      console.log('[AuthService] Force complete logout completed');
    } catch (error) {
      console.error('Force logout error:', error);
      // Even on error, trigger callbacks to force app redirect
      this.notifyAuthenticationFailure();
    }
  }

  // Check if user is truly logged out (verification method)
  async verifyLogoutStatus(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      const hasInternalState = this.token !== null || this.user !== null;
      
      const isLoggedOut = !token && !userData && !hasInternalState;
      
      if (!isLoggedOut) {
        console.warn('[AuthService] Logout verification failed - user may not be completely logged out');
        console.warn('Token exists:', !!token);
        console.warn('User data exists:', !!userData);
        console.warn('Internal state exists:', hasInternalState);
      } else {
        console.log('[AuthService] Logout verification passed - user is completely logged out');
      }
      
      return isLoggedOut;
    } catch (error) {
      console.error('Logout verification error:', error);
      return false;
    }
  }

  // Legacy compatibility methods - now includes token validation
  async isLoggedIn(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }
    
    // Validate token with server
    return await this.validateToken();
  }

  // Test method to manually trigger authentication failure (for testing)
  async testAuthenticationFailure(): Promise<void> {
    console.log('[AuthService] Test: Manually triggering authentication failure');
    await this.handleAuthenticationFailure();
  }
}

export default AuthService.getInstance();
