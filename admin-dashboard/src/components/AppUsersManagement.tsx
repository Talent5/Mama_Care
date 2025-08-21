import React, { useState, useEffect } from 'react';
import { Search, Users, UserCheck, Calendar, Phone, Mail, MapPin, Filter, MoreHorizontal, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  hasPatientProfile: boolean;
  patientInfo?: {
    id: string;
    isPregnant: boolean;
    currentWeek?: number;
    riskLevel: string;
    assignedDoctor?: {
      id: string;
      name: string;
      email: string;
      specialization?: string;
    };
    assignmentDate?: string;
  };
}

interface AppUsersResponse {
  users: AppUser[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
  summary: {
    totalAppUsers: number;
    usersWithPatientProfiles: number;
    usersWithAssignedDoctors: number;
  };
}

const AppUsersManagement: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    hasPatientProfile: '',
    isActive: '',
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 20
  });
  const [summary, setSummary] = useState({
    totalAppUsers: 0,
    usersWithPatientProfiles: 0,
    usersWithAssignedDoctors: 0
  });
  
  interface Doctor {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    specialization?: string;
  }

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [assigningPatientId, setAssigningPatientId] = useState<string | null>(null);
  const [selectedDoctorByPatientId, setSelectedDoctorByPatientId] = useState<Record<string, string>>({});

  const loadAppUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.current.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filters.hasPatientProfile) params.append('hasPatientProfile', filters.hasPatientProfile);
      if (filters.isActive) params.append('isActive', filters.isActive);

      console.log('Loading app users with params:', params.toString());

      const response = await fetch(`${API_BASE_URL}/patients/assignment/all-app-users?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to view this data.');
        } else {
          throw new Error(`HTTP ${response.status}: Failed to load app users`);
        }
      }

      const data: { success: boolean; data: AppUsersResponse } = await response.json();
      console.log('API response data:', data);
      
      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
        setSummary(data.data.summary);
        console.log(`Loaded ${data.data.users.length} users`);
      } else {
        throw new Error('API returned success: false');
      }

    } catch (err) {
      console.error('Error loading app users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load app users');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/doctors`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load doctors');
      }

      interface DoctorResponse {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        specialization?: string;
      }

      const data: { success: boolean; data: { doctors: DoctorResponse[] } } = await response.json();
      const mappedDoctors: Doctor[] = (data.data?.doctors || []).map((d: DoctorResponse) => ({
        id: d._id,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        specialization: d.specialization
      }));
      setDoctors(mappedDoctors);
      console.log(`Loaded ${mappedDoctors.length} doctors`);
    } catch (err) {
      console.error('Error loading doctors:', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    console.log('Auth token available:', !!token);
    if (!token) {
      setError('No authentication token found. Please log in.');
      setLoading(false);
      return;
    }
    loadAppUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filters.hasPatientProfile, filters.isActive, pagination.current]);

  useEffect(() => {
    loadDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const assignDoctor = async (patientId: string, doctorId: string) => {
    if (!doctorId) {
      alert('Please select a doctor first');
      return;
    }

    try {
      setAssigningPatientId(patientId);
      console.log(`Assigning doctor ${doctorId} to patient ${patientId}`);
      
      const response = await fetch(`${API_BASE_URL}/patients/assignment/${patientId}/assign-doctor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doctorId,
          reason: 'Manual assignment from admin dashboard'
        })
      });

      const result = await response.json();
      console.log('Assignment result:', result);

      if (response.ok && result.success) {
        // Clear the selected doctor for this patient
        setSelectedDoctorByPatientId((prev) => {
          const updated = { ...prev };
          delete updated[patientId];
          return updated;
        });
        
        // Reload the users list to show updated assignment
        await loadAppUsers();
        
        // Show success message
        alert('Doctor assigned successfully!');
      } else {
        throw new Error(result.message || 'Failed to assign doctor');
      }
    } catch (error) {
      console.error('Error assigning doctor:', error);
      alert(`Failed to assign doctor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAssigningPatientId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
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
              <h3 className="text-sm font-medium text-red-800">Error loading app users</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={loadAppUsers}
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
          <h1 className="text-2xl font-bold text-gray-900">Mobile App Users</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage all patients using the MamaCare mobile application
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={loadAppUsers}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total App Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary.totalAppUsers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">With Patient Profiles</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary.usersWithPatientProfiles}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Assigned to Doctors</dt>
                  <dd className="text-lg font-medium text-gray-900">{summary.usersWithAssignedDoctors}</dd>
                </dl>
              </div>
            </div>
          </div>
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
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filters.hasPatientProfile}
              onChange={(e) => setFilters(prev => ({ ...prev, hasPatientProfile: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Users</option>
              <option value="true">With Patient Profile</option>
              <option value="false">Without Patient Profile</option>
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

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.firstName[0]}{user.lastName[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        {user.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.hasPatientProfile ? (
                      <div className="space-y-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Patient Profile
                        </span>
                        {user.patientInfo?.isPregnant && (
                          <div className="flex flex-wrap gap-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Pregnant ({user.patientInfo.currentWeek || 0}w)
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(user.patientInfo.riskLevel || 'low')}`}>
                              {(user.patientInfo.riskLevel || 'Low').charAt(0).toUpperCase() + (user.patientInfo.riskLevel || 'low').slice(1)} Risk
                            </span>
                          </div>
                        )}
                        {user.patientInfo && !user.patientInfo.isPregnant && (
                          <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Not Pregnant
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        No Profile
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.patientInfo?.assignedDoctor ? (
                      <div>
                        <div className="font-medium text-green-700">{user.patientInfo.assignedDoctor.name}</div>
                        <div className="text-gray-500 text-xs">
                          {user.patientInfo.assignedDoctor.specialization || 'General Practice'}
                        </div>
                        {user.patientInfo.assignmentDate && (
                          <div className="text-gray-400 text-xs">
                            Assigned: {formatDate(user.patientInfo.assignmentDate)}
                          </div>
                        )}
                      </div>
                    ) : user.hasPatientProfile ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedDoctorByPatientId[user.patientInfo!.id] || ''}
                          onChange={(e) =>
                            setSelectedDoctorByPatientId((prev) => ({
                              ...prev,
                              [user.patientInfo!.id]: e.target.value,
                            }))
                          }
                          className="px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm min-w-[150px]"
                          disabled={assigningPatientId === user.patientInfo!.id}
                        >
                          <option value="">Select doctor</option>
                          {doctors.map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.firstName} {doc.lastName} {doc.specialization ? `(${doc.specialization})` : ''}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => assignDoctor(user.patientInfo!.id, selectedDoctorByPatientId[user.patientInfo!.id])}
                          disabled={!selectedDoctorByPatientId[user.patientInfo!.id] || assigningPatientId === user.patientInfo!.id}
                          className={`px-3 py-1 rounded-md text-sm text-white whitespace-nowrap ${!selectedDoctorByPatientId[user.patientInfo!.id] || assigningPatientId === user.patientInfo!.id ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                          {assigningPatientId === user.patientInfo!.id ? 'Assigning...' : 'Assign'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No Patient Profile</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
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
                  of <span className="font-medium">{pagination.total}</span> results
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
      </div>
    </div>
  );
};

export default AppUsersManagement;
