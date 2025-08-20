import api from './api';

const settingsService = {
  // Profile Settings
  getProfile: async () => {
    const response = await api.get('/settings/profile');
    return response.data;
  },

  updateProfile: async (profileData: any) => {
    const response = await api.put('/settings/profile', profileData);
    return response.data;
  },

  uploadProfilePhoto: async (photoFile: File) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    const response = await api.post('/settings/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Notification Settings
  getNotificationSettings: async () => {
    const response = await api.get('/settings/notifications');
    return response.data;
  },

  updateNotificationSettings: async (settings: any) => {
    const response = await api.put('/settings/notifications', settings);
    return response.data;
  },

  // Security Settings
  changePassword: async (passwords: { currentPassword: string; newPassword: string }) => {
    const response = await api.put('/settings/security/password', passwords);
    return response.data;
  },

  toggleTwoFactor: async (enabled: boolean) => {
    const response = await api.put('/settings/security/2fa', { enabled });
    return response.data;
  },

  // System Settings
  getSystemSettings: async () => {
    const response = await api.get('/settings/system');
    return response.data;
  },

  updateSystemSettings: async (settings: any) => {
    const response = await api.put('/settings/system', settings);
    return response.data;
  },

  // Data Export
  exportPatientData: async () => {
    const response = await api.get('/settings/export/patients', {
      responseType: 'blob'
    });
    return response.data;
  },

  exportReports: async () => {
    const response = await api.get('/settings/export/reports', {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default settingsService; 