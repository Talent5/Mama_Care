import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  User, 
  Bell, 
  Shield, 
  Database, 
  Save,
  Eye,
  EyeOff,
  Loader,
  Camera
} from 'lucide-react';
import settingsService from '../../services/settingsService';
import { useToast } from '../../hooks/useToast';
import Avatar from '../common/Avatar';

const SettingsPanel: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'system'>('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [notificationSettings, setNotificationSettings] = useState<any>(null);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const { showToast } = useToast();

  // Handle navigation state to set active tab
  useEffect(() => {
    const state = location.state as { activeTab?: string } | null;
    if (state?.activeTab && ['profile', 'notifications', 'security', 'system'].includes(state.activeTab)) {
      setActiveTab(state.activeTab as 'profile' | 'notifications' | 'security' | 'system');
    }
  }, [location.state]);

  useEffect(() => {
    const loadTabData = async (tab: string) => {
      // Check if data already exists to avoid unnecessary requests
      const shouldLoad = (
        (tab === 'profile' && !profileData) ||
        (tab === 'notifications' && !notificationSettings) ||
        (tab === 'system' && !systemSettings)
      );

      if (!shouldLoad) return;

      setLoading(true);
      try {
        switch (tab) {
          case 'profile': {
            console.log('Loading profile data...');
            const profile = await settingsService.getProfile();
            console.log('Profile data received:', profile);
            setProfileData(profile.data || profile);
            break;
          }
          case 'notifications': {
            console.log('Loading notification settings...');
            const notifications = await settingsService.getNotificationSettings();
            console.log('Notification settings received:', notifications);
            setNotificationSettings(notifications.data || notifications);
            break;
          }
          case 'system': {
            console.log('Loading system settings...');
            const system = await settingsService.getSystemSettings();
            console.log('System settings received:', system);
            setSystemSettings(system.data || system);
            break;
          }
        }
      } catch (error) {
        console.error('Error loading settings for tab:', tab, error);
        showToast('Failed to load settings data', 'error');
      }
      setLoading(false);
    };

    loadTabData(activeTab);
  }, [activeTab, profileData, notificationSettings, systemSettings, showToast]); // Add data dependencies to prevent unnecessary loads

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData) return;
    
    setLoading(true);
    try {
      console.log('Updating profile with data:', profileData);
      const updatedProfile = await settingsService.updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone,
        role: profileData.role,
        facility: profileData.facility,
        region: profileData.region,
        specialization: profileData.specialization
      });
      console.log('Profile updated successfully:', updatedProfile);
      setProfileData(updatedProfile.data || updatedProfile);
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Error updating profile: ${errorMessage}`, 'error');
    }
    setLoading(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      showToast('File size should be less than 2MB', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await settingsService.uploadProfilePhoto(file);
      setProfileData({ ...profileData, photoUrl: result.photoUrl });
      showToast('Photo uploaded successfully', 'success');
    } catch (error) {
      showToast('Error uploading photo', 'error');
    }
    setLoading(false);
  };

  const handleNotificationToggle = async (type: string, subType: string) => {
    const updatedSettings = {
      ...notificationSettings,
      [type]: {
        ...notificationSettings[type],
        [subType]: !notificationSettings[type][subType]
      }
    };

    try {
      await settingsService.updateNotificationSettings(updatedSettings);
      setNotificationSettings(updatedSettings);
      showToast('Notification settings updated', 'success');
    } catch (error) {
      showToast('Error updating notification settings', 'error');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const currentPassword = (form.elements.namedItem('currentPassword') as HTMLInputElement).value;
    const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value;

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      await settingsService.changePassword({ currentPassword, newPassword });
      showToast('Password updated successfully', 'success');
      form.reset();
    } catch (error) {
      showToast('Error updating password', 'error');
    }
    setLoading(false);
  };

  const handleTwoFactorToggle = async () => {
    try {
      const result = await settingsService.toggleTwoFactor(!profileData?.twoFactorEnabled);
      setProfileData({ ...profileData, twoFactorEnabled: result.twoFactorEnabled });
      showToast('Two-factor authentication settings updated', 'success');
    } catch (error) {
      showToast('Error updating two-factor authentication', 'error');
    }
  };

  const handleSystemSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedSettings = await settingsService.updateSystemSettings(systemSettings);
      setSystemSettings(updatedSettings);
      showToast('System settings updated successfully', 'success');
    } catch (error) {
      showToast('Error updating system settings', 'error');
    }
    setLoading(false);
  };

  const handleExport = async (type: 'patients' | 'reports') => {
    setLoading(true);
    try {
      const data = type === 'patients' 
        ? await settingsService.exportPatientData()
        : await settingsService.exportReports();
      
      // Create blob and download
      const blob = new Blob([data], { type: type === 'patients' ? 'text/csv' : 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'patients' ? 'patients.csv' : 'reports.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showToast(`${type} data exported successfully`, 'success');
    } catch (error) {
      showToast(`Error exporting ${type} data`, 'error');
    }
    setLoading(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Database }
  ];

  const renderProfileSettings = () => (
    <form onSubmit={handleProfileUpdate} className="space-y-6">
      <div className="flex items-center gap-6">
        <div className="relative">
          <Avatar
            src={profileData?.photoUrl || profileData?.avatar}
            name={`${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim() || 'User'}
            size="xl"
            className="border-4 border-white shadow-lg"
          />
          <label 
            htmlFor="photo" 
            className="absolute bottom-0 right-0 bg-[#4ea674] text-white p-2 rounded-full cursor-pointer hover:bg-[#3d8b5e] transition-colors shadow-lg"
          >
            <Camera className="w-4 h-4" />
          </label>
        </div>
        <div>
          <input
            type="file"
            id="photo"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <label
            htmlFor="photo"
            className="px-4 py-2 bg-[#4ea674] text-white rounded-lg hover:bg-[#3d8f5f] transition-colors cursor-pointer inline-block"
          >
            Change Photo
          </label>
          <p className="text-sm text-gray-600 mt-1">JPG, PNG max 2MB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name
          </label>
          <input
            type="text"
            value={profileData?.firstName || ''}
            onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
            placeholder="Enter your first name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name
          </label>
          <input
            type="text"
            value={profileData?.lastName || ''}
            onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
            placeholder="Enter your last name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={profileData?.email || ''}
            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
            placeholder="Enter your email address"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={profileData?.phone || ''}
            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
            placeholder="Enter your phone number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specialization
          </label>
          <input
            type="text"
            value={profileData?.specialization || ''}
            onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
            placeholder="Enter your specialization"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <select 
            value={profileData?.role || ''}
            onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
          >
            <option value="">Select Role</option>
            <option value="healthcare_provider">Healthcare Provider</option>
            <option value="system_admin">Administrator</option>
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Facility
          </label>
          <select 
            value={profileData?.facility || ''}
            onChange={(e) => setProfileData({ ...profileData, facility: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
          >
            <option value="">Select Facility</option>
            <option>Harare Central Hospital</option>
            <option>Parirenyatwa Hospital</option>
            <option>Chitungwiza General Hospital</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Region
          </label>
          <select 
            value={profileData?.region || ''}
            onChange={(e) => setProfileData({ ...profileData, region: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
          >
            <option value="">Select Region</option>
            <option>Harare</option>
            <option>Bulawayo</option>
            <option>Gweru</option>
            <option>Mutare</option>
          </select>
        </div>
      </div>
    </form>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Email Notifications</h3>
        {[
          { id: 'highRiskAlerts', label: 'High-risk patient alerts' },
          { id: 'missedAppointments', label: 'Missed appointments' },
          { id: 'overdueVisits', label: 'Overdue visits' },
          { id: 'dailySummary', label: 'Daily summary reports' },
          { id: 'weeklyReports', label: 'Weekly performance reports' }
        ].map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">{item.label}</h4>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings?.emailNotifications?.[item.id] || false}
                onChange={() => handleNotificationToggle('emailNotifications', item.id)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4ea674]"></div>
            </label>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">SMS Notifications</h3>
        {[
          { id: 'emergencyAlerts', label: 'Emergency alerts' },
          { id: 'appointmentReminders', label: 'Appointment reminders' },
          { id: 'systemMaintenance', label: 'System maintenance notices' }
        ].map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">{item.label}</h4>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings?.smsNotifications?.[item.id] || false}
                onChange={() => handleNotificationToggle('smsNotifications', item.id)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4ea674]"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Password Settings</h3>
        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="currentPassword"
                required
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-[#4ea674] text-white rounded-lg hover:bg-[#3d8f5f] transition-colors"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">SMS Authentication</h4>
              <p className="text-sm text-gray-600">Receive verification codes via SMS</p>
            </div>
            <button
              onClick={handleTwoFactorToggle}
              className={`px-4 py-2 rounded-lg transition-colors ${
                profileData?.twoFactorEnabled
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-[#4ea674] text-white hover:bg-[#3d8f5f]'
              }`}
            >
              {profileData?.twoFactorEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Session Management</h3>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Active Sessions</h4>
              <p className="text-sm text-gray-600">Manage your active login sessions</p>
            </div>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              View Sessions
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <form onSubmit={handleSystemSettingsUpdate} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Language & Region</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={systemSettings?.language || 'English'}
              onChange={(e) => setSystemSettings({ ...systemSettings, language: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
            >
              <option>English</option>
              <option>Shona</option>
              <option>Ndebele</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Zone
            </label>
            <select
              value={systemSettings?.timezone || 'Africa/Harare'}
              onChange={(e) => setSystemSettings({ ...systemSettings, timezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
            >
              <option>Africa/Harare (CAT)</option>
              <option>UTC</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Data Export</h3>
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Export Patient Data</h4>
                <p className="text-sm text-gray-600">Download patient records in CSV format</p>
              </div>
              <button
                type="button"
                onClick={() => handleExport('patients')}
                className="px-4 py-2 bg-[#4ea674] text-white rounded-lg hover:bg-[#3d8f5f] transition-colors"
              >
                Export
              </button>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Export Reports</h4>
                <p className="text-sm text-gray-600">Download analytics reports in PDF format</p>
              </div>
              <button
                type="button"
                onClick={() => handleExport('reports')}
                className="px-4 py-2 bg-[#4ea674] text-white rounded-lg hover:bg-[#3d8f5f] transition-colors"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">System Information</h3>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Version:</span>
              <span className="ml-2 text-gray-600">MamaCare v2.1.0</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Last Updated:</span>
              <span className="ml-2 text-gray-600">January 10, 2025</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Database:</span>
              <span className="ml-2 text-gray-600">Connected</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Storage:</span>
              <span className="ml-2 text-gray-600">{systemSettings?.storageUsed || '0'} GB used</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-[#4ea674]" />
        </div>
      );
    }

    switch (activeTab) {
      case 'profile': return renderProfileSettings();
      case 'notifications': return renderNotificationSettings();
      case 'security': return renderSecuritySettings();
      case 'system': return renderSystemSettings();
      default: return renderProfileSettings();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and system configuration</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#4ea674] text-[#4ea674]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {renderTabContent()}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Last saved: {new Date().toLocaleTimeString()}
            </p>
            <button
              onClick={() => {
                switch (activeTab) {
                  case 'profile':
                    handleProfileUpdate(new Event('submit') as any);
                    break;
                  case 'system':
                    handleSystemSettingsUpdate(new Event('submit') as any);
                    break;
                }
              }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#4ea674] text-white rounded-lg hover:bg-[#3d8f5f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;