import React from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Calendar, 
  Shield, 
  CheckCircle, 
  XCircle,
  Briefcase
} from 'lucide-react';
import { User as UserType } from '../../types/auth';
import { getRoleConfig } from '../../types/roles';
import Avatar from '../common/Avatar';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ isOpen, onClose, user }) => {
  if (!isOpen) return null;

  const roleConfig = getRoleConfig(user.role);

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600" />
            User Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Avatar and Basic Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Avatar
              src={user.avatar}
              name={user.name}
              size="xl"
              className="border-4 border-white shadow-lg"
            />
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">{user.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: roleConfig.color }}
                />
                <span className="text-lg font-medium" style={{ color: roleConfig.color }}>
                  {roleConfig.name}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  user.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-1" />
                      Inactive
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Contact Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-gray-900">{user.email}</p>
                </div>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone</p>
                    <p className="text-gray-900">{user.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Work Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Work Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.facility && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Facility</p>
                    <p className="text-gray-900">{user.facility}</p>
                  </div>
                </div>
              )}
              {user.region && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Region</p>
                    <p className="text-gray-900">{user.region}</p>
                  </div>
                </div>
              )}
              {user.department && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Department</p>
                    <p className="text-gray-900">{user.department}</p>
                  </div>
                </div>
              )}
              {user.specialization && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Specialization</p>
                    <p className="text-gray-900">{user.specialization}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Account Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Created</p>
                  <p className="text-gray-900">{formatDate(user.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Last Login</p>
                  <p className="text-gray-900">{formatDate(user.lastLogin)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Role & Permissions */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Role & Permissions
            </h4>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: roleConfig.color }}
                />
                <span className="text-lg font-medium" style={{ color: roleConfig.color }}>
                  {roleConfig.name}
                </span>
              </div>
              <p className="text-gray-600 text-sm">{roleConfig.description}</p>
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Key Permissions:</p>
                <div className="flex flex-wrap gap-2">
                  {roleConfig.permissions.slice(0, 5).map((permission) => (
                    <span 
                      key={permission}
                      className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600"
                    >
                      {permission.replace('_', ' ').toUpperCase()}
                    </span>
                  ))}
                  {roleConfig.permissions.length > 5 && (
                    <span className="px-2 py-1 bg-gray-200 rounded text-xs text-gray-500">
                      +{roleConfig.permissions.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
