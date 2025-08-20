import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  Building, 
  MapPin, 
  Users,
  Stethoscope,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { UserRole, CreateUserRequest } from '../../types/auth';
import { getRoleConfig } from '../../types/roles';
import { userManagementAPI } from '../../services/api';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void; // Changed to just a callback without parameters
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onUserCreated }) => {
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'nurse',
    facility: '',
    region: '',
    department: '',
    specialization: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateUserRequest>>({});
  const [isLoading, setIsLoading] = useState(false);

  const regions = [
    'Harare', 'Bulawayo', 'Mutare', 'Gweru', 'Masvingo', 
    'Chinhoyi', 'Marondera', 'Kariba', 'Victoria Falls', 'Hwange'
  ];

  const facilitiesByRegion: Record<string, string[]> = {
    'Harare': ['Parirenyatwa Hospital', 'Harare Central Hospital', 'Sally Mugabe Central Hospital', 'Avenues Clinic'],
    'Bulawayo': ['Mpilo Hospital', 'UBH', 'Mater Dei Hospital', 'Bulawayo Central Hospital'],
    'Mutare': ['Mutare General Hospital', 'Mutare Provincial Hospital', 'Victoria Chitepo Hospital'],
    'Gweru': ['Gweru Provincial Hospital', 'Midlands Hospital'],
    'Masvingo': ['Masvingo Provincial Hospital', 'Morgenster Hospital'],
    'Chinhoyi': ['Chinhoyi Provincial Hospital', 'Alaska Hospital']
  };

  const departmentsByRole: Record<UserRole, string[]> = {
    nurse: ['Maternity Ward', 'Emergency Ward', 'Pediatrics', 'General Ward', 'ICU', 'Outpatient'],
    healthcare_provider: ['Maternity Ward', 'Emergency Ward', 'Pediatrics', 'General Ward', 'ICU', 'Outpatient', 'Community Health'],
    doctor: ['Obstetrics & Gynecology', 'Pediatrics', 'Internal Medicine', 'Surgery', 'Emergency Medicine'],
    ministry_official: ['Maternal Health Division', 'Policy Development', 'Quality Assurance', 'Public Health', 'Data Analytics'],
    system_admin: ['IT Department', 'System Administration', 'Data Management', 'Security', 'Support']
  };

  const specializationsByRole: Record<UserRole, string[]> = {
    nurse: ['Midwifery', 'Pediatric Nursing', 'Critical Care', 'Community Health', 'Infection Control'],
    healthcare_provider: ['Midwifery', 'Pediatric Care', 'Critical Care', 'Community Health', 'Maternal Health', 'Primary Care'],
    doctor: ['Maternal-Fetal Medicine', 'Neonatal Care', 'High-Risk Pregnancy', 'Reproductive Endocrinology', 'Gynecologic Oncology'],
    ministry_official: ['Public Health Policy', 'Health Economics', 'Epidemiology', 'Health System Strengthening'],
    system_admin: ['Network Administration', 'Database Management', 'Cybersecurity', 'Cloud Infrastructure']
  };

  const handleInputChange = (field: keyof CreateUserRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateUserRequest> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Role-specific validation
    if (!formData.facility) {
      newErrors.facility = 'Facility is required';
    }
    if (!formData.region) {
      newErrors.region = 'Region is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare user data for API
      const userData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        facility: formData.facility,
        region: formData.region,
        department: formData.department,
        specialization: formData.specialization,
        password: formData.password
      };

      // Use the API service to create user
      const response = await userManagementAPI.createUser(userData);
      
      if (response.success) {
        // Call the callback to refresh the user list
        onUserCreated();
        
        // Show success message
        alert('User created successfully!');
        
        // Reset form
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          role: 'nurse',
          facility: '',
          region: '',
          department: '',
          specialization: '',
          password: '',
          confirmPassword: ''
        });
        
        // Close modal
        onClose();
      } else {
        throw new Error('Failed to create user');
      }
      
    } catch (error) {
      console.error('Error creating user:', error);
      alert(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    const config = getRoleConfig(role);
    return (
      <div 
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: config.color }}
      />
    );
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength < 2) return { label: 'Weak', color: 'red' };
    if (strength < 4) return { label: 'Medium', color: 'orange' };
    return { label: 'Strong', color: 'green' };
  };

  if (!isOpen) return null;

  const availableFacilities = formData.region ? facilitiesByRegion[formData.region] || [] : [];
  const availableDepartments = departmentsByRole[formData.role] || [];
  const availableSpecializations = specializationsByRole[formData.role] || [];
  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
              <p className="text-sm text-gray-600">Add a new user to the MamaCare system</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Role *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['nurse', 'healthcare_provider', 'doctor', 'ministry_official', 'system_admin'] as UserRole[]).map((role) => {
                const config = getRoleConfig(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleInputChange('role', role)}
                    className={`p-3 border rounded-lg transition-all ${
                      formData.role === role
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {getRoleIcon(role)}
                      <span className="font-medium text-sm" style={{ color: config.color }}>
                        {config.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 text-left">{config.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter first name"
                />
              </div>
              {errors.firstName && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.firstName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                />
              </div>
              {errors.lastName && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
              />
            </div>
            {errors.email && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Location Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Region *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.region}
                  onChange={(e) => {
                    handleInputChange('region', e.target.value);
                    handleInputChange('facility', ''); // Reset facility when region changes
                  }}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${
                    errors.region ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select region</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
              {errors.region && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.region}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facility *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.facility}
                  onChange={(e) => handleInputChange('facility', e.target.value)}
                  disabled={!formData.region}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${
                    errors.facility ? 'border-red-300' : 'border-gray-300'
                  } ${!formData.region ? 'bg-gray-100' : ''}`}
                >
                  <option value="">Select facility</option>
                  {availableFacilities.map(facility => (
                    <option key={facility} value={facility}>{facility}</option>
                  ))}
                </select>
              </div>
              {errors.facility && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.facility}
                </p>
              )}
            </div>
          </div>

          {/* Department and Specialization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Select department</option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            {(formData.role === 'doctor' || formData.role === 'nurse') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization
                </label>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={formData.specialization}
                    onChange={(e) => handleInputChange('specialization', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">Select specialization</option>
                    {availableSpecializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-1">
                      <div 
                        className={`h-1 rounded-full transition-all ${
                          passwordStrength.color === 'red' ? 'bg-red-500 w-1/3' :
                          passwordStrength.color === 'orange' ? 'bg-orange-500 w-2/3' :
                          'bg-green-500 w-full'
                        }`}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.color === 'red' ? 'text-red-600' :
                      passwordStrength.color === 'orange' ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
              {errors.password && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Passwords match
                </p>
              )}
              {errors.confirmPassword && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating User...
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  Create User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
