import React from 'react';
import { X, User, MapPin, Phone, Mail, Shield, Building2, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { User as BaseUser } from '../../types/auth';

// Define EnhancedUser interface here since it's used locally
interface EnhancedUser extends BaseUser {
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  loginCount: number;
  lastLoginIP: string;
  failedLoginAttempts: number;
  twoFactorEnabled: boolean;
  username?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  district?: string;
  address?: string;
  licenseNumber?: string;
  specialization?: string;
  yearsOfExperience?: number;
  mfaEnabled?: boolean;
  emailVerified?: boolean;
  isLocked?: boolean;
  notes?: string;
  emergencyContact?: string;
  alternativeEmail?: string;
}

interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: EnhancedUser;
}

// Helper function to get role configurations
const getRoleConfig = (role: string) => {
  const configs = {
    nurse: {
      displayName: 'Nurse',
      color: 'bg-green-100 text-green-800',
      description: 'Provides patient care and medical support'
    },
    healthcare_provider: {
      displayName: 'Healthcare Provider',
      color: 'bg-blue-100 text-blue-800',
      description: 'Delivers healthcare services and patient care'
    },
    doctor: {
      displayName: 'Doctor',
      color: 'bg-purple-100 text-purple-800',
      description: 'Medical professional with advanced training'
    },
    ministry_official: {
      displayName: 'Ministry Official',
      color: 'bg-orange-100 text-orange-800',
      description: 'Government health department representative'
    },
    system_admin: {
      displayName: 'System Administrator',
      color: 'bg-red-100 text-red-800',
      description: 'Manages system operations and user access'
    }
  };
  return configs[role as keyof typeof configs] || {
    displayName: role,
    color: 'bg-gray-100 text-gray-800',
    description: 'User role'
  };
};

const ViewUserModal: React.FC<ViewUserModalProps> = ({ isOpen, onClose, user }) => {
  if (!isOpen) return null;

  const roleConfig = getRoleConfig(user.role);

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not available';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center space-x-3">
            <User className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-semibold">User Profile</h2>
              <p className="text-blue-100">{user.firstName} {user.lastName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-5rem)]">
          <div className="p-6 space-y-6">
            {/* Basic Information Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <p className="text-gray-900">{user.firstName} {user.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <p className="text-gray-900">{user.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <p className="text-gray-900">{user.phoneNumber || 'Not provided'}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <p className="text-gray-900">{user.dateOfBirth || 'Not provided'}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <p className="text-gray-900 capitalize">{user.gender || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Role & Status Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                Role & Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleConfig.color}`}>
                      {roleConfig.displayName}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{roleConfig.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.status)}`}>
                    {user.status || 'Active'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Created</label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <p className="text-gray-900">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <p className="text-gray-900">{formatDate(user.lastLogin)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                Location Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <p className="text-gray-900">{user.region || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                  <p className="text-gray-900">{user.district || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facility</label>
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                    <p className="text-gray-900">{user.facility || 'Not specified'}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <p className="text-gray-900">{user.address || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            {(user.licenseNumber || user.specialization || user.yearsOfExperience || user.department) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                  Professional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.licenseNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                      <p className="text-gray-900">{user.licenseNumber}</p>
                    </div>
                  )}
                  {user.specialization && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                      <p className="text-gray-900">{user.specialization}</p>
                    </div>
                  )}
                  {user.yearsOfExperience && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                      <p className="text-gray-900">{user.yearsOfExperience} years</p>
                    </div>
                  )}
                  {user.department && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <p className="text-gray-900">{user.department}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                Security Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Multi-Factor Authentication</label>
                  <span className={`inline-flex px-2 py-1 rounded text-sm ${
                    user.mfaEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.mfaEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Verified</label>
                  <span className={`inline-flex px-2 py-1 rounded text-sm ${
                    user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.emailVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Locked</label>
                  <span className={`inline-flex px-2 py-1 rounded text-sm ${
                    user.isLocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {user.isLocked ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Failed Login Attempts</label>
                  <div className="flex items-center">
                    {user.failedLoginAttempts > 0 && (
                      <AlertTriangle className="h-4 w-4 mr-1 text-yellow-500" />
                    )}
                    <p className="text-gray-900">{user.failedLoginAttempts || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            {(user.notes || user.emergencyContact || user.alternativeEmail) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Additional Information
                </h3>
                <div className="space-y-4">
                  {user.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-gray-900 whitespace-pre-wrap">{user.notes}</p>
                      </div>
                    </div>
                  )}
                  {user.emergencyContact && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <p className="text-gray-900">{user.emergencyContact}</p>
                      </div>
                    </div>
                  )}
                  {user.alternativeEmail && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Alternative Email</label>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <p className="text-gray-900">{user.alternativeEmail}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewUserModal;
