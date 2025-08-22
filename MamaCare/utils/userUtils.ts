import { authService } from '../services';
import { StoredUser } from './databaseAuthStorage';

export interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  fullName: string;
  avatar: string;
}

/**
 * Get current user data in a consistent format across the app
 */
export const getCurrentUserData = (): UserData | null => {
  try {
    const authUser = authService.getUser();
    
    if (!authUser) {
      return null;
    }

    return {
      id: authUser.id,
      firstName: authUser.firstName,
      lastName: authUser.lastName,
      email: authUser.email,
      phone: authUser.phone,
      role: authUser.role,
      fullName: `${authUser.firstName} ${authUser.lastName}`,
      avatar: `https://ui-avatars.com/api/?name=${authUser.firstName}+${authUser.lastName}&background=4ea674&color=fff`,
    };
  } catch (error) {
    console.error('Error getting current user data:', error);
    return null;
  }
};

/**
 * Convert authService user to StoredUser format
 */
export const convertToStoredUser = (authUser: any): StoredUser | null => {
  if (!authUser) {
    console.log('convertToStoredUser: authUser is null or undefined');
    return null;
  }

  console.log('Converting authUser to StoredUser:', authUser);

  try {
    return {
      _id: authUser.id || authUser._id || 'unknown',
      firstName: authUser.firstName || '',
      lastName: authUser.lastName || '',
      email: authUser.email || '',
      phone: authUser.phone || '',
      role: authUser.role || 'patient',
      isActive: authUser.isActive !== undefined ? authUser.isActive : true,
      createdAt: authUser.createdAt || authUser.created || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error converting authUser to StoredUser:', error);
    return null;
  }
};

/**
 * Check if user is authenticated (simple check)
 */
export const isUserAuthenticated = (): boolean => {
  return authService.isAuthenticated();
};

/**
 * Get user display name
 */
export const getUserDisplayName = (): string => {
  const userData = getCurrentUserData();
  if (!userData) return 'User';
  return userData.fullName || userData.firstName || 'User';
};
