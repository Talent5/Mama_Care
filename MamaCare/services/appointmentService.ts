import { apiClient, ApiResponse, Appointment } from '../config/api';

export interface CreateAppointmentData {
  patientId: string;
  healthcareProviderId: string;
  appointmentDate: string;
  appointmentTime: string;
  type: 'consultation' | 'checkup' | 'prenatal' | 'postnatal' | 'emergency' | 'follow_up' | 'vaccination' | 'ultrasound' | 'lab_test' | 'other';
  reason: string;
  notes?: string;
  symptoms?: any[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  duration?: number;
}

export interface UpdateAppointmentData extends Partial<CreateAppointmentData> {
  status?: 'pending' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rejected';
  diagnosis?: string;
  treatment?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  rejectionReason?: string;
  doctorNotes?: string;
}

export interface AppointmentFilters {
  patient?: string;
  provider?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: 'pending' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rejected';
  type?: 'anc_visit' | 'consultation' | 'emergency' | 'follow_up' | 'vaccination';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  appointments: T[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}

export interface AppointmentStats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  upcoming: number;
  overdue: number;
  todayCount: number;
  thisWeekCount: number;
}

class AppointmentService {
  async getAppointments(filters?: AppointmentFilters): Promise<ApiResponse<PaginatedResponse<Appointment>>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/appointments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await apiClient.get<PaginatedResponse<Appointment>>(endpoint);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      throw error;
    }
  }

  async getAppointmentById(id: string): Promise<ApiResponse<Appointment>> {
    try {
      return await apiClient.get<Appointment>(`/appointments/${id}`);
    } catch (error) {
      console.error('Failed to fetch appointment:', error);
      throw error;
    }
  }

  async createAppointment(appointmentData: CreateAppointmentData): Promise<ApiResponse<Appointment>> {
    try {
      return await apiClient.post<Appointment>('/appointments', appointmentData);
    } catch (error) {
      console.error('Failed to create appointment:', error);
      throw error;
    }
  }

  async updateAppointment(id: string, appointmentData: UpdateAppointmentData): Promise<ApiResponse<Appointment>> {
    try {
      return await apiClient.put<Appointment>(`/appointments/${id}`, appointmentData);
    } catch (error) {
      console.error('Failed to update appointment:', error);
      throw error;
    }
  }

  async deleteAppointment(id: string): Promise<ApiResponse> {
    try {
      return await apiClient.delete(`/appointments/${id}`);
    } catch (error) {
      console.error('Failed to delete appointment:', error);
      throw error;
    }
  }

  // Specific appointment actions
  async confirmAppointment(id: string): Promise<ApiResponse<Appointment>> {
    try {
      return await this.updateAppointment(id, { status: 'confirmed' });
    } catch (error) {
      console.error('Failed to confirm appointment:', error);
      throw error;
    }
  }

  async cancelAppointment(id: string, reason?: string): Promise<ApiResponse<Appointment>> {
    try {
      const updateData: UpdateAppointmentData = { status: 'cancelled' };
      if (reason) {
        updateData.notes = reason;
      }
      return await this.updateAppointment(id, updateData);
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      throw error;
    }
  }

  async completeAppointment(id: string, data: {
    diagnosis?: string;
    treatment?: string;
    notes?: string;
    followUpRequired?: boolean;
    followUpDate?: string;
  }): Promise<ApiResponse<Appointment>> {
    try {
      return await this.updateAppointment(id, { 
        status: 'completed',
        ...data
      });
    } catch (error) {
      console.error('Failed to complete appointment:', error);
      throw error;
    }
  }

  async markNoShow(id: string): Promise<ApiResponse<Appointment>> {
    try {
      return await this.updateAppointment(id, { status: 'no_show' });
    } catch (error) {
      console.error('Failed to mark appointment as no-show:', error);
      throw error;
    }
  }

  // Date-specific queries
  async getTodayAppointments(): Promise<ApiResponse<Appointment[]>> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await this.getAppointments({ date: today });
      return {
        ...response,
        data: response.data?.appointments || []
      };
    } catch (error) {
      console.error('Failed to fetch today\'s appointments:', error);
      throw error;
    }
  }

  async getUpcomingAppointments(days: number = 7): Promise<ApiResponse<Appointment[]>> {
    try {
      const today = new Date();
      const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
      
      const response = await this.getAppointments({
        dateFrom: today.toISOString().split('T')[0],
        dateTo: futureDate.toISOString().split('T')[0],
        status: 'scheduled'
      });
      
      return {
        ...response,
        data: response.data?.appointments || []
      };
    } catch (error) {
      console.error('Failed to fetch upcoming appointments:', error);
      throw error;
    }
  }

  async getMyAppointments(filters?: Omit<AppointmentFilters, 'patient'>): Promise<ApiResponse<PaginatedResponse<Appointment>>> {
    try {
      // For patients, the backend automatically filters to their appointments
      // when calling the main /appointments endpoint
      return await this.getAppointments(filters);
    } catch (error) {
      console.error('Failed to fetch my appointments:', error);
      throw error;
    }
  }

  // Statistics
  async getAppointmentStats(): Promise<ApiResponse<AppointmentStats>> {
    try {
      return await apiClient.get<AppointmentStats>('/appointments/stats');
    } catch (error) {
      console.error('Failed to fetch appointment stats:', error);
      throw error;
    }
  }

  // Availability
  async checkAvailability(date: string, time: string, duration: number = 30): Promise<ApiResponse<{ available: boolean }>> {
    try {
      return await apiClient.get<{ available: boolean }>(`/appointments/availability?date=${date}&time=${time}&duration=${duration}`);
    } catch (error) {
      console.error('Failed to check availability:', error);
      throw error;
    }
  }

  async getAvailableSlots(date: string): Promise<ApiResponse<string[]>> {
    try {
      return await apiClient.get<string[]>(`/appointments/available-slots?date=${date}`);
    } catch (error) {
      console.error('Failed to fetch available slots:', error);
      throw error;
    }
  }

  // Bulk operations
  async bulkUpdateAppointments(appointmentIds: string[], updateData: UpdateAppointmentData): Promise<ApiResponse<{ updated: number }>> {
    try {
      return await apiClient.patch<{ updated: number }>('/appointments/bulk-update', {
        appointmentIds,
        updateData
      });
    } catch (error) {
      console.error('Failed to bulk update appointments:', error);
      throw error;
    }
  }

  // Doctor Approval Workflow
  async getPendingAppointments(filters?: Pick<AppointmentFilters, 'page' | 'limit'>): Promise<ApiResponse<PaginatedResponse<Appointment>>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/appointments/pending${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await apiClient.get<PaginatedResponse<Appointment>>(endpoint);
    } catch (error) {
      console.error('Failed to fetch pending appointments:', error);
      throw error;
    }
  }

  async approveAppointment(
    id: string, 
    data?: {
      appointmentDate?: string;
      appointmentTime?: string;
      doctorNotes?: string;
    }
  ): Promise<ApiResponse<Appointment>> {
    try {
      return await apiClient.post<Appointment>(`/appointments/${id}/approve`, data || {});
    } catch (error) {
      console.error('Failed to approve appointment:', error);
      throw error;
    }
  }

  async rejectAppointment(id: string, rejectionReason: string): Promise<ApiResponse<Appointment>> {
    try {
      return await apiClient.post<Appointment>(`/appointments/${id}/reject`, {
        rejectionReason
      });
    } catch (error) {
      console.error('Failed to reject appointment:', error);
      throw error;
    }
  }

  // Integration with new healthcare features
  async convertToTelemedicine(appointmentId: string): Promise<ApiResponse<any>> {
    try {
      return await apiClient.post(`/appointments/${appointmentId}/convert-to-telemedicine`);
    } catch (error) {
      console.error('Failed to convert to telemedicine:', error);
      throw error;
    }
  }

  async generateInvoice(appointmentId: string): Promise<ApiResponse<any>> {
    try {
      return await apiClient.post(`/appointments/${appointmentId}/generate-invoice`);
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      throw error;
    }
  }

  async createMedicalRecord(appointmentId: string, recordData: any): Promise<ApiResponse<any>> {
    try {
      return await apiClient.post(`/appointments/${appointmentId}/medical-record`, recordData);
    } catch (error) {
      console.error('Failed to create medical record:', error);
      throw error;
    }
  }
}

export default new AppointmentService();
