import { apiClient, ApiResponse } from '../config/api';

export interface DashboardData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
    avatar?: string;
  };
  pregnancy: {
    isPregnant: boolean;
    currentWeek: number;
    dueDate: string;
    estimatedDueDate: string;
    riskLevel: 'low' | 'medium' | 'high';
    stage: 'First Trimester' | 'Second Trimester' | 'Third Trimester';
    progressPercentage: number;
    remainingWeeks: number;
    babySize: {
      comparison: string;
      emoji: string;
      length: string;
      weight: string;
    };
  };
  healthMetrics: {
    waterIntake: {
      current: number;
      target: number;
      percentage: number;
    };
    prenatalVitamins: {
      taken: number;
      required: number;
      percentage: number;
    };
    exercise?: {
      current: number;
      target: number;
      percentage: number;
    };
    symptoms: string[];
    lastCheckup: string;
    nextCheckup: string;
  };
  nextAppointment?: {
    id: string;
    title: string;
    date: string;
    time: string;
    doctor: string;
    location: string;
    duration: string;
    type: string;
  };
  recentActivity: {
    id: string;
    type: 'medication' | 'symptom' | 'appointment' | 'reading' | 'exercise';
    description: string;
    timestamp: string;
    icon: string;
  }[];
  healthTip: {
    title: string;
    category: string;
    content: string;
    icon: string;
  };
}

export interface HealthMetric {
  id: string;
  type: 'water_intake' | 'prenatal_vitamins' | 'exercise' | 'sleep' | 'weight' | 'blood_pressure';
  value: number;
  target?: number;
  unit: string;
  recordedAt: string;
  notes?: string;
}

export interface CreateHealthMetricData {
  type: 'water_intake' | 'prenatal_vitamins' | 'exercise' | 'sleep' | 'weight' | 'blood_pressure';
  value: number;
  target?: number;
  unit: string;
  notes?: string;
}

export interface SymptomLog {
  id: string;
  symptoms: string[];
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
  recordedAt: string;
}

export interface CreateSymptomLogData {
  symptoms: string[];
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  type: 'ambulance' | 'maternity_ward' | 'doctor' | 'family';
}

class DashboardService {
  async getDashboardData(): Promise<ApiResponse<DashboardData>> {
    try {
      console.log('🔄 [DashboardService] Fetching dashboard data from:', apiClient['baseURL']);
      const response = await apiClient.get<DashboardData>('/dashboard');
      console.log('✅ [DashboardService] Dashboard data fetched successfully:', response.success);
      return response;
    } catch (error) {
      console.error('❌ [DashboardService] Failed to fetch dashboard data:', error);
      throw error;
    }
  }

  async getHealthMetrics(type?: string, days?: number): Promise<ApiResponse<HealthMetric[]>> {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (days) params.append('days', days.toString());
      
      const endpoint = `/dashboard/health-metrics${params.toString() ? `?${params.toString()}` : ''}`;
      return await apiClient.get<HealthMetric[]>(endpoint);
    } catch (error) {
      console.error('Failed to fetch health metrics:', error);
      throw error;
    }
  }

  async recordHealthMetric(data: CreateHealthMetricData): Promise<ApiResponse<HealthMetric>> {
    try {
      console.log('📊 [DashboardService] Recording health metric:', data);
      const response = await apiClient.post<HealthMetric>('/dashboard/health-metrics', data);
      console.log('✅ [DashboardService] Health metric recorded successfully:', response.success);
      return response;
    } catch (error) {
      console.error('❌ [DashboardService] Failed to record health metric:', error);
      throw error;
    }
  }

  async getSymptomLogs(days?: number): Promise<ApiResponse<SymptomLog[]>> {
    try {
      const params = new URLSearchParams();
      if (days) params.append('days', days.toString());
      
      const endpoint = `/dashboard/symptom-logs${params.toString() ? `?${params.toString()}` : ''}`;
      return await apiClient.get<SymptomLog[]>(endpoint);
    } catch (error) {
      console.error('Failed to fetch symptom logs:', error);
      throw error;
    }
  }

  async logSymptoms(data: CreateSymptomLogData): Promise<ApiResponse<SymptomLog>> {
    try {
      return await apiClient.post<SymptomLog>('/dashboard/symptom-logs', data);
    } catch (error) {
      console.error('Failed to log symptoms:', error);
      throw error;
    }
  }

  async getEmergencyContacts(): Promise<ApiResponse<EmergencyContact[]>> {
    try {
      return await apiClient.get<EmergencyContact[]>('/dashboard/emergency-contacts');
    } catch (error) {
      console.error('Failed to fetch emergency contacts:', error);
      throw error;
    }
  }

  async makeEmergencyCall(type: 'ambulance' | 'maternity_ward'): Promise<ApiResponse> {
    try {
      return await apiClient.post('/dashboard/emergency-call', { type });
    } catch (error) {
      console.error('Failed to initiate emergency call:', error);
      throw error;
    }
  }

  // Get emergency phone numbers
  getEmergencyNumbers(): Record<string, string> {
    return {
      ambulance: '999',
      maternity_ward: '+263242791631', // Example Zimbabwe maternity ward number
      police: '995',
      fire: '993'
    };
  }

  // Make actual phone call
  async initiatePhoneCall(type: 'ambulance' | 'maternity_ward'): Promise<boolean> {
    const { Linking } = await import('react-native');
    
    try {
      const numbers = this.getEmergencyNumbers();
      const phoneNumber = numbers[type];
      
      if (!phoneNumber) {
        throw new Error('Phone number not found for emergency type');
      }

      // Log the emergency call attempt first
      try {
        await this.makeEmergencyCall(type);
      } catch (logError) {
        console.warn('Failed to log emergency call, but proceeding with call:', logError);
      }

      // Create phone URL
      const phoneUrl = `tel:${phoneNumber}`;
      
      // Check if the phone app can be opened
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (!canOpen) {
        throw new Error('Phone app not available');
      }

      // Open phone app with the number
      await Linking.openURL(phoneUrl);
      return true;

    } catch (error) {
      console.error('Failed to initiate phone call:', error);
      throw error;
    }
  }

  // Quick dial emergency - no confirmation
  async quickDialEmergency(): Promise<boolean> {
    try {
      return await this.initiatePhoneCall('ambulance');
    } catch (error) {
      console.error('Quick dial emergency failed:', error);
      throw error;
    }
  }

  async getHealthTips(category?: string): Promise<ApiResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      
      const endpoint = `/dashboard/health-tips${params.toString() ? `?${params.toString()}` : ''}`;
      return await apiClient.get<any[]>(endpoint);
    } catch (error) {
      console.error('Failed to fetch health tips:', error);
      throw error;
    }
  }

  async updatePregnancyWeek(week: number): Promise<ApiResponse> {
    try {
      return await apiClient.put('/dashboard/pregnancy/week', { currentWeek: week });
    } catch (error) {
      console.error('Failed to update pregnancy week:', error);
      throw error;
    }
  }

  async getActivityFeed(limit?: number): Promise<ApiResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      
      const endpoint = `/dashboard/activity-feed${params.toString() ? `?${params.toString()}` : ''}`;
      return await apiClient.get<any[]>(endpoint);
    } catch (error) {
      console.error('Failed to fetch activity feed:', error);
      throw error;
    }
  }

  // Mock data for offline/development use
  getMockDashboardData(): DashboardData {
    const currentWeek = Math.floor(Math.random() * 40) + 1;
    const getBabySize = (week: number) => {
      if (week <= 8) return { comparison: 'Raspberry', emoji: '🫐', length: '2cm', weight: '2g' };
      if (week <= 12) return { comparison: 'Lime', emoji: '🟢', length: '6cm', weight: '14g' };
      if (week <= 16) return { comparison: 'Avocado', emoji: '🥑', length: '12cm', weight: '100g' };
      if (week <= 20) return { comparison: 'Banana', emoji: '🍌', length: '16cm', weight: '300g' };
      if (week <= 24) return { comparison: 'Corn', emoji: '🌽', length: '30cm', weight: '600g' };
      if (week <= 28) return { comparison: 'Eggplant', emoji: '🍆', length: '35cm', weight: '1kg' };
      if (week <= 32) return { comparison: 'Pineapple', emoji: '🍍', length: '40cm', weight: '1.7kg' };
      if (week <= 36) return { comparison: 'Papaya', emoji: '🥭', length: '45cm', weight: '2.6kg' };
      return { comparison: 'Watermelon', emoji: '🍉', length: '50cm', weight: '3.4kg' };
    };

    const getStage = (week: number) => {
      if (week <= 12) return 'First Trimester';
      if (week <= 28) return 'Second Trimester';
      return 'Third Trimester';
    };

    return {
      user: {
        id: '1',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@example.com',
        fullName: 'Sarah Johnson'
      },
      pregnancy: {
        isPregnant: true,
        currentWeek,
        dueDate: '2024-12-15',
        estimatedDueDate: '2024-12-15',
        riskLevel: 'low',
        stage: getStage(currentWeek),
        progressPercentage: Math.round((currentWeek / 40) * 100),
        remainingWeeks: 40 - currentWeek,
        babySize: getBabySize(currentWeek)
      },
      healthMetrics: {
        waterIntake: { current: 6, target: 8, percentage: 75 },
        prenatalVitamins: { taken: 1, required: 1, percentage: 100 },
        exercise: { current: 20, target: 30, percentage: 67 },
        symptoms: ['Morning sickness', 'Fatigue'],
        lastCheckup: '2024-08-01',
        nextCheckup: '2024-08-15'
      },
      nextAppointment: {
        id: '1',
        title: 'Routine Checkup',
        date: '2024-08-06',
        time: '10:00 AM',
        doctor: 'Dr. Sarah Johnson',
        location: 'Harare Central Hospital',
        duration: '1 hour',
        type: 'anc_visit'
      },
      recentActivity: [
        {
          id: '1',
          type: 'medication',
          description: 'Completed prenatal vitamins',
          timestamp: '2 hours ago',
          icon: '✅'
        },
        {
          id: '2',
          type: 'symptom',
          description: 'Logged daily symptoms',
          timestamp: '5 hours ago',
          icon: '📝'
        },
        {
          id: '3',
          type: 'reading',
          description: 'Read pregnancy article',
          timestamp: '1 day ago',
          icon: '📖'
        }
      ],
      healthTip: {
        title: "Today's Tip",
        category: 'Hydration',
        content: 'Stay hydrated! Aim for 8-10 glasses of water daily to support your baby\'s development and your own health.',
        icon: '💡'
      }
    };
  }
}

export default new DashboardService();
