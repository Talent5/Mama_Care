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
  if (!authUser) return null;

  return {
    _id: authUser.id,
    firstName: authUser.firstName,
    lastName: authUser.lastName,
    email: authUser.email,
    phone: authUser.phone,
    role: authUser.role,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
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
