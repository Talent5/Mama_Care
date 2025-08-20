import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import ApiService, { PatientData, MedicalRecord } from '../services/apiService';

export interface UserCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface StoredUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  patient?: PatientData;
}

// Simple hash function for PIN (in production, use proper hashing)
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

export const DatabaseAuthStorage = {
  // Check if user has completed onboarding
  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem('onboarding_completed');
      return completed === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  },

  // Mark onboarding as completed
  async setOnboardingCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
    } catch (error) {
      console.error('Error setting onboarding completed:', error);
    }
  },

  // Register a new user with the database
  async registerUser(credentials: RegisterData): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await ApiService.register(credentials);
      
      if (result.success && result.user) {
        // Mark onboarding as completed for database users
        await this.setOnboardingCompleted();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('Error registering user:', error);
      return { success: false, error: error.message || 'Registration failed' };
    }
  },

  // Login user with database authentication
  async loginUser(email: string, password: string): Promise<{ success: boolean; error?: string; user?: StoredUser }> {
    try {
      const result = await ApiService.login({ email, password });
      
      if (result.success && result.user) {
        const storedUser: StoredUser = {
          _id: result.user._id,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          email: result.user.email,
          phone: result.user.phone,
          role: result.user.role,
          isActive: result.user.isActive,
          createdAt: result.user.createdAt,
          patient: result.patient,
        };

        // Cache user data locally for offline access
        await AsyncStorage.setItem('cached_user', JSON.stringify(storedUser));
        
        return { success: true, user: storedUser };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('Error logging in:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  },

  // Get current user from database (with fallback to cache only when offline)
  async getCurrentUser(): Promise<StoredUser | null> {
    try {
      // Check if we have a valid token
      if (!await ApiService.isAuthenticated()) {
        // If not authenticated, clear cached data and return null
        await AsyncStorage.removeItem('cached_user');
        return null;
      }

      // Try to get fresh user data from API
      const user = await ApiService.getCurrentUser();
      if (!user) {
        // If API returns no user, clear cached data and return null
        await AsyncStorage.removeItem('cached_user');
        return null;
      }

      const storedUser: StoredUser = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      };

      // If user is a patient, get patient data
      if (user.role === 'patient') {
        const patientData = await ApiService.getPatientProfile();
        if (patientData) {
          storedUser.patient = patientData;
        }
      }

      // Update cache with fresh data
      await AsyncStorage.setItem('cached_user', JSON.stringify(storedUser));
      return storedUser;

    } catch (error) {
      console.error('Error getting current user:', error);
      
      // Only use cached data if it's a network error (offline scenario)
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        try {
          const cachedUser = await AsyncStorage.getItem('cached_user');
          if (cachedUser) {
            console.log('Using cached user data due to network error');
            return JSON.parse(cachedUser);
          }
        } catch (cacheError) {
          console.error('Error getting cached user:', cacheError);
        }
      }
      
      // For other errors, clear cache and return null
      await AsyncStorage.removeItem('cached_user');
      return null;
    }
  },

  // Update user profile in database
  async updateUserProfile(userData: Partial<StoredUser>): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await ApiService.updateProfile(userData);
      
      if (result.success && result.user) {
        // Update cache
        const currentUser = await this.getCurrentUser();
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          await AsyncStorage.setItem('cached_user', JSON.stringify(updatedUser));
        }
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message || 'Update failed' };
    }
  },

  // Check if user is logged in
  async isLoggedIn(): Promise<boolean> {
    try {
      return ApiService.isAuthenticated();
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await ApiService.logout();
      await AsyncStorage.removeItem('cached_user');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  },

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await ApiService.logout();
      await AsyncStorage.multiRemove([
        'onboarding_completed',
        'cached_user',
        'userLanguage',
        'cached_medical_records'
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  },

  // PIN Management (kept local for security)
  async hasPIN(): Promise<boolean> {
    try {
      const pin = await SecureStore.getItemAsync('user_pin');
      return pin !== null;
    } catch (error) {
      console.error('Error checking PIN:', error);
      return false;
    }
  },

  async setPIN(pin: string): Promise<void> {
    try {
      const hashedPIN = simpleHash(pin);
      await SecureStore.setItemAsync('user_pin', hashedPIN);
    } catch (error) {
      console.error('Error setting PIN:', error);
      throw new Error('Failed to set PIN');
    }
  },

  async verifyPIN(pin: string): Promise<boolean> {
    try {
      const storedHashedPIN = await SecureStore.getItemAsync('user_pin');
      if (!storedHashedPIN) return false;
      
      const hashedInput = simpleHash(pin);
      return hashedInput === storedHashedPIN;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  },

  async changePIN(oldPin: string, newPin: string): Promise<{ success: boolean; error?: string }> {
    try {
      const isValidOldPin = await this.verifyPIN(oldPin);
      if (!isValidOldPin) {
        return { success: false, error: 'Current PIN is incorrect' };
      }

      await this.setPIN(newPin);
      return { success: true };
    } catch (error: any) {
      console.error('Error changing PIN:', error);
      return { success: false, error: error.message || 'Failed to change PIN' };
    }
  },

  async resetPIN(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('user_pin');
    } catch (error) {
      console.error('Error resetting PIN:', error);
    }
  },

  // Medical Records Management (with database sync)
  async getMedicalRecords(): Promise<MedicalRecord[]> {
    try {
      // Try to get fresh data from API
      const records = await ApiService.getMedicalRecords();
      
      // Cache the records
      await AsyncStorage.setItem('cached_medical_records', JSON.stringify(records));
      
      return records;
    } catch (error) {
      console.error('Error getting medical records from API:', error);
      
      // Fallback to cached data
      try {
        const cachedRecords = await AsyncStorage.getItem('cached_medical_records');
        return cachedRecords ? JSON.parse(cachedRecords) : [];
      } catch (cacheError) {
        console.error('Error getting cached medical records:', cacheError);
        return [];
      }
    }
  },

  async addMedicalRecord(record: Omit<MedicalRecord, '_id'>): Promise<void> {
    try {
      const result = await ApiService.addMedicalRecord(record);
      
      if (result.success) {
        // Update local cache
        const records = await this.getMedicalRecords();
        if (result.record) {
          records.push(result.record);
          await AsyncStorage.setItem('cached_medical_records', JSON.stringify(records));
        }
      } else {
        throw new Error(result.error || 'Failed to add medical record');
      }
    } catch (error) {
      console.error('Error adding medical record:', error);
      throw new Error('Failed to add medical record');
    }
  },

  async updateMedicalRecord(recordId: string, record: Partial<MedicalRecord>): Promise<void> {
    try {
      const result = await ApiService.updateMedicalRecord(recordId, record);
      
      if (result.success) {
        // Update local cache
        const records = await this.getMedicalRecords();
        const index = records.findIndex(r => r._id === recordId);
        if (index !== -1 && result.record) {
          records[index] = result.record;
          await AsyncStorage.setItem('cached_medical_records', JSON.stringify(records));
        }
      } else {
        throw new Error(result.error || 'Failed to update medical record');
      }
    } catch (error) {
      console.error('Error updating medical record:', error);
      throw new Error('Failed to update medical record');
    }
  },

  async deleteMedicalRecord(recordId: string): Promise<void> {
    try {
      const result = await ApiService.deleteMedicalRecord(recordId);
      
      if (result.success) {
        // Update local cache
        const records = await this.getMedicalRecords();
        const filteredRecords = records.filter(r => r._id !== recordId);
        await AsyncStorage.setItem('cached_medical_records', JSON.stringify(filteredRecords));
      } else {
        throw new Error(result.error || 'Failed to delete medical record');
      }
    } catch (error) {
      console.error('Error deleting medical record:', error);
      throw new Error('Failed to delete medical record');
    }
  },

  // Patient Profile Management
  async getPatientProfile(): Promise<PatientData | null> {
    try {
      return await ApiService.getPatientProfile();
    } catch (error) {
      console.error('Error getting patient profile:', error);
      return null;
    }
  },

  async updatePatientProfile(patientData: Partial<PatientData>): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await ApiService.updatePatientProfile(patientData);
      return {
        success: result.success,
        error: result.error,
      };
    } catch (error: any) {
      console.error('Error updating patient profile:', error);
      return { success: false, error: error.message || 'Update failed' };
    }
  },

  // Appointments
  async getAppointments(): Promise<any[]> {
    try {
      return await ApiService.getAppointments();
    } catch (error) {
      console.error('Error getting appointments:', error);
      return [];
    }
  },

  async bookAppointment(appointmentData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await ApiService.bookAppointment(appointmentData);
      return {
        success: result.success,
        error: result.error,
      };
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      return { success: false, error: error.message || 'Booking failed' };
    }
  },

  // Utility methods
  async testDatabaseConnection(): Promise<boolean> {
    try {
      return await ApiService.testConnection();
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  },

  async syncData(): Promise<{ success: boolean; error?: string }> {
    try {
      // Refresh all cached data from the database
      await this.getCurrentUser();
      await this.getMedicalRecords();
      
      return { success: true };
    } catch (error: any) {
      console.error('Error syncing data:', error);
      return { success: false, error: error.message || 'Sync failed' };
    }
  },
};

export { DatabaseAuthStorage as AuthStorage };
export type { MedicalRecord };
