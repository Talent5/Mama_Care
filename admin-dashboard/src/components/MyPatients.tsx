import React, { useState, useEffect } from 'react';
import { Search, Heart, Calendar, Phone, Mail, MapPin, AlertTriangle, Clock, User } from 'lucide-react';
import { patientAssignmentAPI, patientsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface AssignedPatient {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  currentPregnancy?: {
    isPregnant: boolean;
    currentWeek?: number;
    riskLevel: string;
    estimatedDueDate?: string;
  };
  assignmentDate: string;
  assignmentReason?: string;
  lastVisit?: string;
  nextAppointment?: string;
  isActive: boolean;
}

interface MyPatientsResponse {
  patients: AssignedPatient[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}

const MyPatients: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<AssignedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    riskLevel: '',
    isActive: 'true',
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  });
  const [selectedPatient, setSelectedPatient] = useState<AssignedPatient | null>(null);

  const loadMyPatients = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.current.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.riskLevel && { riskLevel: filters.riskLevel }),
        ...(filters.isActive && { isActive: filters.isActive }),
      };
      
      // Determine which API to use based on user role
      if (user?.role === 'system_admin') {
        // System admin can see all app users
        const response = await patientAssignmentAPI.getAllAppUsers(params);
        if (response.success) {
          // Transform app users to match patient format
          const transformedPatients = response.data.users
            .filter((appUser: { hasPatientProfile: boolean }) => appUser.hasPatientProfile)
            .map((appUser: {
              id: string;
              firstName: string;
              lastName: string;
              email: string;
              phone?: string;
              avatar?: string;
              isActive: boolean;
              createdAt: string;
              patientInfo?: {
                id: string;
                isPregnant: boolean;
                currentWeek?: number;
                riskLevel: string;
                assignmentDate?: string;
              };
            }) => ({
              _id: appUser.patientInfo?.id || appUser.id,
              user: {
                _id: appUser.id,
                firstName: appUser.firstName,
                lastName: appUser.lastName,
                email: appUser.email,
                phone: appUser.phone,
                avatar: appUser.avatar
              },
              currentPregnancy: appUser.patientInfo ? {
                isPregnant: appUser.patientInfo.isPregnant,
                currentWeek: appUser.patientInfo.currentWeek,
                riskLevel: appUser.patientInfo.riskLevel,
              } : undefined,
              assignmentDate: appUser.patientInfo?.assignmentDate || appUser.createdAt,
              assignmentReason: 'System admin view',
              isActive: appUser.isActive
            }));
          setPatients(transformedPatients);
          setPagination(response.data.pagination);
        }
      } else if (user?.role === 'doctor' || user?.role === 'healthcare_provider') {
        // Healthcare providers see their assigned patients
        const response = await patientAssignmentAPI.getMyPatients(params);
        if (response.success) {
          setPatients(response.data.patients);
          setPagination(response.data.pagination);
        }
      } else {
        // For other roles, use the general patients API
        const response = await patientsAPI.getPatients(params);
        if (response.success) {
          setPatients(response.data || []);
          setPagination(prev => response.pagination || prev);
        }
      }

    } catch (err) {
      console.error('Error loading patients:', err);
      setError(err instanceof Error ? err.message : 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, [user?.role, pagination, searchTerm, filters.riskLevel, filters.isActive]);

  useEffect(() => {
    loadMyPatients();
  }, [loadMyPatients]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high':
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Clock className="h-4 w-4" />;
      case 'low':
      default:
        return <Heart className="h-4 w-4" />;
    }
  };

  const calculateDaysUntilDue = (dueDateString: string) => {
    const dueDate = new Date(dueDateString);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading patients</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={loadMyPatients}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Patients</h1>
          <p className="mt-2 text-sm text-gray-600">
            Patients assigned to your care ({pagination.total} total)
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search patients by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filters.riskLevel}
              onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Risk Levels</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
              <option value="Critical">Critical</option>
            </select>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patients Grid */}
      {patients.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No patients assigned</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any patients assigned to your care yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <div key={patient._id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Patient Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-lg font-medium text-blue-600">
                        {patient.user.firstName[0]}{patient.user.lastName[0]}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {patient.user.firstName} {patient.user.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      Assigned: {formatDate(patient.assignmentDate)}
                    </p>
                  </div>
                </div>

                {/* Pregnancy Status */}
                {patient.currentPregnancy?.isPregnant && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Week {patient.currentPregnancy.currentWeek || 'Unknown'}
                      </span>
                      <div className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskLevelColor(patient.currentPregnancy.riskLevel)}`}>
                        {getRiskIcon(patient.currentPregnancy.riskLevel)}
                        <span>{patient.currentPregnancy.riskLevel} Risk</span>
                      </div>
                    </div>
                    
                    {patient.currentPregnancy.estimatedDueDate && (
                      <div className="bg-gray-50 rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Due Date:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatDate(patient.currentPregnancy.estimatedDueDate)}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="text-xs text-gray-500">
                            {calculateDaysUntilDue(patient.currentPregnancy.estimatedDueDate)} days remaining
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Contact Information */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="truncate">{patient.user.email}</span>
                  </div>
                  {patient.user.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{patient.user.phone}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedPatient(patient)}
                    className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    View Details
                  </button>
                  <button className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2 px-3 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                    Schedule Visit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPagination(prev => ({ ...prev, current: Math.max(1, prev.current - 1) }))}
              disabled={pagination.current === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, current: Math.min(prev.pages, prev.current + 1) }))}
              disabled={pagination.current === pagination.pages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((pagination.current - 1) * pagination.limit) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.current * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> patients
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, current: Math.max(1, prev.current - 1) }))}
                  disabled={pagination.current === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setPagination(prev => ({ ...prev, current: page }))}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pagination.current === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPagination(prev => ({ ...prev, current: Math.min(prev.pages, prev.current + 1) }))}
                  disabled={pagination.current === pagination.pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setSelectedPatient(null)}></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Patient Details
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Patient Information</h4>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Name:</span>
                            <span className="text-sm font-medium">{selectedPatient.user.firstName} {selectedPatient.user.lastName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Email:</span>
                            <span className="text-sm font-medium">{selectedPatient.user.email}</span>
                          </div>
                          {selectedPatient.user.phone && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Phone:</span>
                              <span className="text-sm font-medium">{selectedPatient.user.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedPatient.currentPregnancy?.isPregnant && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Pregnancy Information</h4>
                          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Current Week:</span>
                              <span className="text-sm font-medium">{selectedPatient.currentPregnancy.currentWeek || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Risk Level:</span>
                              <span className={`text-sm font-medium px-2 py-1 rounded-full ${getRiskLevelColor(selectedPatient.currentPregnancy.riskLevel)}`}>
                                {selectedPatient.currentPregnancy.riskLevel}
                              </span>
                            </div>
                            {selectedPatient.currentPregnancy.estimatedDueDate && (
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Due Date:</span>
                                <span className="text-sm font-medium">{formatDate(selectedPatient.currentPregnancy.estimatedDueDate)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Assignment Information</h4>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Assigned Date:</span>
                            <span className="text-sm font-medium">{formatDate(selectedPatient.assignmentDate)}</span>
                          </div>
                          {selectedPatient.assignmentReason && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Reason:</span>
                              <span className="text-sm font-medium">{selectedPatient.assignmentReason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setSelectedPatient(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPatients;
