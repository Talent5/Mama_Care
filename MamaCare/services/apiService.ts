import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// API Configuration
const getApiBaseUrl = () => {
  // When using Expo Go on physical device, use your computer's local IP address
  // Replace YOUR_LOCAL_IP with your computer's IP address (e.g., 192.168.1.100)
  const LOCAL_IP = '192.168.0.49'; // Your computer's local IP address
  
  if (Platform.OS === 'android' && !__DEV__) {
    return 'http://10.0.2.2:5000/api'; // Android Emulator
  } else if (Platform.OS === 'ios' && !__DEV__) {
    return 'http://localhost:5000/api'; // iOS Simulator
  } else {
    // For Expo Go on physical device
    return `http://${LOCAL_IP}:5000/api`;
  }
};

const API_BASE_URL = getApiBaseUrl();

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
}

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface PatientData {
  _id: string;
  user: UserProfile;
  dateOfBirth: string;
  gender: string;
  phone?: string;
  address: string;
  facility: string;
  region: string;
  currentPregnancy: {
    isPregnant: boolean;
    gestationalAge?: number;
    currentWeek?: number;
    estimatedDueDate?: string;
    riskLevel: string;
    condition?: string;
    symptoms?: string[];
  };
  medicalHistory: string[];
  allergies: string[];
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
  }[];
  vitals: {
    bloodPressure?: {
      systolic: number;
      diastolic: number;
    };
    bloodSugar?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    bmi?: number;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  lastVisit?: string;
  nextAppointment?: string;
  ancVisits: number;
  status: string;
  assignedDoctor?: UserProfile;
  assignmentDate?: string;
  assignmentReason?: string;
  assignedBy?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface MedicalRecord {
  _id?: string;
  type: 'anc_visit' | 'vaccination' | 'doctor_note';
  date: string;
  data: any;
}

class ApiService {
  private token: string | null = null;
  private tokenExpiry: number | null = null;
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    this.loadToken();
  }

  private async loadToken() {
    try {
      // First, try to load from the new auth_token_data format (with expiry)
      const tokenData = await AsyncStorage.getItem('auth_token_data');
      if (tokenData) {
        const { token, expiry } = JSON.parse(tokenData);
        this.token = token;
        this.tokenExpiry = expiry;
        return;
      }

      // Fallback: load from the main auth service's token storage
      const mainToken = await AsyncStorage.getItem('auth_token');
      if (mainToken) {
        console.log('[ApiService] Migrating token from main auth service');
        this.token = mainToken;
        
        // Parse the JWT to get expiry if possible
        try {
          const tokenParts = mainToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            this.tokenExpiry = payload.exp * 1000; // Convert to milliseconds
            
            // Save in the new format for future use
            await AsyncStorage.setItem('auth_token_data', JSON.stringify({
              token: mainToken,
              expiry: this.tokenExpiry,
            }));
            
            console.log('[ApiService] Token migration completed');
          } else {
            // Invalid token format, set a default expiry
            this.tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
          }
        } catch (parseError) {
          console.warn('[ApiService] Could not parse token for expiry, setting default');
          this.tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        }
      }
    } catch (error) {
      console.error('Error loading token:', error);
      await this.clearToken();
    }
  }

  private async saveToken(token: string) {
    try {
      // Parse the JWT to get expiry
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const expiry = payload.exp * 1000; // Convert to milliseconds

        this.token = token;
        this.tokenExpiry = expiry;

        // Save in both formats for compatibility
        await AsyncStorage.setItem('auth_token_data', JSON.stringify({
          token,
          expiry,
        }));
        
        // Also save to main auth service storage for sync
        await AsyncStorage.setItem('auth_token', token);
      } else {
        throw new Error('Invalid token format');
      }
    } catch (error) {
      console.error('Error saving token:', error);
      await this.clearToken();
    }
  }

  private async clearToken() {
    try {
      this.token = null;
      this.tokenExpiry = null;
      // Clear both token storage locations
      await AsyncStorage.multiRemove(['auth_token_data', 'auth_token']);
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }

  private isTokenExpired(): boolean {
    if (!this.token || !this.tokenExpiry) return true;
    // Consider token expired 5 minutes before actual expiry
    return Date.now() >= (this.tokenExpiry - 5 * 60 * 1000);
  }

  private async refreshToken(): Promise<void> {
    try {
      if (this.refreshPromise) {
        return this.refreshPromise;
      }

      this.refreshPromise = (async () => {
        // Make sure we have a token to refresh
        if (!this.token) {
          // Try to load token from storage first
          await this.loadToken();
          if (!this.token) {
            throw new Error('No token to refresh');
          }
        }

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Token refresh failed');
        }

        const data = await response.json();
        if (data.success && data.data && data.data.token) {
          await this.saveToken(data.data.token);
        } else {
          throw new Error('No token in refresh response');
        }
      })();

      await this.refreshPromise;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await this.clearToken();
      throw error;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async getValidToken(): Promise<string | null> {
    if (!this.token) return null;

    try {
      if (this.isTokenExpired()) {
        await this.refreshToken();
      }
      return this.token;
    } catch (error) {
      console.error('Error getting valid token:', error);
      return null;
    }
  }

  private async getHeaders() {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    const token = await this.getValidToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private async request(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<any> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const headers = await this.getHeaders();
      
      const config = {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      };

      console.log(`API Request: ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      // Handle different response statuses
      if (response.status === 401 && retryCount === 0) {
        // Token might be expired, try to refresh and retry once
        try {
          await this.refreshToken();
          return this.request(endpoint, options, retryCount + 1);
        } catch {
          // If refresh fails, clear token and throw error
          await this.clearToken();
          throw new Error('Authentication failed. Please log in again.');
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          // Clear token on authentication errors
          await this.clearToken();
        }
        
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Error: ${endpoint}`, error);
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  // Authentication Methods
  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: UserProfile; patient?: PatientData; error?: string }> {
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (response.success && response.data && response.data.token) {
        await this.saveToken(response.data.token);
        
        // If user is a patient, fetch patient data
        if (response.data.user.role === 'patient') {
          try {
            const patientData = await this.getPatientProfile();
            return {
              success: true,
              user: response.data.user,
              patient: patientData || undefined,
            };
          } catch (patientError) {
            console.error('Failed to fetch patient data:', patientError);
            // Return user data even if patient fetch fails
            return {
              success: true,
              user: response.data.user,
            };
          }
        }

        return {
          success: true,
          user: response.data.user,
        };
      }

      return {
        success: false,
        error: response.message || 'Login failed',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  async register(userData: RegisterData): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      const response = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          ...userData,
          role: 'patient', // Mobile users are patients
        }),
      });

      if (response.success && response.data && response.data.token) {
        await this.saveToken(response.data.token);
        return {
          success: true,
          user: response.data.user,
        };
      }

      return {
        success: false,
        error: response.message || 'Registration failed',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.clearToken();
    }
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const response = await this.request('/auth/me');
      return response.success ? response.data.user : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async updateProfile(userData: Partial<UserProfile>): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    try {
      const response = await this.request('/settings/profile', {
        method: 'PUT',
        body: JSON.stringify(userData),
      });

      return {
        success: response.success,
        user: response.data?.user,
        error: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Update failed',
      };
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.request('/settings/security/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      return {
        success: response.success,
        error: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Password change failed',
      };
    }
  }

  // Settings Methods
  async getNotificationSettings(): Promise<any> {
    try {
      const response = await this.request('/settings/notifications');
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Get notification settings error:', error);
      return null;
    }
  }

  async updateNotificationSettings(settings: any): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.request('/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });

      return {
        success: response.success,
        error: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update notification settings',
      };
    }
  }

  async getSystemSettings(): Promise<any> {
    try {
      const response = await this.request('/settings/system');
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Get system settings error:', error);
      return null;
    }
  }

  async updateSystemSettings(settings: any): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.request('/settings/system', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });

      return {
        success: response.success,
        error: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update system settings',
      };
    }
  }

  async uploadProfilePhoto(photoUri: string): Promise<{ success: boolean; photoUrl?: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const response = await fetch(`${API_BASE_URL}/settings/profile/photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        body: formData,
      });

      const data = await response.json();
      return {
        success: data.success,
        photoUrl: data.data?.photoUrl,
        error: data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload photo',
      };
    }
  }

  async exportMedicalRecords(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.request('/settings/export/medical-records');
      // This would typically trigger a download or return a download URL
      return {
        success: response.success,
        error: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to export records',
      };
    }
  }

  async deleteAccount(confirmPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.request('/settings/account', {
        method: 'DELETE',
        body: JSON.stringify({
          confirmPassword,
          confirmText: 'DELETE MY ACCOUNT',
        }),
      });

      return {
        success: response.success,
        error: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete account',
      };
    }
  }

  // Patient Methods
  async getPatientProfile(): Promise<PatientData | null> {
    try {
      const response = await this.request('/patients/me/profile');
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Get patient profile error:', error);
      return null;
    }
  }

  async updatePatientProfile(patientData: Partial<PatientData>): Promise<{ success: boolean; patient?: PatientData; error?: string }> {
    try {
      const response = await this.request('/patients/me/profile', {
        method: 'PUT',
        body: JSON.stringify(patientData),
      });

      return {
        success: response.success,
        patient: response.data,
        error: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Update failed',
      };
    }
  }

  // Medical Records Methods
  async getMedicalRecords(): Promise<MedicalRecord[]> {
    try {
      const response = await this.request('/patients/medical-records');
      return response.success ? response.records : [];
    } catch (error) {
      console.error('Get medical records error:', error);
      throw error;
    }
  }

  async addMedicalRecord(record: Omit<MedicalRecord, '_id'>): Promise<{ success: boolean; record?: MedicalRecord; error?: string }> {
    try {
      const response = await this.request('/patients/medical-records', {
        method: 'POST',
        body: JSON.stringify(record),
      });

      return {
        success: response.success,
        record: response.record,
        error: response.message,
      };
    } catch (error: any) {
      console.error('Error adding medical record:', error);
      return {
        success: false,
        error: error.message || 'Failed to add medical record',
      };
    }
  }

  async updateMedicalRecord(recordId: string, record: Partial<MedicalRecord>): Promise<{ success: boolean; record?: MedicalRecord; error?: string }> {
    try {
      const response = await this.request(`/patients/medical-records/${recordId}`, {
        method: 'PUT',
        body: JSON.stringify(record),
      });

      return {
        success: response.success,
        record: response.record,
        error: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update record',
      };
    }
  }

  async deleteMedicalRecord(recordId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.request(`/patients/medical-records/${recordId}`, {
        method: 'DELETE',
      });

      return {
        success: response.success,
        error: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete record',
      };
    }
  }

  // Appointments Methods
  async getAppointments(): Promise<any[]> {
    try {
      const response = await this.request('/appointments/my-appointments');
      return response.success ? response.appointments : [];
    } catch (error) {
      console.error('Get appointments error:', error);
      return [];
    }
  }

  async bookAppointment(appointmentData: any): Promise<{ success: boolean; appointment?: any; error?: string }> {
    try {
      const response = await this.request('/appointments', {
        method: 'POST',
        body: JSON.stringify(appointmentData),
      });

      return {
        success: response.success,
        appointment: response.appointment,
        error: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to book appointment',
      };
    }
  }

  // Utility Methods
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  // Public method to refresh token
  async refreshTokenAsync(): Promise<boolean> {
    try {
      await this.refreshToken();
      return true;
    } catch (error) {
      console.error('Public refresh token failed:', error);
      return false;
    }
  }
}

export default new ApiService();
export type { LoginCredentials, RegisterData, UserProfile, PatientData, MedicalRecord };
