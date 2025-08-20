import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Alert,
} from 'react-native';
import LanguageSelector from './LanguageSelector';
import ApiService from '../services/apiService';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout?: () => void;
}

export default function SettingsModal({ visible, onClose, onLogout }: SettingsModalProps) {
  const { i18n } = useTranslation();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<any>(null);
  const [systemSettings, setSystemSettings] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

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
    }
  };

  const updateNotificationSetting = async (category: string, setting: string, value: boolean) => {
    try {
      if (!notificationSettings) {
        console.error('Notification settings not loaded');
        return;
      }

      const currentCategory = notificationSettings[category] || {};
      const updatedSettings = {
        ...notificationSettings,
        [category]: {
          ...currentCategory,
          [setting]: value,
        },
      };

      const result = await ApiService.updateNotificationSettings(updatedSettings);
      if (result.success) {
        setNotificationSettings(updatedSettings);
      } else {
        Alert.alert('Error', result.error || 'Failed to update notification settings');
      }
    } catch (error) {
      console.error('Error updating notification setting:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const updateSystemSetting = async (setting: string, value: any) => {
    try {
      if (!systemSettings) {
        console.error('System settings not loaded');
        return;
      }

      const updatedSettings = {
        ...systemSettings,
        [setting]: value,
      };

      const result = await ApiService.updateSystemSettings(updatedSettings);
      if (result.success) {
        setSystemSettings(updatedSettings);
      } else {
        Alert.alert('Error', result.error || 'Failed to update system settings');
      }
    } catch (error) {
      console.error('Error updating system setting:', error);
      Alert.alert('Error', 'Failed to update system settings');
    }
  };

  const getCurrentLanguageName = () => {
    const languages = {
      en: 'English',
      sn: 'ChiShona',
      nd: 'IsiNdebele',
    };
    return languages[i18n.language as keyof typeof languages] || 'English';
  };

  const getCurrentLanguageFlag = () => {
    const flags = {
      en: '🇬🇧',
      sn: '🇿🇼',
      nd: '🇿🇼',
    };
    return flags[i18n.language as keyof typeof flags] || '🇬🇧';
  };

  const handleLanguageChange = async (languageCode: string) => {
    console.log('Language changed to:', languageCode);
    await updateSystemSetting('language', languageCode);
  };

  const handleExportData = async () => {
    try {
      const result = await ApiService.exportMedicalRecords();
      if (result.success) {
        Alert.alert('Success', 'Medical records exported successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to export data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const settingsSections = [
    {
      title: 'Preferences',
      items: [
        {
          icon: '🌍',
          title: 'Language',
          subtitle: `${getCurrentLanguageFlag()} ${getCurrentLanguageName()}`,
          onPress: () => setShowLanguageSelector(true),
          showArrow: true,
        },
        {
          icon: '🎨',
          title: 'Theme',
          subtitle: systemSettings?.theme === 'dark' ? 'Dark Mode' : 'Light Mode',
          onPress: () => {
            const newTheme = systemSettings?.theme === 'dark' ? 'light' : 'dark';
            updateSystemSetting('theme', newTheme);
          },
          showArrow: false,
          renderSwitch: () => (
            <Switch
              value={systemSettings?.theme === 'dark'}
              onValueChange={(value) => updateSystemSetting('theme', value ? 'dark' : 'light')}
              trackColor={{ false: '#e0e0e0', true: '#c0e6b9' }}
              thumbColor={systemSettings?.theme === 'dark' ? '#4ea674' : '#f4f3f4'}
            />
          ),
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: '🔔',
          title: 'Push Notifications',
          subtitle: 'General app notifications',
          showArrow: false,
          renderSwitch: () => (
            <Switch
              value={notificationSettings?.pushNotifications?.generalUpdates || false}
              onValueChange={(value) => updateNotificationSetting('pushNotifications', 'generalUpdates', value)}
              trackColor={{ false: '#e0e0e0', true: '#c0e6b9' }}
              thumbColor={notificationSettings?.pushNotifications?.generalUpdates ? '#4ea674' : '#f4f3f4'}
            />
          ),
        },
        {
          icon: '📧',
          title: 'Email Notifications',
          subtitle: 'Health alerts and reminders',
          showArrow: false,
          renderSwitch: () => (
            <Switch
              value={notificationSettings?.emailNotifications?.highRiskAlerts || false}
              onValueChange={(value) => updateNotificationSetting('emailNotifications', 'highRiskAlerts', value)}
              trackColor={{ false: '#e0e0e0', true: '#c0e6b9' }}
              thumbColor={notificationSettings?.emailNotifications?.highRiskAlerts ? '#4ea674' : '#f4f3f4'}
            />
          ),
        },
        {
          icon: '📱',
          title: 'SMS Notifications',
          subtitle: 'Emergency alerts and reminders',
          showArrow: false,
          renderSwitch: () => (
            <Switch
              value={notificationSettings?.smsNotifications?.emergencyAlerts || false}
              onValueChange={(value) => updateNotificationSetting('smsNotifications', 'emergencyAlerts', value)}
              trackColor={{ false: '#e0e0e0', true: '#c0e6b9' }}
              thumbColor={notificationSettings?.smsNotifications?.emergencyAlerts ? '#4ea674' : '#f4f3f4'}
            />
          ),
        },
        {
          icon: '🌙',
          title: 'Do Not Disturb',
          subtitle: 'Quiet hours (10 PM - 8 AM)',
          showArrow: false,
          renderSwitch: () => (
            <Switch
              value={notificationSettings?.doNotDisturb?.enabled || false}
              onValueChange={(value) => {
                const currentDoNotDisturb = notificationSettings?.doNotDisturb || {};
                const updatedSettings = {
                  ...notificationSettings,
                  doNotDisturb: {
                    ...currentDoNotDisturb,
                    enabled: value,
                  },
                };
                ApiService.updateNotificationSettings(updatedSettings);
                setNotificationSettings(updatedSettings);
              }}
              trackColor={{ false: '#e0e0e0', true: '#c0e6b9' }}
              thumbColor={notificationSettings?.doNotDisturb?.enabled ? '#4ea674' : '#f4f3f4'}
            />
          ),
        },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        {
          icon: '🔒',
          title: 'Change PIN',
          subtitle: 'Update your security PIN',
          onPress: () => {
            Alert.alert('Change PIN', 'Use the Account Settings in your profile to change your PIN.');
          },
          showArrow: true,
        },
        {
          icon: '🛡️',
          title: 'Privacy Settings',
          subtitle: 'Control data sharing',
          showArrow: false,
          renderSwitch: () => (
            <Switch
              value={systemSettings?.privacy?.shareAnalytics || false}
              onValueChange={(value) => {
                const currentPrivacy = systemSettings?.privacy || {};
                const updatedPrivacy = {
                  ...currentPrivacy,
                  shareAnalytics: value,
                };
                const updatedSettings = {
                  ...systemSettings,
                  privacy: updatedPrivacy,
                };
                updateSystemSetting('privacy', updatedPrivacy);
              }}
              trackColor={{ false: '#e0e0e0', true: '#c0e6b9' }}
              thumbColor={systemSettings?.privacy?.shareAnalytics ? '#4ea674' : '#f4f3f4'}
            />
          ),
        },
      ],
    },
    {
      title: 'Data & Backup',
      items: [
        {
          icon: '💾',
          title: 'Auto Backup',
          subtitle: 'Automatic data backup',
          showArrow: false,
          renderSwitch: () => (
            <Switch
              value={systemSettings?.backup?.autoBackup || false}
              onValueChange={(value) => {
                const currentBackup = systemSettings?.backup || {};
                const updatedBackup = {
                  ...currentBackup,
                  autoBackup: value,
                };
                const updatedSettings = {
                  ...systemSettings,
                  backup: updatedBackup,
                };
                updateSystemSetting('backup', updatedBackup);
              }}
              trackColor={{ false: '#e0e0e0', true: '#c0e6b9' }}
              thumbColor={systemSettings?.backup?.autoBackup ? '#4ea674' : '#f4f3f4'}
            />
          ),
        },
        {
          icon: '📤',
          title: 'Export Data',
          subtitle: 'Download your medical records',
          onPress: handleExportData,
          showArrow: true,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: '❓',
          title: 'Help & FAQ',
          subtitle: 'Get help and find answers',
          onPress: () => {
            Alert.alert('Help & FAQ', 'Visit our website or contact support for assistance.');
          },
          showArrow: true,
        },
        {
          icon: '📞',
          title: 'Contact Support',
          subtitle: 'Reach out to our support team',
          onPress: () => {
            Alert.alert('Contact Support', 'Email: support@mamacare.zw\nPhone: +263 4 123 4567');
          },
          showArrow: true,
        },
        {
          icon: 'ℹ️',
          title: 'About MamaCare',
          subtitle: 'Version 1.0.0',
          onPress: () => {
            Alert.alert(
              'About MamaCare',
              'MamaCare Zimbabwe\nVersion 1.0.0\n\nA comprehensive maternal healthcare management system designed for Zimbabwean mothers.\n\n© 2024 MamaCare Zimbabwe'
            );
          },
          showArrow: true,
        },
      ],
    },
  ];

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
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
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.settingItemButton}
                        onPress={item.onPress}
                        disabled={!item.onPress}
                        activeOpacity={item.onPress ? 0.7 : 1}
                      >
                        <View style={styles.settingIcon}>
                          <Text style={styles.iconText}>{item.icon}</Text>
                        </View>
                        <View style={styles.settingContent}>
                          <Text style={styles.settingTitle}>{item.title}</Text>
                          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                        </View>
                        {item.showArrow && (
                          <Text style={styles.arrow}>›</Text>
                        )}
                      </TouchableOpacity>
                      {item.renderSwitch && (
                        <View style={styles.switchContainer}>
                          {item.renderSwitch()}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* Logout Section */}
            {onLogout && (
              <View style={styles.section}>
                <View style={styles.sectionContent}>
                  <TouchableOpacity
                    style={[styles.settingItem, styles.logoutItem]}
                    onPress={() => {
                      Alert.alert(
                        'Logout',
                        'Are you sure you want to logout?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Logout',
                            style: 'destructive',
                            onPress: () => {
                              onClose();
                              onLogout();
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <View style={styles.settingIcon}>
                      <Text style={styles.iconText}>🚪</Text>
                    </View>
                    <View style={styles.settingContent}>
                      <Text style={[styles.settingTitle, styles.logoutText]}>
                        Logout
                      </Text>
                      <Text style={styles.settingSubtitle}>
                        Sign out of your account
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.bottomSpacing} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        onLanguageChange={handleLanguageChange}
      />
    </>
  );
}

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
  settingSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  arrow: {
    fontSize: 20,
    color: '#ced4da',
    marginLeft: 8,
  },
  logoutItem: {
    backgroundColor: '#fff5f5',
  },
  settingItemButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchContainer: {
    paddingHorizontal: 16,
  },
  logoutText: {
    color: '#dc3545',
  },
  bottomSpacing: {
    height: 40,
  },
});
