import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types/auth';
import { userManagementAPI } from '../../services/api';
import { X, User as UserIcon, Mail, MapPin, Building, Users, Stethoscope, Shield } from 'lucide-react';
import { getRoleConfig } from '../../types/roles';
import { useToast } from '../../hooks/useToast';

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '' as UserRole,
    facility: '',
    region: '',
    department: '',
    specialization: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});
  const { showToast } = useToast();

  const regions = [
    'Harare', 'Bulawayo', 'Mutare', 'Gweru', 'Masvingo', 
    'Chinhoyi', 'Marondera', 'Kariba', 'Victoria Falls', 'Hwange'
  ];

  const facilitiesByRegion: Record<string, string[]> = {
    Harare: ['Parirenyatwa Hospital', 'Harare Central Hospital', 'Sally Mugabe Central Hospital', 'Avenues Clinic'],
    Bulawayo: ['Mpilo Hospital', 'UBH', 'Mater Dei Hospital', 'Bulawayo Central Hospital'],
    Mutare: ['Mutare General Hospital', 'Mutare Provincial Hospital', 'Victoria Chitepo Hospital'],
    Gweru: ['Gweru Provincial Hospital', 'Midlands Hospital'],
    Masvingo: ['Masvingo Provincial Hospital', 'Morgenster Hospital'],
    Chinhoyi: ['Chinhoyi Provincial Hospital', 'Alaska Hospital']
  };

  const departmentsByRole: Record<UserRole, string[]> = {
    nurse: ['Maternity Ward', 'Emergency Ward', 'Pediatrics', 'General Ward', 'ICU', 'Outpatient'],
    healthcare_provider: ['Maternity Ward', 'Emergency Ward', 'Pediatrics', 'General Ward', 'ICU', 'Outpatient', 'Community Health'],
    doctor: ['Obstetrics & Gynecology', 'Pediatrics', 'Internal Medicine', 'Surgery', 'Emergency Medicine'],
    ministry_official: ['Maternal Health Division', 'Policy Development', 'Quality Assurance', 'Public Health', 'Data Analytics'],
    system_admin: ['IT Department', 'System Administration', 'Data Management', 'Security', 'Support'],
    patient: []
  };

  const specializationsByRole: Record<UserRole, string[]> = {
    nurse: ['Midwifery', 'Pediatric Nursing', 'Critical Care', 'Community Health', 'Infection Control'],
    healthcare_provider: ['Midwifery', 'Pediatric Care', 'Critical Care', 'Community Health', 'Maternal Health', 'Primary Care'],
    doctor: ['Maternal-Fetal Medicine', 'Neonatal Care', 'High-Risk Pregnancy', 'Reproductive Endocrinology', 'Gynecologic Oncology'],
    ministry_official: ['Public Health Policy', 'Health Economics', 'Epidemiology', 'Health System Strengthening'],
    system_admin: ['Network Administration', 'Database Management', 'Cybersecurity', 'Cloud Infrastructure'],
    patient: []
  };

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        role: user.role,
        facility: user.facility || '',
        region: user.region || '',
        department: user.department || '',
        specialization: user.specialization || ''
      });
      setFieldErrors({});
      setError(null);
    }
  }, [user]);

  const validate = (): boolean => {
    const errs: Partial<Record<keyof typeof formData, string>> = {};
    if (!formData.firstName.trim()) errs.firstName = 'First name is required';
    if (!formData.lastName.trim()) errs.lastName = 'Last name is required';
    if (!formData.email.trim()) errs.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Enter a valid email address';
    if (!formData.role) errs.role = 'Role is required';
    if (!formData.region) errs.region = 'Region is required';
    if (!formData.facility) errs.facility = 'Facility is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await userManagementAPI.updateUser(user.id, formData);
      
      if (response.success) {
        showToast('User updated successfully', 'success');
        onUserUpdated();
        onClose();
      } else {
        setError(response.message || 'Failed to update user');
        showToast(response.message || 'Failed to update user', 'error');
      }
    } catch (error) {
      setError('An error occurred while updating the user');
      console.error('Error updating user:', error);
      showToast('An error occurred while updating the user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (fieldErrors[name as keyof typeof formData]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit User</h2>
              <p className="text-sm text-gray-600">Update account details and role</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.firstName ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Enter first name"
                />
              </div>
              {fieldErrors.firstName && <p className="text-red-600 text-xs mt-1">{fieldErrors.firstName}</p>}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.lastName ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Enter last name"
                />
              </div>
              {fieldErrors.lastName && <p className="text-red-600 text-xs mt-1">{fieldErrors.lastName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.email ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Enter email address"
                />
              </div>
              {fieldErrors.email && <p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${fieldErrors.role ? 'border-red-300' : 'border-gray-300'}`}
                >
                  {(['nurse', 'healthcare_provider', 'doctor', 'ministry_official', 'system_admin'] as UserRole[]).map((role) => {
                    const cfg = getRoleConfig(role);
                    return (
                      <option key={role} value={role}>{cfg.name}</option>
                    );
                  })}
                </select>
              </div>
              {fieldErrors.role && <p className="text-red-600 text-xs mt-1">{fieldErrors.role}</p>}
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  name="region"
                  value={formData.region}
                  onChange={(e) => {
                    handleChange(e);
                    setFormData((prev) => ({ ...prev, facility: '' }));
                  }}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${fieldErrors.region ? 'border-red-300' : 'border-gray-300'}`}
                >
                  <option value="">Select region</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              {fieldErrors.region && <p className="text-red-600 text-xs mt-1">{fieldErrors.region}</p>}
            </div>

            {/* Facility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facility</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  name="facility"
                  value={formData.facility}
                  onChange={handleChange}
                  disabled={!formData.region}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${fieldErrors.facility ? 'border-red-300' : 'border-gray-300'} ${!formData.region ? 'bg-gray-100' : 'bg-white'}`}
                >
                  <option value="">Select facility</option>
                  {(facilitiesByRegion[formData.region] || []).map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              {fieldErrors.facility && <p className="text-red-600 text-xs mt-1">{fieldErrors.facility}</p>}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white border-gray-300"
                >
                  <option value="">Select department</option>
                  {(departmentsByRole[formData.role] || []).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Specialization */}
            {(formData.role === 'doctor' || formData.role === 'nurse') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white border-gray-300"
                  >
                    <option value="">Select specialization</option>
                    {(specializationsByRole[formData.role] || []).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
