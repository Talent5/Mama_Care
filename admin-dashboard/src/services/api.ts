import axios from 'axios';
import type {
  ApiResponse,
  PaginatedResponse,
  Patient,
  CreatePatientRequest,
  UpdatePatientRequest,
  PatientFilters,
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  AppointmentFilters,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateProfileRequest,
  UserFilters,
  DashboardStats,
  PatientStats,
  AppointmentStats,
  HealthMetrics,
  AnalyticsFilters,
  ExportFilters
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`,
  timeout: 30000, // Increased from 10 seconds to 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access - token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      // Redirect to login page
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (userData: CreateUserRequest): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  updateProfile: async (userData: UpdateProfileRequest): Promise<ApiResponse<User>> => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },
  
  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },
};

// Patients API
export const patientsAPI = {
  getPatients: async (filters?: PatientFilters): Promise<PaginatedResponse<Patient>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/patients?${params}`);
    return response.data;
  },
  
  getPatient: async (id: string): Promise<ApiResponse<Patient>> => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },
  
  createPatient: async (patientData: CreatePatientRequest): Promise<ApiResponse<Patient>> => {
    const response = await api.post('/patients', patientData);
    return response.data;
  },
  
  updatePatient: async (id: string, patientData: UpdatePatientRequest): Promise<ApiResponse<Patient>> => {
    const response = await api.put(`/patients/${id}`, patientData);
    return response.data;
  },
  
  deletePatient: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  },
  
  getPatientHistory: async (id: string): Promise<ApiResponse<unknown[]>> => {
    const response = await api.get(`/patients/${id}/history`);
    return response.data;
  },
  
  addPatientNote: async (id: string, note: string): Promise<ApiResponse<void>> => {
    const response = await api.post(`/patients/${id}/notes`, { note });
    return response.data;
  },
};

// Appointments API
export const appointmentsAPI = {
  getAppointments: async (filters?: AppointmentFilters): Promise<PaginatedResponse<Appointment>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/appointments?${params}`);
    return response.data;
  },
  
  getAppointment: async (id: string): Promise<ApiResponse<Appointment>> => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },
  
  createAppointment: async (appointmentData: CreateAppointmentRequest): Promise<ApiResponse<Appointment>> => {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },
  
  updateAppointment: async (id: string, appointmentData: UpdateAppointmentRequest): Promise<ApiResponse<Appointment>> => {
    const response = await api.put(`/appointments/${id}`, appointmentData);
    return response.data;
  },
  
  deleteAppointment: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  },
  
  confirmAppointment: async (id: string): Promise<ApiResponse<Appointment>> => {
    const response = await api.patch(`/appointments/${id}/confirm`);
    return response.data;
  },
  
  cancelAppointment: async (id: string, reason?: string): Promise<ApiResponse<Appointment>> => {
    const response = await api.patch(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },
  
  completeAppointment: async (id: string, notes?: string): Promise<ApiResponse<Appointment>> => {
    const response = await api.patch(`/appointments/${id}/complete`, { notes });
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getDashboardStats: async (period?: string): Promise<ApiResponse<DashboardStats>> => {
    const params = period ? `?period=${period}` : '';
    const response = await api.get(`/analytics/dashboard${params}`);
    return response.data;
  },
  
  getPatientStats: async (filters?: AnalyticsFilters): Promise<ApiResponse<PatientStats>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/analytics/patients?${params}`);
    return response.data;
  },
  
  getAppointmentStats: async (filters?: AnalyticsFilters): Promise<ApiResponse<AppointmentStats>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/analytics/appointments?${params}`);
    return response.data;
  },
  
  getHealthMetrics: async (filters?: AnalyticsFilters): Promise<ApiResponse<HealthMetrics>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/analytics/health-metrics?${params}`);
    return response.data;
  },
  
  exportReport: async (type: string, filters?: ExportFilters): Promise<Blob> => {
    const response = await api.post(`/analytics/export/${type}`, filters, {
      responseType: 'blob'
    });
    return response.data;
  },
};

// Users API (Admin only)
export const usersAPI = {
  getUsers: async (filters?: UserFilters): Promise<PaginatedResponse<User>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/users?${params}`);
    return response.data;
  },
  
  getUser: async (id: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  createUser: async (userData: CreateUserRequest): Promise<ApiResponse<User>> => {
    console.log('🚀 Sending user creation request to backend:', userData);
    console.log('🌐 API Base URL:', api.defaults.baseURL);
    try {
      const response = await api.post('/users', userData);

      return response.data;
    } catch (error) {
      console.error('❌ User creation error:', error);
      throw error;
    }
  },
  
  updateUser: async (id: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  
  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
  
  deactivateUser: async (id: string): Promise<ApiResponse<User>> => {
    const response = await api.patch(`/users/${id}/deactivate`);
    return response.data;
  },
  
  activateUser: async (id: string): Promise<ApiResponse<User>> => {
    const response = await api.patch(`/users/${id}/activate`);
    return response.data;
  },
};

// User Management API (System Admin only)
export const userManagementAPI = {
  // Get all users
  getAllUsers: async (filters?: UserFilters): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await api.get(`/users?${params.toString()}`);
    return response.data;
  },

  // Create new user
  createUser: async (userData: CreateUserRequest): Promise<ApiResponse<User>> => {
    console.log('🚀 Creating user with data:', userData);
    const response = await api.post('/users', userData);

    return response.data;
  },

  // Update user
  updateUser: async (userId: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  // Toggle user status (activate/deactivate)
  toggleUserStatus: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await api.patch(`/users/${userId}/status`);
    return response.data;
  },

  // Get user details
  getUserDetails: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Get user statistics
  getUserStats: async (): Promise<ApiResponse<{
    totalUsers: number;
    usersByRole: Record<string, number>;
    recentRegistrations: number;
  }>> => {
    const response = await api.get('/users/stats/overview');
    return response.data;
  }
};

// Admin API (System Admin only)
export const adminAPI = {
  // Get all users with enhanced admin data
  getAllUsers: async (filters?: UserFilters): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await api.get(`/admin/users?${params.toString()}`);
    return response.data;
  },

  // Create new user (Admin interface)
  createUser: async (userData: CreateUserRequest): Promise<ApiResponse<User>> => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  // Update user (Admin interface)
  updateUser: async (userId: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  // Delete user (Admin interface)
  deleteUser: async (userId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Toggle user status (activate/deactivate)
  toggleUserStatus: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await api.patch(`/admin/users/${userId}/toggle-status`);
    return response.data;
  },

  // Get user details (Admin view)
  getUserDetails: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  // Get dashboard stats
  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  // System management endpoints
  getSystemHealth: async () => {
    const response = await api.get('/admin/system/status');
    return response.data;
  },

  // Security management
  getSecurityLogs: async (filters?: any) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/admin/security/logs?${params.toString()}`);
    return response.data;
  },

  // Get security events
  getSecurityEvents: async (filters?: {
    page?: string;
    limit?: string;
    type?: string;
    riskLevel?: string;
    resolved?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/admin/security/events?${params.toString()}`);
    return response.data;
  },

  // Get security metrics
  getSecurityMetrics: async () => {
    const response = await api.get('/admin/security/metrics');
    return response.data;
  },

  // Log security event
  logSecurityEvent: async (eventData: {
    type: string;
    userEmail: string;
    ipAddress: string;
    details: string;
    riskLevel: string;
    userName?: string;
    location?: string;
    metadata?: any;
  }) => {
    const response = await api.post('/admin/security/events', eventData);
    return response.data;
  },

  // Resolve security event
  resolveSecurityEvent: async (eventId: string, notes?: string) => {
    const response = await api.patch(`/admin/security/events/${eventId}/resolve`, { notes });
    return response.data;
  },

  // Get security settings
  getSecuritySettings: async () => {
    const response = await api.get('/admin/security/settings');
    return response.data;
  },

  // Update security settings
  updateSecuritySettings: async (settings: any) => {
    const response = await api.put('/admin/security/settings', settings);
    return response.data;
  },

  // Trigger security scan
  triggerSecurityScan: async () => {
    const response = await api.post('/admin/security/scan');
    return response.data;
  },

  // Generate security report
  generateSecurityReport: async (filters?: {
    startDate?: string;
    endDate?: string;
    format?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/admin/security/report?${params.toString()}`);
    return response.data;
  }
};

// Alerts API
export const alertsAPI = {
  // Get all alerts with filtering and pagination
  getAlerts: async (filters?: {
    page?: string;
    limit?: string;
    type?: string;
    severity?: string;
    resolved?: string;
    patientName?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/alerts?${params.toString()}`);
    return response.data;
  },

  // Get alert statistics
  getAlertStats: async () => {
    const response = await api.get('/alerts/stats');
    return response.data;
  },

  // Create a new alert
  createAlert: async (alertData: {
    type: 'high_risk' | 'missed_appointment' | 'overdue_visit' | 'emergency';
    severity: 'critical' | 'warning' | 'info';
    message: string;
    patientId: string;
    patientName: string;
    metadata?: Record<string, unknown>;
  }) => {
    const response = await api.post('/alerts', alertData);
    return response.data;
  },

  // Resolve an alert
  resolveAlert: async (alertId: string, notes?: string) => {
    const response = await api.patch(`/alerts/${alertId}/resolve`, { notes });
    return response.data;
  },

  // Delete an alert (admin only)
  deleteAlert: async (alertId: string) => {
    const response = await api.delete(`/alerts/${alertId}`);
    return response.data;
  },

  // Get alerts for a specific patient
  getPatientAlerts: async (patientId: string, resolved?: boolean) => {
    const params = new URLSearchParams();
    if (resolved !== undefined) {
      params.append('resolved', resolved.toString());
    }
    const response = await api.get(`/alerts/patient/${patientId}?${params.toString()}`);
    return response.data;
  }
};

// Patient Assignment API
export const patientAssignmentAPI = {
  // Get patients assigned to the current healthcare provider (for doctors)
  getMyPatients: async (filters?: {
    page?: string;
    limit?: string;
    search?: string;
    riskLevel?: string;
    isActive?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/patients/assignment/my-patients?${params.toString()}`);
    return response.data;
  },

  // Get all app users (for system admin)
  getAllAppUsers: async (filters?: {
    page?: string;
    limit?: string;
    search?: string;
    hasPatientProfile?: string;
    isActive?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const response = await api.get(`/patients/assignment/all-app-users?${params.toString()}`);
    return response.data;
  },

  // Assign doctor to patient
  assignDoctor: async (patientId: string, doctorId: string, reason?: string) => {
    const response = await api.post(`/patients/assignment/${patientId}/assign-doctor`, {
      doctorId,
      reason
    });
    return response.data;
  },

  // Auto-assign doctor to patient
  autoAssignDoctor: async (patientId: string, region?: string, specialization?: string) => {
    const response = await api.post('/patients/assignment/auto-assign-doctor', {
      patientId,
      region,
      specialization
    });
    return response.data;
  }
};

export default api;
