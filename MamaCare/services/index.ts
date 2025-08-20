// Service exports
export { default as authService } from './authService';
export { default as patientService } from './patientService';
export { default as appointmentService } from './appointmentService';
export { default as alertService } from './alertService';
export { default as analyticsService } from './analyticsService';
export { default as dashboardService } from './dashboardService';
export { default as activityService } from './activityService';
export { default as medicalRecordService } from './medicalRecordService';
export { default as billingService } from './billingService';
export { default as telemedicineService } from './telemedicineService';

// Type exports
export type { LoginCredentials, RegisterCredentials, ChangePasswordData, AuthResponse } from './authService';
export type { CreatePatientData, UpdatePatientData, PatientSearchFilters } from './patientService';
export type { CreateAppointmentData, UpdateAppointmentData, AppointmentFilters, AppointmentStats } from './appointmentService';
export type { Alert, CreateAlertData, AlertFilters, AlertStats } from './alertService';
export type { DashboardStats, AnalyticsFilters, TrendData, PerformanceMetrics, HealthMetrics, GeographicData, ReportData } from './analyticsService';
export type { DashboardData, HealthMetric, CreateHealthMetricData, SymptomLog, CreateSymptomLogData, EmergencyContact } from './dashboardService';
export type { ActivityData, HealthMetric as ActivityHealthMetric, SymptomLog as ActivitySymptomLog } from './activityService';
export type { MedicalRecord, CreateMedicalRecordData, MedicalRecordFilters, MedicalRecordStats } from './medicalRecordService';
export type { Invoice, CreateInvoiceData, InvoiceFilters, PaymentData, InvoiceStats } from './billingService';
export type { VideoConsultation, CreateSessionData, TelemedicineFilters, SessionFeedback, TelemedicineStats } from './telemedicineService';

// Re-export API types
export type { ApiResponse, User, Patient, Appointment } from '../config/api';
