export type UserRole = 'patient' | 'nurse' | 'doctor' | 'ministry_official' | 'system_admin' | 'healthcare_provider';

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  facility?: string;
  region?: string;
  avatar?: string;
  permissions?: string[];
  department?: string;
  specialization?: string;
  isActive?: boolean;
  createdAt?: Date;
  lastLogin?: Date;
  createdBy?: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  facility?: string;
  region?: string;
  department?: string;
  specialization?: string;
  password: string;
  confirmPassword: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}