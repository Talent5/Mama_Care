import { apiClient, ApiResponse } from '../config/api';

export interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
}

export interface PatientData {
  _id: string;
  user: UserProfile;
  dateOfBirth: string;
  gender: string;
  phone?: string;
  address?: string;
  facility?: string;
  region?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  currentPregnancy?: {
    isPregnant: boolean;
    estimatedDueDate?: string;
    currentWeek?: number;
    riskLevel?: string;
    complications?: string[];
  };
  medicalHistory?: string[];
  allergies?: string[];
  medications?: string[];
  bloodType?: string;
  assignedDoctor?: {
    _id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProfileMedicalRecord {
  _id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  doctor: string;
  category: string;
  visitType?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  medications?: string[];
  notes?: string;
}

class ProfileService {
  async getMyProfile(): Promise<ApiResponse<PatientData>> {
    try {
      console.log('🔄 [ProfileService] Fetching user profile...');
      const response = await apiClient.get<PatientData>('/patients/me/profile');
      console.log('✅ [ProfileService] Profile fetched successfully');
      return response;
    } catch (error) {
      console.error('❌ [ProfileService] Failed to fetch profile:', error);
      throw error;
    }
  }

  async updateMyProfile(profileData: Partial<PatientData>): Promise<ApiResponse<PatientData>> {
    try {
      console.log('🔄 [ProfileService] Updating profile...');
      const response = await apiClient.put<PatientData>('/patients/me/profile', profileData);
      console.log('✅ [ProfileService] Profile updated successfully');
      return response;
    } catch (error) {
      console.error('❌ [ProfileService] Failed to update profile:', error);
      throw error;
    }
  }

  async getMyMedicalRecords(): Promise<ApiResponse<ProfileMedicalRecord[]>> {
    try {
      console.log('🔄 [ProfileService] Fetching medical records...');
      const response = await apiClient.get<ProfileMedicalRecord[]>('/patients/medical-records');
      console.log('✅ [ProfileService] Medical records fetched successfully');
      return response;
    } catch (error) {
      console.error('❌ [ProfileService] Failed to fetch medical records:', error);
      throw error;
    }
  }

  async createMedicalRecord(recordData: {
    type: string;
    title: string;
    description: string;
    category?: string;
    visitType?: string;
    chiefComplaint?: string;
    diagnosis?: string;
    medications?: string[];
    notes?: string;
  }): Promise<ApiResponse<ProfileMedicalRecord>> {
    try {
      console.log('🔄 [ProfileService] Creating medical record...');
      const response = await apiClient.post<ProfileMedicalRecord>('/patients/medical-records', recordData);
      console.log('✅ [ProfileService] Medical record created successfully');
      return response;
    } catch (error) {
      console.error('❌ [ProfileService] Failed to create medical record:', error);
      throw error;
    }
  }

  async updateMedicalRecord(recordId: string, recordData: Partial<ProfileMedicalRecord>): Promise<ApiResponse<ProfileMedicalRecord>> {
    try {
      console.log('🔄 [ProfileService] Updating medical record:', recordId);
      const response = await apiClient.put<ProfileMedicalRecord>(`/patients/medical-records/${recordId}`, recordData);
      console.log('✅ [ProfileService] Medical record updated successfully');
      return response;
    } catch (error) {
      console.error('❌ [ProfileService] Failed to update medical record:', error);
      throw error;
    }
  }

  async deleteMedicalRecord(recordId: string): Promise<ApiResponse> {
    try {
      console.log('🔄 [ProfileService] Deleting medical record:', recordId);
      const response = await apiClient.delete(`/patients/medical-records/${recordId}`);
      console.log('✅ [ProfileService] Medical record deleted successfully');
      return response;
    } catch (error) {
      console.error('❌ [ProfileService] Failed to delete medical record:', error);
      throw error;
    }
  }

  // Utility functions for profile data
  getFullName(profile: PatientData): string {
    return `${profile.user.firstName} ${profile.user.lastName}`;
  }

  getAge(profile: PatientData): number {
    const birthDate = new Date(profile.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  isPregnant(profile: PatientData): boolean {
    return profile.currentPregnancy?.isPregnant || false;
  }

  getPregnancyWeek(profile: PatientData): number | null {
    return profile.currentPregnancy?.currentWeek || null;
  }

  getDaysUntilDue(profile: PatientData): number | null {
    if (!profile.currentPregnancy?.estimatedDueDate) return null;
    
    const dueDate = new Date(profile.currentPregnancy.estimatedDueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
}

export default new ProfileService();
