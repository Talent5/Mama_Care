export interface PatientData {
  id: string;
  name: string;
  age: number;
  gestationalWeek: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastVisit: string;
  nextAppointment: string;
  ancVisits: number;
  facility: string;
  region: string;
}

export interface AlertData {
  id: string;
  type: 'high_risk' | 'missed_appointment' | 'overdue_visit' | 'emergency';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  patientId: string;
  patientName: string;
  timestamp: string;
  resolved: boolean;
}

export interface AppointmentData {
  id: string;
  patientId: string;
  patientName: string;
  type: 'anc' | 'delivery' | 'postnatal' | 'consultation';
  date: string;
  time: string;
  provider: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  facility: string;
}

export interface AnalyticsData {
  ancCompletionRate: number;
  riskAssessments: {
    low: number;
    medium: number;
    high: number;
  };
  appointmentAdherence: number;
  regionalIndicators: {
    region: string;
    activePatients: number;
    completionRate: number;
  }[];
}