import { apiClient, ApiResponse, Patient } from '../config/api';

export interface CreatePatientData {
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
  pregnancyInfo?: {
    isPregnant: boolean;
    dueDate?: string;
    currentWeek?: number;
    highRisk?: boolean;
    complications?: string[];
  };
}

export interface UpdatePatientData extends Partial<CreatePatientData> {
  status?: 'active' | 'inactive';
}

export interface PatientSearchFilters {
  search?: string;
  status?: 'active' | 'inactive';
  gender?: 'male' | 'female' | 'other';
  isPregnant?: boolean;
  highRisk?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}

class PatientService {
  async getPatients(filters?: PatientSearchFilters): Promise<ApiResponse<PaginatedResponse<Patient>>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/patients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await apiClient.get<PaginatedResponse<Patient>>(endpoint);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      throw error;
    }
  }

  async getPatientById(id: string): Promise<ApiResponse<Patient>> {
    try {
      return await apiClient.get<Patient>(`/patients/${id}`);
    } catch (error) {
      console.error('Failed to fetch patient:', error);
      throw error;
    }
  }

  async createPatient(patientData: CreatePatientData): Promise<ApiResponse<Patient>> {
    try {
      return await apiClient.post<Patient>('/patients', patientData);
    } catch (error) {
      console.error('Failed to create patient:', error);
      throw error;
    }
  }

  async updatePatient(id: string, patientData: UpdatePatientData): Promise<ApiResponse<Patient>> {
    try {
      return await apiClient.put<Patient>(`/patients/${id}`, patientData);
    } catch (error) {
      console.error('Failed to update patient:', error);
      throw error;
    }
  }

  async deletePatient(id: string): Promise<ApiResponse> {
    try {
      return await apiClient.delete(`/patients/${id}`);
    } catch (error) {
      console.error('Failed to delete patient:', error);
      throw error;
    }
  }

  async getMyProfile(): Promise<ApiResponse<Patient>> {
    try {
      return await apiClient.get<Patient>('/patients/me/profile');
    } catch (error) {
      console.error('Failed to fetch my profile:', error);
      throw error;
    }
  }

  async updateMyProfile(patientData: UpdatePatientData): Promise<ApiResponse<Patient>> {
    try {
      return await apiClient.put<Patient>('/patients/me/profile', patientData);
    } catch (error) {
      console.error('Failed to update my profile:', error);
      throw error;
    }
  }

  // Pregnancy-specific methods
  async getPregnantPatients(filters?: Omit<PatientSearchFilters, 'isPregnant'>): Promise<ApiResponse<PaginatedResponse<Patient>>> {
    try {
      return await this.getPatients({ ...filters, isPregnant: true });
    } catch (error) {
      console.error('Failed to fetch pregnant patients:', error);
      throw error;
    }
  }

  async getHighRiskPatients(filters?: Omit<PatientSearchFilters, 'highRisk'>): Promise<ApiResponse<PaginatedResponse<Patient>>> {
    try {
      return await this.getPatients({ ...filters, highRisk: true });
    } catch (error) {
      console.error('Failed to fetch high-risk patients:', error);
      throw error;
    }
  }

  async updatePregnancyInfo(id: string, pregnancyInfo: NonNullable<CreatePatientData['pregnancyInfo']>): Promise<ApiResponse<Patient>> {
    try {
      return await this.updatePatient(id, { pregnancyInfo });
    } catch (error) {
      console.error('Failed to update pregnancy info:', error);
      throw error;
    }
  }

  // Search methods
  async searchPatients(query: string): Promise<ApiResponse<Patient[]>> {
    try {
      return await apiClient.get<Patient[]>(`/patients/search?q=${encodeURIComponent(query)}`);
    } catch (error) {
      console.error('Failed to search patients:', error);
      throw error;
    }
  }

  // Statistics
  async getPatientStats(): Promise<ApiResponse<{
    total: number;
    active: number;
    pregnant: number;
    highRisk: number;
    recentlyAdded: number;
  }>> {
    try {
      return await apiClient.get('/patients/stats');
    } catch (error) {
      console.error('Failed to fetch patient stats:', error);
      throw error;
    }
  }
}

export default new PatientService();
