// API Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field?: string; message: string }>;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Patient Types
export interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth: string;
  nationalId?: string;
  address?: {
    street?: string;
    city?: string;
    region?: string;
    country?: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  pregnancyInfo?: {
    lmp: string;
    edd: string;
    gestationalAge: number;
    gravida: number;
    para: number;
    abortions: number;
    liveBirths: number;
  };
  medicalHistory?: {
    conditions: string[];
    medications: string[];
    allergies: string[];
    surgeries: string[];
  };
  riskFactors?: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  assignedFacility?: string;
  assignedProvider?: string;
  isActive: boolean;
  registrationDate: string;
  lastVisit?: string;
  nextAppointment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth: string;
  nationalId?: string;
  address?: {
    street?: string;
    city?: string;
    region?: string;
    country?: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  pregnancyInfo?: {
    lmp: string;
    edd?: string;
    gravida: number;
    para: number;
    abortions: number;
    liveBirths: number;
  };
  medicalHistory?: {
    conditions: string[];
    medications: string[];
    allergies: string[];
    surgeries: string[];
  };
  riskFactors?: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  assignedFacility?: string;
  assignedProvider?: string;
}

export type UpdatePatientRequest = Partial<CreatePatientRequest>;

// Appointment Types
export interface Appointment {
  _id: string;
  patient: Patient;
  provider: User;
  facility: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  type: 'anc' | 'consultation' | 'follow-up' | 'emergency';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  reason?: string;
  notes?: string;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  patientId: string;
  providerId: string;
  facility: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  type: 'anc' | 'consultation' | 'follow-up' | 'emergency';
  reason?: string;
  notes?: string;
}

export type UpdateAppointmentRequest = Partial<CreateAppointmentRequest>;

// User Types
export interface User {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  phone?: string;
  role: 'system_admin' | 'doctor' | 'nurse' | 'ministry_official' | 'healthcare_provider' | 'patient';
  facility?: string;
  region?: string;
  department?: string;
  specialization?: string;
  licenseNumber?: string;
  isActive: boolean;
  emailVerified?: boolean;
  lastLogin?: string | Date;
  createdAt: string | Date;
  updatedAt?: string;
  createdBy?: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: 'system_admin' | 'doctor' | 'nurse' | 'ministry_official' | 'healthcare_provider' | 'patient';
  facility?: string;
  region?: string;
  department?: string;
  specialization?: string;
  licenseNumber?: string;
}

export type UpdateUserRequest = Partial<Omit<CreateUserRequest, 'password'>>;

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  facility?: string;
  region?: string;
  specialization?: string;
  licenseNumber?: string;
}

// Analytics Types
export interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  todaysAppointments: number;
  pendingAppointments: number;
  highRiskPatients: number;
  ancCompletionRate: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  ancVisitsByStage: Record<string, number>;
  monthlyTrends: Array<{
    _id: string;
    count: number;
  }>;
  recentActivity: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    createdAt: string;
    riskFactors?: {
      level: string;
    };
  }>;
  upcomingAppointments: Array<{
    _id: string;
    appointmentDate: string;
    type: string;
    status: string;
    patient: {
      firstName: string;
      lastName: string;
      phone?: string;
    };
  }>;
  regionalIndicators: Array<{
    region: string;
    activePatients: number;
    completionRate: number;
  }>;
}

export interface PatientStats {
  totalPatients: number;
  newPatients: number;
  activePatients: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  ageDistribution: {
    '15-20': number;
    '21-25': number;
    '26-30': number;
    '31-35': number;
    '36-40': number;
    '40+': number;
  };
  regionDistribution: Record<string, number>;
  facilityDistribution: Record<string, number>;
}

export interface AppointmentStats {
  totalAppointments: number;
  scheduledAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  appointmentsByType: {
    anc: number;
    consultation: number;
    followUp: number;
    emergency: number;
  };
  appointmentsByMonth: {
    month: string;
    count: number;
  }[];
}

export interface HealthMetrics {
  ancCoverage: number;
  ancCompletionRate: number;
  skilleBirthAttendance: number;
  maternalMortality: number;
  prenatalCareUtilization: number;
  riskFactorPrevalence: Record<string, number>;
  outcomeMetrics: {
    normalDeliveries: number;
    cesareanDeliveries: number;
    complications: number;
    referrals: number;
  };
}

// Filter Types
export interface PatientFilters {
  search?: string;
  riskLevel?: string;
  facility?: string;
  region?: string;
  page?: number;
  limit?: number;
}

export interface AppointmentFilters {
  date?: string;
  status?: string;
  facility?: string;
  provider?: string;
  page?: number;
  limit?: number;
}

export interface UserFilters {
  search?: string;
  role?: string;
  facility?: string;
  region?: string;
  page?: number;
  limit?: number;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  facility?: string;
  region?: string;
}

// Export Types
export interface ExportFilters {
  type: 'patients' | 'appointments' | 'analytics';
  format: 'csv' | 'excel' | 'pdf';
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: PatientFilters | AppointmentFilters | AnalyticsFilters;
}

// Alert Types
export interface AlertData {
  id: string;
  type: 'high_risk' | 'missed_appointment' | 'overdue_visit' | 'emergency';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  patientId: string;
  patientName: string;
  timestamp: string;
  resolved: boolean;
  resolvedBy?: {
    id: string;
    name: string;
  };
  resolvedAt?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface AlertStats {
  totalUnresolved: number;
  critical: number;
  warning: number;
  info: number;
  overdueVisits: number;
  resolved: number;
  byType: Array<{ _id: string; count: number }>;
  bySeverity: Array<{ _id: string; count: number }>;
}
