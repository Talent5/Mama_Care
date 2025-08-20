import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  Switch,
} from 'react-native';
import { AuthStorage } from '../utils/databaseAuthStorage';
import ApiService from '../services/apiService';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AccountSettingsProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onLogout?: () => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({
  visible,
  onClose,
  onUpdate,
  onLogout,
}) => {
  const [notificationSettings, setNotificationSettings] = useState<any>(null);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [notifications, system] = await Promise.all([
          ApiService.getNotificationSettings(),
          ApiService.getSystemSettings(),
        ]);
        
        setNotificationSettings(notifications);
        setSystemSettings(system);
      } catch (error) {
        console.error('Error loading settings:', error);
        // Fallback to local storage if API fails
        loadLocalSettings();
      }
    };

    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadLocalSettings = async () => {
    try {
      const notifications = await AsyncStorage.getItem('settings_notifications');
      const biometrics = await AsyncStorage.getItem('settings_biometrics');
      const autoExport = await AsyncStorage.getItem('settings_auto_export');

      setNotificationSettings({
        pushNotifications: { generalUpdates: notifications !== 'false' },
        emailNotifications: { highRiskAlerts: true },
        smsNotifications: { emergencyAlerts: true },
      });
      setSystemSettings({
        privacy: { shareAnalytics: true },
        backup: { autoBackup: autoExport === 'true' },
        biometrics: { enabled: biometrics === 'true' },
      });
    } catch (error) {
      console.error('Error loading local settings:', error);
    }
  };

  const updateNotificationSetting = async (category: string, setting: string, value: boolean) => {
    try {
      const updatedSettings = {
        ...notificationSettings,
        [category]: {
          ...notificationSettings[category],
          [setting]: value,
        },
      };

      const result = await ApiService.updateNotificationSettings(updatedSettings);
      if (result.success) {
        setNotificationSettings(updatedSettings);
      } else {
        // Fallback to local storage
        await AsyncStorage.setItem(`settings_${category}_${setting}`, value.toString());
        setNotificationSettings(updatedSettings);
      }
    } catch (error) {
      console.error('Error updating notification setting:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const updateSystemSetting = async (category: string, setting: string, value: any) => {
    try {
      const updatedSettings = {
        ...systemSettings,
        [category]: {
          ...systemSettings[category],
          [setting]: value,
        },
      };

      const result = await ApiService.updateSystemSettings(updatedSettings);
      if (result.success) {
        setSystemSettings(updatedSettings);
      } else {
        // Fallback to local storage
        await AsyncStorage.setItem(`settings_${category}_${setting}`, value.toString());
        setSystemSettings(updatedSettings);
      }
    } catch (error) {
      console.error('Error updating system setting:', error);
      Alert.alert('Error', 'Failed to update system settings');
    }
  };

  const handleChangePIN = () => {
    Alert.alert(
      'Change PIN',
      'This will reset your current PIN. You will need to set up a new PIN.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync('user_pin');
              Alert.alert('Success', 'PIN has been reset. You will be prompted to set a new PIN next time you access your profile.');
              onUpdate();
            } catch (error) {
              console.error('Error resetting PIN:', error);
              Alert.alert('Error', 'Failed to reset PIN');
            }
          },
        },
      ]
    );
  };

  const handleClearMedicalRecords = () => {
    Alert.alert(
      'Clear Medical Records',
      'This will permanently delete all your medical records. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const currentUser = await AuthStorage.getCurrentUser();
              if (currentUser) {
                const recordsKey = `medical_records_${currentUser.phone || currentUser.email}`;
                await AsyncStorage.removeItem(recordsKey);
                Alert.alert('Success', 'All medical records have been deleted.');
                onUpdate();
              }
            } catch (error) {
              console.error('Error clearing records:', error);
              Alert.alert('Error', 'Failed to clear medical records');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Your account and all data will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: deleteAccount,
                },
              ]
            );
          },
        },
      ]
    );
  };

  const deleteAccount = async () => {
    try {
      setIsLoading(true);
      
      // Try to delete account through API
      try {
        // For now, we'll use an empty password - in production this should prompt for password
        const result = await ApiService.deleteAccount('');
        if (result.success) {
          Alert.alert('Account Deleted', 'Your account has been permanently deleted from our servers.', [
            {
              text: 'OK',
              onPress: () => {
                onClose();
                if (onLogout) {
                  onLogout();
                }
              },
            },
          ]);
          return;
        }
      } catch (apiError) {
        console.error('API delete failed, falling back to local cleanup:', apiError);
      }

      // Fallback: Clean up local data
      const currentUser = await AuthStorage.getCurrentUser();
      if (!currentUser) return;

      // Clear all local data related to this user
      const recordsKey = `medical_records_${currentUser.phone || currentUser.email}`;
      await AsyncStorage.removeItem(recordsKey);
      
      // Clear all settings
      await AsyncStorage.removeItem('settings_notifications');
      await AsyncStorage.removeItem('settings_biometrics');
      await AsyncStorage.removeItem('settings_auto_export');
      
      // Logout and clear PIN
      await AuthStorage.logout();
      await SecureStore.deleteItemAsync('user_pin');

      Alert.alert('Account Deleted', 'Your local account data has been permanently deleted.', [
        {
          text: 'OK',
          onPress: () => {
            onClose();
            if (onLogout) {
              onLogout();
            }
          },
        },
      ]);
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'Failed to delete account');
    } finally {
      setIsLoading(false);
    }
  };

  const exportAllData = async () => {
    try {
      setIsLoading(true);
      const result = await ApiService.exportMedicalRecords();
      
      if (result.success) {
        Alert.alert(
          'Data Export Complete',
          'Your medical records and personal data have been exported successfully.',
          [{ text: 'OK' }]
        );
      } else {
        // Fallback to local export
        const currentUser = await AuthStorage.getCurrentUser();
        const medicalRecords = await AuthStorage.getMedicalRecords();
        
        const exportData = {
          user: currentUser,
          medicalRecords: medicalRecords,
          exportDate: new Date().toISOString(),
          version: '1.0.0',
        };

        console.log('Export data prepared:', exportData);

        Alert.alert(
          'Data Export',
          `Export contains:\n• Personal information\n• ${medicalRecords.length} medical records\n• Account settings\n\nIn a production app, this would be saved to a file or shared via email.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setIsLoading(false);
    }
  };

  const settingsSections = [
    {
      title: 'Privacy & Security',
      items: [
        {
          type: 'action' as const,
          icon: '🔒',
          title: 'Change PIN',
          subtitle: 'Update your security PIN',
          onPress: handleChangePIN,
        },
        {
          type: 'toggle' as const,
          icon: '🔐',
          title: 'Biometric Authentication',
          subtitle: 'Use fingerprint or face ID',
          value: systemSettings?.biometrics?.enabled || false,
          onToggle: (value: boolean) => {
            updateSystemSetting('biometrics', 'enabled', value);
          },
        },
        {
          type: 'toggle' as const,
          icon: '🛡️',
          title: 'Share Analytics',
          subtitle: 'Help improve the app',
          value: systemSettings?.privacy?.shareAnalytics || false,
          onToggle: (value: boolean) => {
            updateSystemSetting('privacy', 'shareAnalytics', value);
          },
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          type: 'toggle' as const,
          icon: '🔔',
          title: 'Push Notifications',
          subtitle: 'Receive general app notifications',
          value: notificationSettings?.pushNotifications?.generalUpdates || false,
          onToggle: (value: boolean) => {
            updateNotificationSetting('pushNotifications', 'generalUpdates', value);
          },
        },
        {
          type: 'toggle' as const,
          icon: '📧',
          title: 'Email Alerts',
          subtitle: 'Receive high risk health alerts',
          value: notificationSettings?.emailNotifications?.highRiskAlerts || false,
          onToggle: (value: boolean) => {
            updateNotificationSetting('emailNotifications', 'highRiskAlerts', value);
          },
        },
        {
          type: 'toggle' as const,
          icon: '📱',
          title: 'SMS Alerts',
          subtitle: 'Emergency notifications via SMS',
          value: notificationSettings?.smsNotifications?.emergencyAlerts || false,
          onToggle: (value: boolean) => {
            updateNotificationSetting('smsNotifications', 'emergencyAlerts', value);
          },
        },
      ],
    },
    {
      title: 'Data Management',
      items: [
        {
          type: 'toggle' as const,
          icon: '📤',
          title: 'Auto Backup',
          subtitle: 'Automatically backup data',
          value: systemSettings?.backup?.autoBackup || false,
          onToggle: (value: boolean) => {
            updateSystemSetting('backup', 'autoBackup', value);
          },
        },
        {
          type: 'action' as const,
          icon: '💾',
          title: 'Export All Data',
          subtitle: 'Download all your data',
          onPress: exportAllData,
        },
        {
          type: 'action' as const,
          icon: '🗑️',
          title: 'Clear Medical Records',
          subtitle: 'Delete all medical records',
          onPress: handleClearMedicalRecords,
          destructive: true,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          type: 'action' as const,
          icon: '❌',
          title: 'Delete Account',
          subtitle: 'Permanently delete your account',
          onPress: handleDeleteAccount,
          destructive: true,
        },
      ],
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {settingsSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionContent}>
                {section.items.map((item, itemIndex) => (
                  <View
                    key={itemIndex}
                    style={[
                      styles.settingItem,
                      itemIndex === section.items.length - 1 && styles.lastItem,
                      (item as any).destructive && styles.destructiveItem,
                    ]}
                  >
                    <View style={styles.settingIcon}>
                      <Text style={styles.iconText}>{item.icon}</Text>
                    </View>
                    <View style={styles.settingContent}>
                      <Text style={[
                        styles.settingTitle,
                        (item as any).destructive && styles.destructiveText,
                      ]}>
                        {item.title}
                      </Text>
                      <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                    </View>
                    
                    {item.type === 'toggle' ? (
                      <Switch
                        value={item.value}
                        onValueChange={item.onToggle}
                        trackColor={{ false: '#e0e0e0', true: '#c0e6b9' }}
                        thumbColor={item.value ? '#4ea674' : '#f4f3f4'}
                      />
                    ) : (
                      <TouchableOpacity
                        onPress={item.onPress}
                        disabled={isLoading}
                        style={styles.actionButton}
                      >
                        <Text style={styles.arrow}>›</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6c757d',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#023337',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  destructiveItem: {
    backgroundColor: '#fff5f5',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#023337',
    marginBottom: 2,
  },
  destructiveText: {
    color: '#dc3545',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  actionButton: {
    padding: 8,
  },
  arrow: {
    fontSize: 20,
    color: '#ced4da',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default AccountSettings;
