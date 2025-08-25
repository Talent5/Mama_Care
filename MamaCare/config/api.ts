import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Forward declaration to avoid circular dependency
let authService: any = null;

// Function to set auth service reference
export const setAuthServiceReference = (service: any) => {
  authService = service;
};

// Derive local network IP from Expo or debugger host
const detectDevHostIp = (): string | null => {
  try {
    const hostUri =
      (Constants as any)?.expoConfig?.hostUri ||
      (Constants as any)?.manifest?.hostUri ||
      (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
      (Constants as any)?.manifest?.debuggerHost; // e.g. 192.168.1.23:19000
    if (!hostUri || typeof hostUri !== 'string') return null;
    const hostPart = hostUri.split(':')[0];
    // Basic IPv4 check
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostPart)) return hostPart;
    return null;
  } catch {
    return null;
  }
};

// API Configuration with dynamic detection + env override
const getApiBaseUrl = () => {
  // Allow build/runtime override via Expo public env (EXPO_PUBLIC_ prefix is preserved in client bundle)
  const envUrl = (globalThis as any)?.process?.env?.EXPO_PUBLIC_API_BASE_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/?$/, '');

  if (!__DEV__) {
    return 'https://mama-care-g7y1.onrender.com/api';
  }

  const detectedIp = detectDevHostIp();
  if (detectedIp && detectedIp !== '127.0.0.1') {
    return `http://${detectedIp}:5000/api`;
  }
  // If Android emulator and no LAN IP, use special alias 10.0.2.2
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
};

const PRIMARY_BASE_URL = getApiBaseUrl();
const detectedIpForFallback = PRIMARY_BASE_URL.match(/http:\/\/(\d+\.\d+\.\d+\.\d+)/)?.[1];

export const API_CONFIG = {
  BASE_URL: PRIMARY_BASE_URL,
  TIMEOUT: 30000, // Increased from 15 seconds to 30 seconds
  RETRY_ATTEMPTS: 3,
  // Build fallbacks dynamically so changing networks only requires restart, not code edit
  FALLBACK_URLS: __DEV__
    ? Array.from(new Set([
        // Preferred: detected LAN IP
        detectedIpForFallback ? `http://${detectedIpForFallback}:5000/api` : undefined,
        // Android emulator mapping to host
        'http://10.0.2.2:5000/api',
        // Loopback variants
        'http://127.0.0.1:5000/api',
        'http://localhost:5000/api'
      ].filter(Boolean) as string[]))
    : [],
};

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: {
    field?: string;
    message: string;
  }[];
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  fullName: string;
  avatar?: string;
  phone?: string;
  emailVerified?: boolean;
  lastLogin?: string;
}

export interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalHistory?: string[];
  allergies?: string[];
  medications?: string[];
  bloodType?: string;
  healthcareProvider?: string;
  pregnancyInfo?: {
    isPregnant: boolean;
    dueDate?: string;
    currentWeek?: number;
    highRisk?: boolean;
    complications?: string[];
  };
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  _id: string;
  patient: string | Patient;
  provider: string | User;
  date: string;
  time: string;
  type: 'anc_visit' | 'consultation' | 'emergency' | 'follow_up' | 'vaccination';
  status: 'pending' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rejected';
  notes?: string;
  symptoms?: string[];
  diagnosis?: string;
  treatment?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  duration?: number;
  location?: string;
  // Approval workflow fields
  approvedBy?: string | User;
  approvedAt?: string;
  rejectionReason?: string;
  proposedDateTime?: {
    date?: string;
    time?: string;
  };
  doctorNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// HTTP Client Class
class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // Allow runtime override if network changes without a full reload
  setBaseUrl(newUrl: string) {
    if (!newUrl) return;
    console.log(`[ApiClient] Base URL updated from ${this.baseURL} -> ${newUrl}`);
    this.baseURL = newUrl.replace(/\/?$/, '');
  }

  // Test connection to the API
  async testConnection(): Promise<boolean> {
    try {
      console.log(`🔍 [ApiClient] Testing connection to: ${this.baseURL}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second test timeout
      
  // Health endpoint is exposed at /api/health relative to baseURL
  const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ [ApiClient] Connection test successful');
        return true;
      } else {
        console.log(`❌ [ApiClient] Connection test failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log('💥 [ApiClient] Connection test error:', error);
      return false;
    }
  }

  // Try different URLs if the main one fails
  async findWorkingUrl(): Promise<string | null> {
    const urlsToTry = [this.baseURL, ...API_CONFIG.FALLBACK_URLS];
    
    for (const url of urlsToTry) {
      try {
        console.log(`🧪 [ApiClient] Trying URL: ${url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
  // Probe /api/health on each candidate base URL
  const response = await fetch(`${url}/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`✅ [ApiClient] Found working URL: ${url}`);
          this.baseURL = url; // Update base URL to working one
          return url;
        }
      } catch (error) {
        console.log(`❌ [ApiClient] URL ${url} failed:`, error);
      }
    }
    
    console.log('💥 [ApiClient] No working URL found');
    return null;
  }

  // Expose base URL for testing
  getBaseUrl(): string {
    return this.baseURL;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    let url = `${this.baseURL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    console.log(`🔄 [API] Making ${options.method || 'GET'} request to: ${url}`);

    // First attempt with current URL
    try {
      return await this.attemptRequest<T>(url, options, headers);
    } catch (error) {
      console.log(`🔄 [API] Primary URL failed, trying fallback URLs...`);
      
      // Try to find a working URL
      const workingUrl = await this.findWorkingUrl();
      if (workingUrl) {
        url = `${workingUrl}${endpoint}`;
        console.log(`🔄 [API] Retrying with working URL: ${url}`);
        return await this.attemptRequest<T>(url, options, headers);
      }
      
      // If no working URL found, throw the original error
      throw error;
    }
  }

  private async attemptRequest<T>(
    url: string,
    options: RequestInit,
    headers: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`⏰ [API] Request timeout after ${this.timeout}ms for: ${url}`);
        controller.abort();
      }, this.timeout);

      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`📡 [API] Response received: ${response.status} ${response.statusText}`);

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      // Check for authentication errors - but differentiate between login failures and token issues
      if (response.status === 401 || response.status === 403) {
        console.log('[ApiClient] Authentication error detected:', response.status);
        
        // Don't trigger auth failure for login/register endpoints - these are expected to fail with invalid credentials
        const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
        
        if (!isAuthEndpoint && authService && authService.handleAuthenticationFailure) {
          // Only trigger auth failure handling for authenticated endpoints with invalid tokens
          console.log('[ApiClient] Invalid token detected, clearing auth and redirecting to onboarding');
          await authService.handleAuthenticationFailure();
        } else if (isAuthEndpoint) {
          console.log('[ApiClient] Login/register failed with invalid credentials - this is normal');
        }
        
        throw new Error(`Authentication failed (${response.status}): ${data.message || 'Unauthorized'}`);
      }

      if (!response.ok) {
        console.log(`❌ [API] Request failed: ${response.status} - ${data.message || 'Unknown error'}`);
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      console.log(`✅ [API] Request successful:`, data.success ? 'Success' : 'Failed');
      return data;
    } catch (error) {
      console.error(`💥 [API] Request failed for ${url}:`, error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          const timeoutError = new Error(`Request timeout after ${this.timeout / 1000} seconds. Please check your internet connection and server status.`);
          throw timeoutError;
        }
        
        // Check for authentication-related errors in the error message, but only for non-auth endpoints
        const errorMessage = error.message.toLowerCase();
        const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
        
        if (!isAuthEndpoint && 
            (errorMessage.includes('401') || 
             errorMessage.includes('403') || 
             errorMessage.includes('unauthorized') || 
             errorMessage.includes('authentication failed')) &&
            authService && authService.handleAuthenticationFailure) {
          console.log('[ApiClient] Authentication error in error message for non-auth endpoint');
          await authService.handleAuthenticationFailure();
        }
        
        throw error;
      }
      
      throw new Error('Network request failed - please check your connection');
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Upload file with form data
  async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const token = await AsyncStorage.getItem('auth_token');
    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers,
    });
  }
}

export const apiClient = new ApiClient();
