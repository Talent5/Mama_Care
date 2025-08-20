import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  Mail,
  MapPin,
  Building,
  RefreshCw
} from 'lucide-react';
import { UserRole, User } from '../../types/auth';
import { getRoleConfig } from '../../types/roles';
import { useRoleAccess } from '../../hooks/useRoleAccess';
import { useAuth } from '../../hooks/useAuth';
import PermissionGuard from '../common/PermissionGuard';
import CreateUserModal from './CreateUserModal';
import UserDetailsModal from './UserDetailsModal';
import EditUserModal from './EditUserModal';
import { userManagementAPI } from '../../services/api';

interface UserData {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: UserRole;
  facility?: string;
  region?: string;
  department?: string;
  specialization?: string;
  isActive?: boolean;
  createdAt: string;
  lastLogin?: string;
  createdBy?: string;
}

const UserManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { canManageUsers, isSystemAdmin } = useRoleAccess();
  const { user } = useAuth();

  // Check for user ID in URL parameters
  useEffect(() => {
    const userId = searchParams.get('id');
    if (userId && users.length > 0) {
      // Find the user with the specified ID
      const foundUser = users.find(u => u.id === userId || u._id === userId);
      if (foundUser) {
        setSelectedUser(foundUser);
        setShowDetailsModal(true);
        // Remove the ID from URL to clean it up
        setSearchParams({});
      }
    }
  }, [searchParams, users, setSearchParams]);

  // Debug logging
  useEffect(() => {
    console.log('🔍 UserManagement Debug Info:');
    console.log('- Current user:', user);
    console.log('- User role:', user?.role);
    console.log('- canManageUsers():', canManageUsers());
    console.log('- isSystemAdmin:', isSystemAdmin);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, user?.id]); // Only depend on stable user properties to avoid infinite loops

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      console.log('📡 Fetching users from API...');
      const response = await userManagementAPI.getAllUsers();
      console.log('📥 API Response:', response);
      
      if (response.success && response.data) {
        // The response.data contains the paginated response
        const responseData = response.data as unknown as { users: UserData[] };
        const usersData = responseData.users || [];
        
        // Transform users to match expected format
        const transformedUsers = usersData.map((user: UserData) => ({
          id: user._id || user.id || '',
          name: user.fullName || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          facility: user.facility,
          region: user.region,
          department: user.department,
          specialization: user.specialization,
          isActive: user.isActive !== false, // Default to true if not specified
          createdAt: new Date(user.createdAt),
          lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
          createdBy: user.createdBy
        })).filter((user: { id: string; email: string }) => user.id && user.email); // Filter out any users without IDs or email
        
        console.log('✅ Transformed users:', transformedUsers);
        setUsers(transformedUsers);
        setError(null);
      } else {
        console.error('❌ Failed to fetch users - invalid response:', response);
        setError('Failed to fetch users');
      }
    } catch (error) {
      console.error('💥 Error fetching users:', error);
      setError('Failed to fetch users. Please try again.');
    }
  }, []); // Remove dependencies to prevent infinite loops

  // Initialize data on component mount
  useEffect(() => {
    let mounted = true;

    const initializeData = async () => {
      // Check permissions inline to avoid dependency issues
      const hasPermission = canManageUsers();
      
      if (!mounted || !hasPermission) {
        if (mounted) setLoading(false);
        return;
      }
      
      console.log('🚀 Initializing user data...');
      setLoading(true);
      
      try {
        console.log('📡 Fetching users from API...');
        const response = await userManagementAPI.getAllUsers();
        console.log('📥 API Response:', response);
        
        if (response.success && response.data && mounted) {
          // The response.data contains the paginated response
          const responseData = response.data as unknown as { users: UserData[] };
          const usersData = responseData.users || [];
          
          // Transform users to match expected format
          const transformedUsers = usersData.map((user: UserData) => ({
            id: user._id || user.id || '',
            name: user.fullName || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            facility: user.facility,
            region: user.region,
            department: user.department,
            specialization: user.specialization,
            isActive: user.isActive !== false, // Default to true if not specified
            createdAt: new Date(user.createdAt),
            lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
            createdBy: user.createdBy
          })).filter((user: { id: string; email: string }) => user.id && user.email);
          
          console.log('✅ Transformed users:', transformedUsers);
          setUsers(transformedUsers);
          setError(null);
        } else if (mounted) {
          console.error('❌ Failed to fetch users - invalid response:', response);
          setError('Failed to fetch users');
        }
      } catch (error) {
        if (mounted) {
          console.error('💥 Error fetching users:', error);
          setError('Failed to fetch users. Please try again.');
        }
      }
      
      if (mounted) {
        setLoading(false);
      }
    };

    // Only initialize if we have a user
    if (user?.role) {
      initializeData();
    } else {
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]); // Only depend on user role - canManageUsers checked inline to avoid loops

  // Handle refresh
  const handleRefresh = async () => {
    if (!canManageUsers()) return;
    
    setRefreshing(true);
    try {
      console.log('🔄 Refreshing users...');
      const response = await userManagementAPI.getAllUsers();
      
      if (response.success && response.data) {
        const responseData = response.data as unknown as { users: UserData[] };
        const usersData = responseData.users || [];
        
        const transformedUsers = usersData.map((user: UserData) => ({
          id: user._id || user.id || '',
          name: user.fullName || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          facility: user.facility,
          region: user.region,
          department: user.department,
          specialization: user.specialization,
          isActive: user.isActive !== false,
          createdAt: new Date(user.createdAt),
          lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
          createdBy: user.createdBy
        })).filter((user: { id: string; email: string }) => user.id && user.email);
        
        setUsers(transformedUsers);
        setError(null);
      } else {
        setError('Failed to refresh users');
      }
    } catch (error) {
      console.error('💥 Error refreshing users:', error);
      setError('Failed to refresh users. Please try again.');
    }
    setRefreshing(false);
  };

  // Handle user creation success
  const handleUserCreated = async () => {
    setShowCreateModal(false);
    await fetchUsers(); // Refresh the user list
  };

  // Handle user update success
  const handleUserUpdated = async () => {
    setShowEditModal(false);
    await fetchUsers(); // Refresh the user list
  };

  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.facility?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const getUserStats = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const roleDistribution = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<UserRole, number>);

    return { totalUsers, activeUsers, roleDistribution };
  };

  const { totalUsers, activeUsers, roleDistribution } = getUserStats();

  const getRoleIcon = (role: UserRole) => {
    const config = getRoleConfig(role);
    return (
      <div 
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: config.color }}
      />
    );
  };

  const formatLastLogin = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return dateObj.toLocaleDateString();
  };

  const handleCreateUser = () => {
    setShowCreateModal(true);
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
    setShowActionMenu(null);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
    setShowActionMenu(null);
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?\n\nThis action cannot be undone.`)) {
      try {
        console.log('🗑️ Deleting user:', user.id);
        const response = await userManagementAPI.deleteUser(user.id);
        
        if (response.success) {
          console.log('✅ User deleted successfully');
          await fetchUsers(); // Refresh the list
        } else {
          throw new Error(response.message || 'Failed to delete user');
        }
      } catch (error: unknown) {
        console.error('❌ Error deleting user:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
        alert(`Failed to delete user: ${errorMessage}`);
      }
    }
    setShowActionMenu(null);
  };

  const handleToggleUserStatus = async (user: User) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} ${user.name}?`)) {
      try {
        console.log(`🔄 Toggling user status for:`, user.id);
        const response = await userManagementAPI.toggleUserStatus(user.id);
        
        if (response.success) {
          console.log('✅ User status updated successfully');
          await fetchUsers(); // Refresh the list
        } else {
          throw new Error(response.message || 'Failed to update user status');
        }
      } catch (error: unknown) {
        console.error('❌ Error toggling user status:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update user status';
        alert(`Failed to ${action} user: ${errorMessage}`);
      }
    }
    setShowActionMenu(null);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (!canManageUsers()) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">
          <XCircle className="w-16 h-16 mx-auto" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to manage users.</p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Users</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 mx-auto"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Retrying...' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              User Management
            </h1>
            <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              title="Refresh user list"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            
            <PermissionGuard permission="create_users">
              <button
                onClick={handleCreateUser}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                Add New User
              </button>
            </PermissionGuard>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Users</p>
                <p className="text-2xl font-bold text-blue-900">{totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Active Users</p>
                <p className="text-2xl font-bold text-green-900">{activeUsers}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Doctors</p>
                <p className="text-2xl font-bold text-purple-900">{roleDistribution.doctor || 0}</p>
              </div>
              <div className="w-8 h-8 bg-purple-400 rounded-full"></div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Nurses</p>
                <p className="text-2xl font-bold text-orange-900">{roleDistribution.nurse || 0}</p>
              </div>
              <div className="w-8 h-8 bg-orange-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name, email, or facility..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole | 'all')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Roles</option>
                <option value="nurse">Nurses</option>
                <option value="doctor">Doctors</option>
                <option value="ministry_official">Ministry Officials</option>
                <option value="system_admin">System Admins</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facility
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const roleConfig = getRoleConfig(user.role);
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span className="text-sm font-medium" style={{ color: roleConfig.color }}>
                          {roleConfig.name}
                        </span>
                      </div>
                      {user.specialization && (
                        <div className="text-xs text-gray-500 mt-1">{user.specialization}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Building className="w-3 h-3 text-gray-400" />
                        {user.facility}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {user.region}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {user.lastLogin ? formatLastLogin(user.lastLogin) : 'Never'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {showActionMenu === user.id && (
                          <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <button
                              onClick={() => handleViewDetails(user)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                            <PermissionGuard permission="edit_users">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit User
                              </button>
                            </PermissionGuard>
                            <PermissionGuard permission="edit_users">
                              <button
                                onClick={() => handleToggleUserStatus(user)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                {user.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                {user.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </PermissionGuard>
                            <PermissionGuard permission="delete_users">
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete User
                              </button>
                            </PermissionGuard>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onUserCreated={handleUserCreated}
        />
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <UserDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          user={selectedUser}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          user={selectedUser}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
};

export default UserManagement;
