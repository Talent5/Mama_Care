import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export interface UserCredentials {
  fullName: string;
  phoneNumber: string;
  password: string;
}

export interface StoredUser {
  fullName: string;
  phoneNumber: string;
  hashedPassword: string;
  createdAt: string;
  hasPIN?: boolean;
}

export interface MedicalRecord {
  id: string;
  type: 'anc_visit' | 'vaccination' | 'doctor_note';
  date: string;
  data: any;
}

// Simple hash function for demo purposes (in production, use proper hashing)
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

export const AuthStorage = {
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

  // Register a new user
  async registerUser(credentials: UserCredentials): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user already exists
      const existingUsers = await this.getAllUsers();
      const userExists = existingUsers.some(user => user.phoneNumber === credentials.phoneNumber);
      
      if (userExists) {
        return { success: false, error: 'Phone number already registered' };
      }

      // Create new user
      const newUser: StoredUser = {
        fullName: credentials.fullName,
        phoneNumber: credentials.phoneNumber,
        hashedPassword: simpleHash(credentials.password),
        createdAt: new Date().toISOString(),
      };

      // Add to users list
      const updatedUsers = [...existingUsers, newUser];
      await AsyncStorage.setItem('registered_users', JSON.stringify(updatedUsers));

      // Set as current user
      await this.setCurrentUser(newUser);

      return { success: true };
    } catch (error) {
      console.error('Error registering user:', error);
      return { success: false, error: 'Registration failed' };
    }
  },

  // Login user
  async loginUser(phoneNumber: string, password: string): Promise<{ success: boolean; error?: string; user?: StoredUser }> {
    try {
      const users = await this.getAllUsers();
      const hashedPassword = simpleHash(password);
      
      const user = users.find(u => 
        u.phoneNumber === phoneNumber && u.hashedPassword === hashedPassword
      );

      if (user) {
        await this.setCurrentUser(user);
        return { success: true, user };
      } else {
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Error logging in:', error);
      return { success: false, error: 'Login failed' };
    }
  },

  // Get all registered users
  async getAllUsers(): Promise<StoredUser[]> {
    try {
      const usersJson = await AsyncStorage.getItem('registered_users');
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  },

  // Set current user
  async setCurrentUser(user: StoredUser): Promise<void> {
    try {
      await AsyncStorage.setItem('current_user', JSON.stringify(user));
    } catch (error) {
      console.error('Error setting current user:', error);
    }
  },

  // Get current user
  async getCurrentUser(): Promise<StoredUser | null> {
    try {
      const userJson = await AsyncStorage.getItem('current_user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Check if user is logged in
  async isLoggedIn(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem('current_user');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  },

  // Clear all data (for development/testing)
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        'onboarding_completed',
        'registered_users',
        'current_user',
        'userLanguage'
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  },

  // PIN Management
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
      
      // Update current user to reflect PIN is set
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        currentUser.hasPIN = true;
        await this.setCurrentUser(currentUser);
      }
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

  // Medical Records Management
  async getMedicalRecords(): Promise<MedicalRecord[]> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) return [];
      
      const recordsKey = `medical_records_${currentUser.phoneNumber}`;
      const recordsJson = await AsyncStorage.getItem(recordsKey);
      return recordsJson ? JSON.parse(recordsJson) : [];
    } catch (error) {
      console.error('Error getting medical records:', error);
      return [];
    }
  },

  async addMedicalRecord(record: Omit<MedicalRecord, 'id'>): Promise<void> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) throw new Error('No current user');
      
      const recordsKey = `medical_records_${currentUser.phoneNumber}`;
      const records = await this.getMedicalRecords();
      
      const newRecord: MedicalRecord = {
        ...record,
        id: Date.now().toString(),
      };
      
      records.push(newRecord);
      await AsyncStorage.setItem(recordsKey, JSON.stringify(records));
    } catch (error) {
      console.error('Error adding medical record:', error);
      throw new Error('Failed to add medical record');
    }
  }
};
