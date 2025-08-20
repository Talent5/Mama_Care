import React, { createContext, useEffect, useState, useCallback, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatar?: string;
  phone?: string;
  facility?: string;
  region?: string;
  department?: string;
  specialization?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('userData');

      if (storedToken && storedUser) {
        // Validate token with backend using /auth/me endpoint
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const userData = data.data.user;
          
          // Transform user data to match expected format
          const transformedUser = {
            id: userData.id || userData._id,
            email: userData.email,
            name: userData.name || userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            role: userData.role,
            permissions: userData.permissions || [],
            firstName: userData.firstName,
            lastName: userData.lastName,
            fullName: userData.fullName,
            avatar: userData.avatar,
            phone: userData.phone,
            facility: userData.facility,
            region: userData.region,
            department: userData.department,
            specialization: userData.specialization
          };
          
          // Only update state if data has actually changed
          const currentUser = localStorage.getItem('userData');
          const userString = JSON.stringify(transformedUser);
          
          setToken(storedToken);
          
          // Only set user if data has changed to prevent unnecessary re-renders
          if (currentUser !== userString) {
            setUser(transformedUser);
            localStorage.setItem('userData', userString);
          } else if (!user) {
            // Set user if it's not set yet (initial load)
            setUser(transformedUser);
          }
        } else {
          // Token is invalid, clear stored data
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          setToken(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid stored data on error
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Provide more specific error messages
        if (response.status === 401) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        } else if (response.status === 400) {
          throw new Error(data.message || 'Please check your input and try again.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(data.message || 'Login failed');
        }
      }

      const { user: userData, token: authToken } = data.data || data;
      
      // Transform user data to match expected format
      const transformedUser = {
        id: userData.id || userData._id,
        email: userData.email,
        name: userData.name || userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        role: userData.role,
        permissions: userData.permissions || [],
        firstName: userData.firstName,
        lastName: userData.lastName,
        fullName: userData.fullName,
        avatar: userData.avatar,
        phone: userData.phone,
        facility: userData.facility,
        region: userData.region,
        department: userData.department,
        specialization: userData.specialization
      };
      
      // Store auth data
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('userData', JSON.stringify(transformedUser));
      
      setToken(authToken);
      setUser(transformedUser);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear stored data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Reset state
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
