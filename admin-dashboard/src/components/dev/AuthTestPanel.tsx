import React, { useState } from 'react';
import { User, Key, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const AuthTestPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<any>(null);

  const loginAsSystemAdmin = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@mamacare.zw',
          password: 'Admin123!'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Map API user to local user type with proper role mapping (same as AuthContext)
      const mapRole = (apiRole: string) => {
        switch (apiRole.toLowerCase()) {
          case 'nurse':
          case 'healthcare_provider':
            return 'nurse';
          case 'doctor':
          case 'physician':
            return 'doctor';
          case 'ministry':
          case 'ministry_official':
          case 'government':
            return 'ministry_official';
          case 'admin':
          case 'system_admin':
          case 'super_admin':
            return 'system_admin';
          default:
            return 'nurse';
        }
      };

      const mappedUser = {
        id: data.user._id,
        email: data.user.email,
        name: `${data.user.firstName} ${data.user.lastName}`,
        role: mapRole(data.user.role),
        facility: data.user.facility || '',
        region: data.user.region || '',
        avatar: `https://ui-avatars.com/api/?name=${data.user.firstName}+${data.user.lastName}&background=ec4899&color=fff`
      };
      
      // Store the token and properly mapped user data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(mappedUser));
      
      setAuthStatus({
        success: true,
        user: mappedUser,
        token: data.token
      });
      
      alert('✅ Successfully logged in as system admin! Redirecting to dashboard...');
      
      // Refresh the page to update authentication state
      window.location.reload();
      
    } catch (error) {
      console.error('Failed to login:', error);
      setAuthStatus({
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      });
      alert(`❌ Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentAuth = () => {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    setAuthStatus({
      success: !!token,
      user,
      token: token ? '***' + token.slice(-10) : null
    });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setAuthStatus(null);
    alert('Logged out successfully');
    window.location.reload();
  };

  const testUserCreation = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `test-${Date.now()}@mamacare.zw`,
          firstName: 'Test',
          lastName: 'User',
          name: 'Test User',
          role: 'nurse',
          facility: 'Test Facility',
          region: 'Harare',
          department: 'Test Department',
          password: 'TestPassword123!'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      alert('✅ Test user created successfully!');
      console.log('Created user:', result);
      
    } catch (error) {
      console.error('Failed to create test user:', error);
      alert(`❌ Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-white shadow-lg rounded-lg border border-gray-200 p-4 max-w-sm z-50">
      <div className="flex items-center gap-2 mb-4">
        <Key className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Auth Test Panel</h3>
      </div>

      <div className="space-y-3">
        <button
          onClick={loginAsSystemAdmin}
          disabled={loading}
          className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
          Login as System Admin
        </button>

        <button
          onClick={checkCurrentAuth}
          className="w-full flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          Check Auth Status
        </button>

        <button
          onClick={testUserCreation}
          disabled={loading}
          className="w-full flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
          Test User Creation
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          Logout
        </button>
      </div>

      {authStatus && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
          <div className="flex items-center gap-2 mb-2">
            {authStatus.success ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
            <span className="font-medium">
              {authStatus.success ? 'Authenticated' : 'Not Authenticated'}
            </span>
          </div>
          
          {authStatus.user && (
            <div className="space-y-1 text-xs">
              <div><strong>Name:</strong> {authStatus.user.firstName} {authStatus.user.lastName}</div>
              <div><strong>Email:</strong> {authStatus.user.email}</div>
              <div><strong>Role:</strong> {authStatus.user.role}</div>
            </div>
          )}
          
          {authStatus.error && (
            <div className="text-red-600 text-xs mt-2">
              <strong>Error:</strong> {authStatus.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthTestPanel;
