import { apiClient, ApiResponse } from '../config/api';

export interface MedicalRecord {
  _id: string;
  patient: string | any;
  appointment: string | any;
  provider: string | any;
  visitDate: string;
  visitType: 'consultation' | 'emergency' | 'follow_up' | 'routine_checkup' | 'prenatal' | 'postnatal' | 'vaccination' | 'lab_test';
  chiefComplaint: string;
  historyOfPresentIllness?: string;
  physicalExamination?: {
    vitals?: {
      bloodPressure?: { systolic: number; diastolic: number };
      heartRate?: number;
      temperature?: number;
      respiratoryRate?: number;
      oxygenSaturation?: number;
      weight?: number;
      height?: number;
      bmi?: number;
    };
    generalAppearance?: string;
    systemsReview?: {
      cardiovascular?: string;
      respiratory?: string;
      gastrointestinal?: string;
      genitourinary?: string;
      neurological?: string;
      musculoskeletal?: string;
      integumentary?: string;
      psychiatric?: string;
    };
  };
  diagnosis: {
    primary: string;
    secondary?: string[];
    icd10Codes?: Array<{
      code: string;
      description: string;
    }>;
  };
  treatment?: {
    medications?: Array<{
      name: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
      instructions?: string;
      startDate?: string;
      endDate?: string;
    }>;
    procedures?: Array<{
      name: string;
      description?: string;
      date?: string;
    }>;
    recommendations?: string[];
  };
  followUp?: {
    required: boolean;
    timeframe?: string;
    instructions?: string;
    scheduledDate?: string;
    appointmentType?: string;
  };
  attachments?: Array<{
    type: 'lab_result' | 'image' | 'document' | 'prescription' | 'referral';
    filename: string;
    originalName: string;
    url: string;
    description?: string;
    uploadDate: string;
  }>;
  pregnancyDetails?: {
    gestationalAge?: number;
    fundalHeight?: number;
    fetalHeartRate?: number;
    fetalMovements?: string;
    complications?: string[];
    recommendations?: string[];
  };
  labResults?: Array<{
    testName: string;
    result: string;
    normalRange?: string;
    unit?: string;
    status: 'normal' | 'abnormal' | 'critical' | 'pending';
    performedDate?: string;
    reportedDate?: string;
    laboratory?: string;
  }>;
  status: 'draft' | 'completed' | 'reviewed' | 'amended';
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicalRecordData {
  patientId: string;
  appointmentId: string;
  visitType: MedicalRecord['visitType'];
  chiefComplaint: string;
  historyOfPresentIllness?: string;
  physicalExamination?: MedicalRecord['physicalExamination'];
  diagnosis: MedicalRecord['diagnosis'];
  treatment?: MedicalRecord['treatment'];
  followUp?: MedicalRecord['followUp'];
  pregnancyDetails?: MedicalRecord['pregnancyDetails'];
  labResults?: MedicalRecord['labResults'];
}

export interface MedicalRecordFilters {
  page?: number;
  limit?: number;
  visitType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedMedicalRecords {
  records: MedicalRecord[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}

export interface MedicalRecordStats {
  totalRecords: number;
  recordsByType: Array<{ _id: string; count: number }>;
  recentRecords: MedicalRecord[];
  commonDiagnoses: Array<{ _id: string; count: number }>;
}

class MedicalRecordService {
  async createMedicalRecord(recordData: CreateMedicalRecordData): Promise<ApiResponse<MedicalRecord>> {
    try {
      return await apiClient.post<MedicalRecord>('/medical-records', recordData);
    } catch (error) {
      console.error('Failed to create medical record:', error);
      throw error;
    }
  }

  async getMedicalRecordById(id: string): Promise<ApiResponse<MedicalRecord>> {
    try {
      return await apiClient.get<MedicalRecord>(`/medical-records/${id}`);
    } catch (error) {
      console.error('Failed to fetch medical record:', error);
      throw error;
    }
  }

  async getPatientMedicalHistory(patientId: string, filters?: MedicalRecordFilters): Promise<ApiResponse<PaginatedMedicalRecords>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/medical-records/patient/${patientId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await apiClient.get<PaginatedMedicalRecords>(endpoint);
    } catch (error) {
      console.error('Failed to fetch patient medical history:', error);
      throw error;
    }
  }

  async updateMedicalRecord(id: string, updateData: Partial<CreateMedicalRecordData>): Promise<ApiResponse<MedicalRecord>> {
    try {
      return await apiClient.put<MedicalRecord>(`/medical-records/${id}`, updateData);
    } catch (error) {
      console.error('Failed to update medical record:', error);
      throw error;
    }
  }

  async getProviderMedicalRecords(providerId: string, filters?: MedicalRecordFilters): Promise<ApiResponse<PaginatedMedicalRecords>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/medical-records/provider/${providerId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await apiClient.get<PaginatedMedicalRecords>(endpoint);
    } catch (error) {
      console.error('Failed to fetch provider medical records:', error);
      throw error;
    }
  }

  async searchMedicalRecords(query: string, filters?: MedicalRecordFilters): Promise<ApiResponse<PaginatedMedicalRecords>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/medical-records/search/${encodeURIComponent(query)}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await apiClient.get<PaginatedMedicalRecords>(endpoint);
    } catch (error) {
      console.error('Failed to search medical records:', error);
      throw error;
    }
  }

  async addAttachment(recordId: string, attachmentData: {
    type: string;
    filename: string;
    originalName: string;
    url: string;
    description?: string;
  }): Promise<ApiResponse<MedicalRecord>> {
    try {
      return await apiClient.post<MedicalRecord>(`/medical-records/${recordId}/attachments`, attachmentData);
    } catch (error) {
      console.error('Failed to add attachment:', error);
      throw error;
    }
  }

  async getMedicalRecordStats(period?: string): Promise<ApiResponse<MedicalRecordStats>> {
    try {
      const queryParams = period ? `?period=${period}` : '';
      return await apiClient.get<MedicalRecordStats>(`/medical-records/stats/dashboard${queryParams}`);
    } catch (error) {
      console.error('Failed to fetch medical record statistics:', error);
      throw error;
    }
  }

  // Helper methods for creating records from appointments
  async createFromAppointment(appointmentId: string, recordData: Omit<CreateMedicalRecordData, 'appointmentId'>): Promise<ApiResponse<MedicalRecord>> {
    try {
      return await this.createMedicalRecord({
        ...recordData,
        appointmentId
      });
    } catch (error) {
      console.error('Failed to create medical record from appointment:', error);
      throw error;
    }
  }

  // Quick templates for common record types
  createPregnancyTemplate(): Partial<CreateMedicalRecordData> {
    return {
      visitType: 'prenatal',
      physicalExamination: {
        vitals: {
          bloodPressure: { systolic: 0, diastolic: 0 },
          heartRate: 0,
          temperature: 0,
          weight: 0,
          height: 0
        },
        systemsReview: {
          cardiovascular: '',
          respiratory: '',
          genitourinary: ''
        }
      },
      pregnancyDetails: {
        gestationalAge: 0,
        fundalHeight: 0,
        fetalHeartRate: 0,
        fetalMovements: '',
        complications: [],
        recommendations: []
      }
    };
  }

  createConsultationTemplate(): Partial<CreateMedicalRecordData> {
    return {
      visitType: 'consultation',
      physicalExamination: {
        vitals: {
          bloodPressure: { systolic: 0, diastolic: 0 },
          heartRate: 0,
          temperature: 0
        },
        generalAppearance: '',
        systemsReview: {}
      },
      followUp: {
        required: false
      }
    };
  }
}

export default new MedicalRecordService();
