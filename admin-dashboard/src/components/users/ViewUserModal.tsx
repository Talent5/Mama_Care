import React from 'react';
import { 
  X, 
  User, 
  Mail, 
  Building, 
  MapPin, 
  Users,
  Stethoscope,
  Shield,
  Calendar,
  Clock,
  Phone,
  UserCheck,
  Key,
  Globe
} from 'lucide-react';
import { UserRole } from '../../types/auth';
import { getRoleConfig } from '../../types/roles';

interface ViewUserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  facility?: string;
  region?: string;
  department?: string;
  specialization?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  licenseNumber?: string;
  nationalId?: string;
  status?: 'active' | 'inactive' | 'suspended';
  twoFactorEnabled?: boolean;
  lastLogin?: string;
  createdAt?: string;
  loginCount?: number;
  lastLoginIP?: string;
  failedLoginAttempts?: number;
}

interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ViewUserData | null;
}

const ViewUserModal: React.FC<ViewUserModalProps> = ({ isOpen, onClose, user }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
      suspended: { color: 'bg-red-100 text-red-800', label: 'Suspended' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
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

  if (!isOpen || !user) return null;

  const roleConfig = getRoleConfig(user.role);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                {getRoleIcon(user.role)}
                {roleConfig.name}
              </p>
            </div>
            {user.status && (
              <div className="ml-auto">
                {getStatusBadge(user.status)}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
                <p className="font-medium">{user.email}</p>
              </div>
              
              {user.phone && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Phone className="w-4 h-4" />
                    Phone
                  </div>
                  <p className="font-medium">{user.phone}</p>
                </div>
              )}
              
              {user.dateOfBirth && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    Date of Birth
                  </div>
                  <p className="font-medium">{formatDate(user.dateOfBirth)}</p>
                </div>
              )}
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <UserCheck className="w-4 h-4" />
                  Status
                </div>
                <div>{getStatusBadge(user.status)}</div>
              </div>
            </div>
            
            {user.address && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <MapPin className="w-4 h-4" />
                  Address
                </div>
                <p className="font-medium">{user.address}</p>
              </div>
            )}
          </div>

          {/* Professional Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              Professional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Shield className="w-4 h-4" />
                  Role
                </div>
                <p className="font-medium flex items-center gap-2">
                  {getRoleIcon(user.role)}
                  {roleConfig.name}
                </p>
              </div>
              
              {user.facility && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Building className="w-4 h-4" />
                    Facility
                  </div>
                  <p className="font-medium">{user.facility}</p>
                </div>
              )}
              
              {user.region && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <MapPin className="w-4 h-4" />
                    Region
                  </div>
                  <p className="font-medium">{user.region}</p>
                </div>
              )}
              
              {user.department && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Users className="w-4 h-4" />
                    Department
                  </div>
                  <p className="font-medium">{user.department}</p>
                </div>
              )}
              
              {user.specialization && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Stethoscope className="w-4 h-4" />
                    Specialization
                  </div>
                  <p className="font-medium">{user.specialization}</p>
                </div>
              )}
              
              {user.licenseNumber && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Key className="w-4 h-4" />
                    License Number
                  </div>
                  <p className="font-medium">{user.licenseNumber}</p>
                </div>
              )}
              
              {user.nationalId && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <User className="w-4 h-4" />
                    National ID
                  </div>
                  <p className="font-medium">{user.nationalId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Account & Security */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Account & Security
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  Account Created
                </div>
                <p className="font-medium">{formatDate(user.createdAt)}</p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  Last Login
                </div>
                <p className="font-medium">{formatDate(user.lastLogin)}</p>
              </div>
              
              {typeof user.loginCount !== 'undefined' && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <User className="w-4 h-4" />
                    Total Logins
                  </div>
                  <p className="font-medium">{user.loginCount}</p>
                </div>
              )}
              
              {user.lastLoginIP && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Globe className="w-4 h-4" />
                    Last IP Address
                  </div>
                  <p className="font-medium">{user.lastLoginIP}</p>
                </div>
              )}
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Shield className="w-4 h-4" />
                  Two-Factor Auth
                </div>
                <p className="font-medium">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.twoFactorEnabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </p>
              </div>
              
              {typeof user.failedLoginAttempts !== 'undefined' && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Key className="w-4 h-4" />
                    Failed Login Attempts
                  </div>
                  <p className="font-medium">{user.failedLoginAttempts}</p>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Contact */}
          {user.emergencyContact && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                Emergency Contact
              </h3>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{user.emergencyContact}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewUserModal;
