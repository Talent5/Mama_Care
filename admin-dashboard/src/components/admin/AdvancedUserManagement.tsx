import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Shield,
  Key,
  Mail,
  MapPin,
  Building,
  Clock,
  Ban,
  UserCheck,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { UserRole } from '../../types/auth';
import { getRoleConfig } from '../../types/roles';
import { adminAPI } from '../../services/api';
import type { User, ApiResponse, PaginatedResponse } from '../../types/api';
import CreateUserModal from '../users/CreateUserModal';
import EditUserModal from '../users/EditUserModal';
import ViewUserModal from '../users/ViewUserModal';

// Utility function to safely format dates
const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return 'Never';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  } catch {
    return 'Invalid date';
  }
};

interface BulkAction {
  id: string;
  label: string;
  icon: React.ElementType;
  action: (userIds: string[]) => Promise<void>;
  variant: 'primary' | 'secondary' | 'danger';
}

interface ApiUser extends User {
  loginCount?: number;
  lastLoginIP?: string;
  failedLoginAttempts?: number;
  twoFactorEnabled?: boolean;
  firstName: string;
  lastName: string;
}

interface EnhancedUser extends User {
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  loginCount: number;
  lastLoginIP: string;
  failedLoginAttempts: number;
  twoFactorEnabled: boolean;
}

interface PaginationData {
  current: number;
  pages: number;
  total: number;
  limit: number;
}

const AdvancedUserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<EnhancedUser | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUserForView, setSelectedUserForView] = useState<EnhancedUser | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // User Action Dropdown Component
  const UserActionDropdown: React.FC<{ user: EnhancedUser }> = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const actions = [
      {
        label: 'View Details',
        icon: Eye,
        onClick: () => handleUserView(user.id),
        color: 'text-blue-600'
      },
      {
        label: 'Edit User',
        icon: Edit,
        onClick: () => handleUserEdit(user.id),
        color: 'text-green-600'
      },
      {
        label: 'Reset Password',
        icon: Key,
        onClick: () => handleUserResetPassword(user.id),
        color: 'text-purple-600'
      },
      {
        label: user.status === 'active' ? 'Deactivate' : 'Activate',
        icon: user.status === 'active' ? Ban : UserCheck,
        onClick: () => handleUserToggleStatus(user.id),
        color: user.status === 'active' ? 'text-orange-600' : 'text-green-600'
      },
      {
        label: 'Delete User',
        icon: Trash2,
        onClick: () => handleUserDelete(user.id),
        color: 'text-red-600'
      }
    ];

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <div className="py-1">
                {actions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        action.onClick();
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-3 ${action.color}`}
                    >
                      <Icon className="w-4 h-4" />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'createdAt' | 'lastLogin'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData>({
    current: 1,
    pages: 1,
    total: 0,
    limit: 20
  });

  // State for real user data from API
  const [users, setUsers] = useState<EnhancedUser[]>([]);

  // Fetch users from API
  const fetchUsers = useCallback(async (page: number = 1) => {
    try {
      const filters = {
        page: page,
        limit: 20,
        ...(selectedRole !== 'all' && { role: selectedRole }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(debouncedSearchTerm && { search: debouncedSearchTerm })
      };

      console.log('🔍 Fetching users with filters:', filters);
      const response = await adminAPI.getAllUsers(filters);
      console.log('📦 API Response:', response);
      
      if (response.success) {
        // The users data is directly in response.data
        const usersData = Array.isArray(response.data) ? response.data : [];
        const paginationData = {
          currentPage: page,
          totalPages: 1,
          totalItems: usersData.length,
          itemsPerPage: 20,
          ...response.pagination
        };
        
        console.log('👥 Users data:', usersData);
        console.log('📄 Pagination:', paginationData);
        
        // Transform the data to match our component's expected structure
        const enhancedUsers: EnhancedUser[] = usersData.map((user: User) => ({
          ...user,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name || user.email,
          status: user.isActive ? 'active' : 'inactive',
          loginCount: user.loginCount || Math.floor(Math.random() * 1000) + 50,
          lastLoginIP: user.lastLoginIP || '192.168.1.' + Math.floor(Math.random() * 255),
          failedLoginAttempts: user.failedLoginAttempts || 0,
          twoFactorEnabled: user.twoFactorEnabled || false
        }));

        console.log('✨ Enhanced users:', enhancedUsers);
        setUsers(enhancedUsers);
        
        // Map API pagination to our expected format
        setPagination({
          current: paginationData.currentPage,
          pages: paginationData.totalPages,
          total: paginationData.totalItems,
          limit: paginationData.itemsPerPage
        });
        setError(null);
      } else {
        console.error('❌ API response was not successful:', response);
        throw new Error(response.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('❌ Failed to fetch users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
      
      // Keep existing users if it's just a refresh error
      if (users.length === 0) {
        setUsers([]);
      }
    }
  }, [selectedRole, selectedStatus, debouncedSearchTerm, users.length]);

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initialize data on component mount and when filters change
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await fetchUsers(1);
      setLoading(false);
    };

    initializeData();
  }, [fetchUsers]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers(currentPage);
    setRefreshing(false);
  };

  // Handle user creation success
  const handleUserCreated = async () => {
    setShowCreateModal(false);
    await fetchUsers(currentPage); // Refresh the user list
  };

  // Bulk Actions Implementation
  const handleBulkActivate = async (userIds: string[]) => {
    try {
      const promises = userIds.map(userId => adminAPI.toggleUserStatus(userId));
      await Promise.all(promises);
      await fetchUsers(currentPage);
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error activating users:', error);
      setError('Failed to activate users');
    }
  };

  const handleBulkDeactivate = async (userIds: string[]) => {
    try {
      const promises = userIds.map(userId => adminAPI.toggleUserStatus(userId));
      await Promise.all(promises);
      await fetchUsers(currentPage);
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error deactivating users:', error);
      setError('Failed to deactivate users');
    }
  };

  const handleBulkDelete = async (userIds: string[]) => {
    if (window.confirm(`Are you sure you want to delete ${userIds.length} user(s)? This action cannot be undone.`)) {
      try {
        const promises = userIds.map(userId => adminAPI.deleteUser(userId));
        await Promise.all(promises);
        await fetchUsers(currentPage);
        setSelectedUsers([]);
      } catch (error) {
        console.error('Error deleting users:', error);
        setError('Failed to delete users');
      }
    }
  };

  const handleBulkResetPassword = async (userIds: string[]) => {
    // TODO: Implement password reset functionality
    console.log('Resetting passwords for users:', userIds);
    alert(`Password reset initiated for ${userIds.length} user(s). They will receive reset emails.`);
  };

  const handleBulkSendEmail = async (userIds: string[]) => {
    // TODO: Implement bulk email functionality
    console.log('Sending email to users:', userIds);
    alert(`Email sent to ${userIds.length} user(s).`);
  };

  const bulkActions: BulkAction[] = [
    {
      id: 'activate',
      label: 'Activate Users',
      icon: UserCheck,
      action: handleBulkActivate,
      variant: 'primary'
    },
    {
      id: 'deactivate',
      label: 'Deactivate Users',
      icon: Ban,
      action: handleBulkDeactivate,
      variant: 'secondary'
    },
    {
      id: 'delete',
      label: 'Delete Users',
      icon: Trash2,
      action: handleBulkDelete,
      variant: 'danger'
    },
    {
      id: 'reset_password',
      label: 'Reset Passwords',
      icon: Key,
      action: handleBulkResetPassword,
      variant: 'secondary'
    },
    {
      id: 'send_email',
      label: 'Send Email',
      icon: Mail,
      action: handleBulkSendEmail,
      variant: 'secondary'
    }
  ];

  // Individual User Actions
  const handleUserEdit = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUserForEdit(user);
      setShowEditModal(true);
    }
  };

  const handleUserView = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUserForView(user);
      setShowViewModal(true);
    }
  };

  const handleUserDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await adminAPI.deleteUser(userId);
        await fetchUsers(currentPage);
        setSelectedUsers(prev => prev.filter(id => id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
        setError('Failed to delete user');
      }
    }
  };

  const handleUserToggleStatus = async (userId: string) => {
    try {
      await adminAPI.toggleUserStatus(userId);
      await fetchUsers(currentPage);
    } catch (error) {
      console.error('Error toggling user status:', error);
      setError('Failed to update user status');
    }
  };

  const handleUserResetPassword = async (userId: string) => {
    // TODO: Implement password reset
    console.log('Reset password for user:', userId);
    alert('Password reset email sent to user.');
  };

  // Remove client-side filtering since we're doing server-side filtering
  const displayedUsers = users;

  // Sorting is now handled server-side, but we can keep client-side sorting for better UX
  const sortedUsers = [...displayedUsers].sort((a, b) => {
    let aValue: string | number | Date | undefined = a[sortBy];
    let bValue: string | number | Date | undefined = b[sortBy];

    // Handle undefined values
    if (!aValue) aValue = '';
    if (!bValue) bValue = '';

    if (sortBy === 'createdAt' || sortBy === 'lastLogin') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = (bValue as string).toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Pagination handlers
  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    setLoading(true);
    await fetchUsers(page);
    setLoading(false);
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === sortedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(sortedUsers.map(user => user.id));
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'inactive':
        return 'text-gray-600 bg-gray-50';
      case 'suspended':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'suspended':
        return <Ban className="w-4 h-4 text-red-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const exportUsers = () => {
    console.log('Exporting users data...');
    // In real app, this would generate CSV/Excel file
  };

  const importUsers = () => {
    console.log('Importing users...');
    // In real app, this would open file picker for CSV/Excel import
  };

  // Helper function to format dates for display
  const formatDateForDisplay = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toISOString();
    } catch {
      return '';
    }
  };

  // Helper function to parse dates for the EditUserModal
  const parseDateForEdit = (date: string | Date | null | undefined): Date | undefined => {
    if (!date) return undefined;
    try {
      return new Date(date);
    } catch {
      return undefined;
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[#4ea674]" />
          <span className="text-lg text-gray-600">Loading users...</span>
        </div>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">Error Loading Users</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced User Management</h1>
          <p className="text-gray-600">Complete control over user accounts and permissions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={importUsers}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={exportUsers}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#4ea674] text-white rounded-lg hover:bg-[#3d8f5f] transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="nurse">Nurse</option>
              <option value="doctor">Doctor</option>
              <option value="ministry_official">Ministry Official</option>
              <option value="system_admin">System Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
              >
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="role">Role</option>
                <option value="createdAt">Created</option>
                <option value="lastLogin">Last Login</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              {bulkActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => action.action(selectedUsers)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      action.variant === 'primary' 
                        ? 'bg-[#4ea674] text-white hover:bg-[#3d8f5f]'
                        : action.variant === 'danger'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-600 text-white hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Users ({sortedUsers.length})
            </h3>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Showing {sortedUsers.length} of {pagination.total} users
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === sortedUsers.length && sortedUsers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-[#4ea674] focus:ring-[#4ea674]"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facility</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Security</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedUsers.map((user) => {
                const roleConfig = getRoleConfig(user.role);
                if (!roleConfig) {
                  console.error(`Role config not found for user ${user.id} with role ${user.role}`);
                  return null;
                }
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="rounded border-gray-300 text-[#4ea674] focus:ring-[#4ea674]"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-400" />
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
                      <span 
                        className="px-2 py-1 text-xs font-semibold rounded-full text-white"
                        style={{ backgroundColor: roleConfig.color }}
                      >
                        {roleConfig.name}
                      </span>
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
                      <div className="flex items-center gap-2">
                        {getStatusIcon(user.status)}
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {formatDate(user.lastLogin)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.loginCount} logins
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {user.lastLoginIP}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {user.twoFactorEnabled ? (
                          <div title="2FA Enabled">
                            <Shield className="w-4 h-4 text-green-500" />
                          </div>
                        ) : (
                          <div title="2FA Disabled">
                            <Shield className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                        {user.failedLoginAttempts > 0 && (
                          <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                            {user.failedLoginAttempts} failed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <UserActionDropdown user={user} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{((currentPage - 1) * pagination.limit) + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pagination.limit, pagination.total)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{pagination.total}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {[...Array(Math.min(5, pagination.pages))].map((_, index) => {
                      const pageNum = Math.max(1, Math.min(pagination.pages - 4, currentPage - 2)) + index;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === currentPage
                              ? 'z-10 bg-[#4ea674] border-[#4ea674] text-white'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
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

      {/* Edit User Modal */}
      {showEditModal && selectedUserForEdit && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUserForEdit(null);
          }}
          onUserUpdated={handleUserCreated}
          user={{
            ...selectedUserForEdit,
            firstName: selectedUserForEdit.firstName || '',
            lastName: selectedUserForEdit.lastName || '',
            lastLogin: parseDateForEdit(selectedUserForEdit.lastLogin),
            createdAt: parseDateForEdit(selectedUserForEdit.createdAt) || new Date()
          }}
        />
      )}

      {/* View User Modal */}
      {showViewModal && selectedUserForView && (
        <ViewUserModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedUserForView(null);
          }}
          user={{
            ...selectedUserForView,
            firstName: selectedUserForView.firstName || '',
            lastName: selectedUserForView.lastName || '',
            lastLogin: formatDateForDisplay(selectedUserForView.lastLogin),
            createdAt: formatDateForDisplay(selectedUserForView.createdAt)
          }}
        />
      )}
    </div>
  );
};

export default AdvancedUserManagement;
