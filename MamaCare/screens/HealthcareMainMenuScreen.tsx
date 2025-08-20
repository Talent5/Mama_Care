import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  medicalRecordService,
  billingService,
  telemedicineService,
  analyticsService
} from '../services';

interface HealthcareMainMenuScreenProps {
  navigation: any;
}

const HealthcareMainMenuScreen: React.FC<HealthcareMainMenuScreenProps> = ({ navigation }) => {
  const [quickStats, setQuickStats] = useState({
    totalRecords: 0,
    totalInvoices: 0,
    activeSessions: 0,
    pendingPayments: 0
  });
  const [showQuickAction, setShowQuickAction] = useState(false);
  const [quickActionType, setQuickActionType] = useState<string>('');

  useEffect(() => {
    loadQuickStats();
  }, []);

  const loadQuickStats = async () => {
    try {
      // Load quick statistics for the overview
      const [medicalStats, billingStats, telemedicineStats] = await Promise.all([
        medicalRecordService.getMedicalRecordStats('month'),
        billingService.getInvoiceStats('month'),
        telemedicineService.getTelemedicineStats('month')
      ]);

      setQuickStats({
        totalRecords: medicalStats.data?.totalRecords || 0,
        totalInvoices: billingStats.data?.totalInvoices || 0,
        activeSessions: telemedicineStats.data?.activeSessions || 0,
        pendingPayments: billingStats.data?.pendingInvoices || 0
      });
    } catch (error) {
      console.error('Error loading quick stats:', error);
    }
  };

  const menuItems = [
    {
      id: 'medical-records',
      title: 'Medical Records',
      subtitle: 'EHR Management',
      icon: 'medical',
      color: '#3B82F6',
      screen: 'MedicalRecords',
      stats: quickStats.totalRecords
    },
    {
      id: 'billing',
      title: 'Billing & Payments',
      subtitle: 'Invoice Management',
      icon: 'card',
      color: '#10B981',
      screen: 'Billing',
      stats: quickStats.totalInvoices
    },
    {
      id: 'telemedicine',
      title: 'Telemedicine',
      subtitle: 'Video Consultations',
      icon: 'videocam',
      color: '#8B5CF6',
      screen: 'Telemedicine',
      stats: quickStats.activeSessions
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      subtitle: 'Performance Insights',
      icon: 'analytics',
      color: '#F59E0B',
      screen: 'HealthcareAnalytics',
      stats: '📊'
    }
  ];

  const quickActions = [
    {
      id: 'new-record',
      title: 'New Medical Record',
      icon: 'add-circle',
      color: '#3B82F6'
    },
    {
      id: 'create-invoice',
      title: 'Create Invoice',
      icon: 'receipt',
      color: '#10B981'
    },
    {
      id: 'start-consultation',
      title: 'Start Consultation',
      icon: 'videocam',
      color: '#8B5CF6'
    },
    {
      id: 'emergency-alert',
      title: 'Emergency Alert',
      icon: 'alert-circle',
      color: '#EF4444'
    }
  ];

  const handleQuickAction = (actionId: string) => {
    setQuickActionType(actionId);
    switch (actionId) {
      case 'new-record':
        navigation.navigate('MedicalRecords', { action: 'create' });
        break;
      case 'create-invoice':
        navigation.navigate('Billing', { action: 'create' });
        break;
      case 'start-consultation':
        navigation.navigate('Telemedicine', { action: 'start' });
        break;
      case 'emergency-alert':
        Alert.alert(
          'Emergency Alert',
          'Are you sure you want to send an emergency alert to all staff?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Send Alert', style: 'destructive', onPress: sendEmergencyAlert }
          ]
        );
        break;
    }
  };

  const sendEmergencyAlert = async () => {
    try {
      // Implement emergency alert logic here
      Alert.alert('Success', 'Emergency alert has been sent to all staff members.');
    } catch (error) {
      Alert.alert('Error', 'Failed to send emergency alert.');
    }
  };

  const StatusCard = ({ title, value, color, icon }: {
    title: string;
    value: string | number;
    color: string;
    icon: string;
  }) => (
    <View style={[styles.statusCard, { borderLeftColor: color }]}>
      <View style={styles.statusIcon}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.statusContent}>
        <Text style={styles.statusValue}>{value}</Text>
        <Text style={styles.statusTitle}>{title}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Healthcare System</Text>
        <Text style={styles.subtitle}>MamaCare Platform</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Status Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          <View style={styles.statusGrid}>
            <StatusCard
              title="Medical Records"
              value={quickStats.totalRecords}
              color="#3B82F6"
              icon="medical"
            />
            <StatusCard
              title="Active Sessions"
              value={quickStats.activeSessions}
              color="#8B5CF6"
              icon="videocam"
            />
            <StatusCard
              title="Total Invoices"
              value={quickStats.totalInvoices}
              color="#10B981"
              icon="receipt"
            />
            <StatusCard
              title="Pending Payments"
              value={quickStats.pendingPayments}
              color="#F59E0B"
              icon="time"
            />
          </View>
        </View>

        {/* Main Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Healthcare Modules</Text>
          <View style={styles.menuGrid}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, { borderColor: item.color }]}
                onPress={() => navigation.navigate(item.screen)}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon as any} size={28} color="white" />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                <View style={styles.menuStats}>
                  <Text style={[styles.menuStatsText, { color: item.color }]}>
                    {typeof item.stats === 'number' ? `${item.stats} items` : item.stats}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickAction, { backgroundColor: action.color + '15' }]}
                onPress={() => handleQuickAction(action.id)}
              >
                <Ionicons name={action.icon as any} size={24} color={action.color} />
                <Text style={[styles.quickActionText, { color: action.color }]}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* System Health Indicators */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Health</Text>
          <View style={styles.healthIndicators}>
            <View style={styles.healthItem}>
              <View style={[styles.healthDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.healthText}>Database Connection</Text>
              <Text style={styles.healthStatus}>Online</Text>
            </View>
            <View style={styles.healthItem}>
              <View style={[styles.healthDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.healthText}>Payment Gateway</Text>
              <Text style={styles.healthStatus}>Active</Text>
            </View>
            <View style={styles.healthItem}>
              <View style={[styles.healthDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.healthText}>Video Service</Text>
              <Text style={styles.healthStatus}>Maintenance</Text>
            </View>
            <View style={styles.healthItem}>
              <View style={[styles.healthDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.healthText}>Backup Systems</Text>
              <Text style={styles.healthStatus}>Running</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <Ionicons name="medical" size={16} color="#3B82F6" />
              <Text style={styles.activityText}>New medical record created</Text>
              <Text style={styles.activityTime}>2 min ago</Text>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="card" size={16} color="#10B981" />
              <Text style={styles.activityText}>Payment received for invoice #INV-2024-001</Text>
              <Text style={styles.activityTime}>15 min ago</Text>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="videocam" size={16} color="#8B5CF6" />
              <Text style={styles.activityText}>Telemedicine session completed</Text>
              <Text style={styles.activityTime}>1 hour ago</Text>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="analytics" size={16} color="#F59E0B" />
              <Text style={styles.activityText}>Weekly report generated</Text>
              <Text style={styles.activityTime}>3 hours ago</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333'
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4
  },
  content: {
    flex: 1,
    padding: 20
  },
  section: {
    marginBottom: 30
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    width: '48%',
    marginBottom: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusIcon: {
    marginRight: 12
  },
  statusContent: {
    flex: 1
  },
  statusValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  statusTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  menuItem: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    width: '48%',
    marginBottom: 15,
    borderWidth: 2,
    alignItems: 'center'
  },
  menuIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8
  },
  menuStats: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0'
  },
  menuStatsText: {
    fontSize: 11,
    fontWeight: '500'
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  quickAction: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center'
  },
  healthIndicators: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12
  },
  healthText: {
    flex: 1,
    fontSize: 14,
    color: '#333'
  },
  healthStatus: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500'
  },
  activityList: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 10
  },
  activityTime: {
    fontSize: 12,
    color: '#999'
  },
  bottomPadding: {
    height: 20
  }
});

export default HealthcareMainMenuScreen;
