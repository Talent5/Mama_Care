import { apiClient, ApiResponse } from '../config/api';

export interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  specialization?: string;
  role: string;
  facility?: string;
  region?: string;
  department?: string;
}

class DoctorService {
  async getDoctors(): Promise<ApiResponse<{ doctors: Doctor[] }>> {
    try {
      return await apiClient.get<{ doctors: Doctor[] }>('/users/doctors');
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
      throw error;
    }
  }

  async getDoctorById(id: string): Promise<ApiResponse<{ doctor: Doctor }>> {
    try {
      return await apiClient.get<{ doctor: Doctor }>(`/users/${id}`);
    } catch (error) {
      console.error('Failed to fetch doctor:', error);
      throw error;
    }
  }

  async getDoctorsBySpecialization(specialization: string): Promise<ApiResponse<{ doctors: Doctor[] }>> {
    try {
      const response = await this.getDoctors();
      if (response.success && response.data) {
        const filteredDoctors = response.data.doctors.filter(
          doctor => doctor.specialization?.toLowerCase().includes(specialization.toLowerCase())
        );
        return {
          ...response,
          data: { doctors: filteredDoctors }
        };
      }
      return response;
    } catch (error) {
      console.error('Failed to fetch doctors by specialization:', error);
      throw error;
    }
  }

  async getDoctorsByFacility(facility: string): Promise<ApiResponse<{ doctors: Doctor[] }>> {
    try {
      const response = await this.getDoctors();
      if (response.success && response.data) {
        const filteredDoctors = response.data.doctors.filter(
          doctor => doctor.facility?.toLowerCase().includes(facility.toLowerCase())
        );
        return {
          ...response,
          data: { doctors: filteredDoctors }
        };
      }
      return response;
    } catch (error) {
      console.error('Failed to fetch doctors by facility:', error);
      throw error;
    }
  }
}

export default new DoctorService();
