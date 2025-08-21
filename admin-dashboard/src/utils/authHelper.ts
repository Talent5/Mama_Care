// Authentication helper functions for MamaCare Admin Dashboard

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const loginAsSystemAdmin = async (): Promise<AuthResponse | null> => {
  try {
    const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@mamacare.zw',
        password: 'Admin123!'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Store the token
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    console.log('✅ Successfully logged in as system admin');
    console.log('User:', data.user);
    
    return data;
  } catch (error) {
    console.error('❌ Failed to login as system admin:', error);
    return null;
  }
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  console.log('Logged out successfully');
};

export const checkAuthStatus = () => {
  const token = getAuthToken();
  const user = getCurrentUser();
  
  console.log('Auth Status:');
  console.log('Token:', token ? 'Present' : 'Missing');
  console.log('User:', user);
  
  return { token, user };
};
