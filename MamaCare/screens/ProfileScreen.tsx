import { useFocusEffect } from '@react-navigation/native';
import * as Print from 'expo-print';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SettingsModal from '../components/SettingsModal';
import AppointmentBookingModal from '../components/AppointmentBookingModal';
import PersonalInfoEditor from '../components/PersonalInfoEditor';
import MedicalRecordsManager from '../components/MedicalRecordsManager';
import AccountSettings from '../components/AccountSettings';
import { AuthStorage, MedicalRecord, StoredUser } from '../utils/databaseAuthStorage';
import { authService } from '../services';
import { convertToStoredUser } from '../utils/userUtils';
import PINLockScreen from './PINLockScreen';

const { width } = Dimensions.get('window');

interface ProfileScreenProps {
  onBack: () => void;
  onLogout?: () => void;
}

interface ANCAVisit {
  visitDate: string;
  clinic: string;
  outcome: string;
  notes?: string;
}

interface Vaccination {
  vaccineName: string;
  date: string;
  status: 'completed' | 'scheduled' | 'overdue';
  batchNumber?: string;
}

interface DoctorNote {
  date: string;
  note: string;
  doctor: string;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack, onLogout }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [showPINSetup, setShowPINSetup] = useState(false);
  const [hasPIN, setHasPIN] = useState(false);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [showMedicalRecords, setShowMedicalRecords] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showAppointmentBooking, setShowAppointmentBooking] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      checkPINStatus();
    }, [])
  );

  const checkPINStatus = async () => {
    try {
      const pinExists = await AuthStorage.hasPIN();
      setHasPIN(pinExists);
      
      if (!pinExists) {
        setShowPINSetup(true);
        setIsLocked(false);
      } else {
        setIsLocked(true);
      }
    } catch (error) {
      console.error('Error checking PIN status:', error);
    }
  };

  const loadMedicalRecords = async () => {
    try {
      setIsLoading(true);
      
      // First, check if user is authenticated
      const isAuthenticated = authService.isAuthenticated();
      console.log('User authentication status:', isAuthenticated);
      
      if (!isAuthenticated) {
        console.log('User not authenticated, showing minimal profile');
        setCurrentUser(null);
        setMedicalRecords([]);
        return;
      }
      
      // Try to get user from auth service first (most up-to-date)
      const authUser = authService.getUser();
      
      if (authUser) {
        console.log('Loading user from auth service:', authUser);
        // Convert authUser to StoredUser format for compatibility
        const user = convertToStoredUser(authUser);
        if (user) {
          setCurrentUser(user);
          console.log('Successfully set current user from auth service');
        }
      } else {
        console.log('Auth service user not found, checking database...');
        // Fallback to database storage if auth service doesn't have user
        try {
          const dbUser = await AuthStorage.getCurrentUser();
          console.log('Database user result:', dbUser ? 'Found' : 'Not found');
          if (dbUser) {
            setCurrentUser(dbUser);
            console.log('Successfully set current user from database');
          }
        } catch (dbError) {
          console.error('Error loading user from database:', dbError);
          // Don't show error for user loading failure, just continue with null user
        }
      }
      
      // Load medical records - this should work independently of user data
      try {
        console.log('Loading medical records...');
        let records = await AuthStorage.getMedicalRecords();
        console.log('Loaded medical records count:', records.length);
        
        // Add dummy data if no records exist
        if (records.length === 0) {
          console.log('No medical records found, adding dummy data...');
          await addDummyData();
          records = await AuthStorage.getMedicalRecords();
          console.log('After adding dummy data, record count:', records.length);
        }
        
        setMedicalRecords(records);
        console.log('Successfully set medical records');
      } catch (recordError) {
        console.error('Error loading medical records:', recordError);
        // Don't show error if just medical records fail, user info might still work
        setMedicalRecords([]);
        console.log('Set empty medical records due to error');
      }
      
      console.log('Profile loading completed successfully');
      
    } catch (error) {
      console.error('Critical error in loadMedicalRecords:', error);
      // Only show error if it's a critical failure that prevents any functionality
      // Alert.alert('Error', 'Some profile data could not be loaded. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    await loadMedicalRecords();
  };

  const handleBookAppointment = async (appointmentData: any): Promise<void> => {
    try {
      // Here you would typically call your appointment booking API
      console.log('Booking appointment:', appointmentData);
      
      // For now, we'll just show a success message
      // In a real app, you'd call something like:
      // const result = await ApiService.bookAppointment(appointmentData);
      
      // Return void as expected by the interface
    } catch (error) {
      console.error('Error booking appointment:', error);
      throw error;
    }
  };

  const addDummyData = async () => {
    const dummyRecords = [
      // ANC Visits
      {
        type: 'anc_visit' as const,
        date: '2024-01-15',
        data: {
          visitDate: '2024-01-15',
          clinic: 'Harare Central Hospital',
          outcome: 'Normal checkup - Baby healthy',
          notes: 'Blood pressure normal, weight gain on track'
        }
      },
      {
        type: 'anc_visit' as const,
        date: '2024-02-20',
        data: {
          visitDate: '2024-02-20',
          clinic: 'Parirenyatwa Hospital',
          outcome: 'Ultrasound completed',
          notes: 'Baby development normal, due date confirmed'
        }
      },
      // Vaccinations
      {
        type: 'vaccination' as const,
        date: '2024-01-10',
        data: {
          vaccineName: 'Tetanus (Td)',
          date: '2024-01-10',
          status: 'completed',
          batchNumber: 'TD2024001'
        }
      },
      {
        type: 'vaccination' as const,
        date: '2024-03-15',
        data: {
          vaccineName: 'COVID-19 Booster',
          date: '2024-03-15',
          status: 'completed',
          batchNumber: 'COV2024005'
        }
      },
      // Doctor Notes
      {
        type: 'doctor_note' as const,
        date: '2024-01-15',
        data: {
          date: '2024-01-15',
          note: 'Patient advised to increase iron intake. Recommended prenatal vitamins.',
          doctor: 'Dr. Sarah Mukamuri'
        }
      },
      {
        type: 'doctor_note' as const,
        date: '2024-02-20',
        data: {
          date: '2024-02-20',
          note: 'Blood sugar levels normal. Continue with regular exercise routine.',
          doctor: 'Dr. James Chitando'
        }
      }
    ];

    for (const record of dummyRecords) {
      await AuthStorage.addMedicalRecord(record);
    }
  };

  const handlePINSetupSuccess = () => {
    console.log('PIN setup successful, loading data...');
    setShowPINSetup(false);
    setHasPIN(true);
    setIsLocked(false);
    loadMedicalRecords();
  };

  const handlePINVerifySuccess = () => {
    console.log('PIN verified successfully, loading data...');
    setIsLocked(false);
    loadMedicalRecords();
  };

  const getANCVisits = (): ANCAVisit[] => {
    return medicalRecords
      .filter(record => record.type === 'anc_visit')
      .map(record => record.data)
      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
  };

  const getVaccinations = (): Vaccination[] => {
    return medicalRecords
      .filter(record => record.type === 'vaccination')
      .map(record => record.data)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getDoctorNotes = (): DoctorNote[] => {
    return medicalRecords
      .filter(record => record.type === 'doctor_note')
      .map(record => record.data)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const generatePDF = async () => {
    try {
      setIsLoading(true);
      
      const currentUser = await AuthStorage.getCurrentUser();
      const ancVisits = getANCVisits();
      const vaccinations = getVaccinations();
      const doctorNotes = getDoctorNotes();

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Medical Records - ${currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Patient'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #4ea674;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              color: #4ea674;
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .patient-info {
              background-color: #e9f8e7;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .section {
              margin-bottom: 40px;
            }
            .section-title {
              color: #023337;
              font-size: 20px;
              font-weight: bold;
              border-bottom: 1px solid #c0e6b9;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .record-card {
              background-color: #f9f9f9;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 15px;
            }
            .record-date {
              color: #4ea674;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .status-completed {
              color: #4ea674;
              font-weight: bold;
            }
            .status-scheduled {
              color: #f39c12;
              font-weight: bold;
            }
            .status-overdue {
              color: #e74c3c;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">MamaCare Zimbabwe</div>
            <h1>Medical Records</h1>
            <p>Generated on ${new Date().toLocaleDateString('en-GB')}</p>
          </div>

          <div class="patient-info">
            <h3>Patient Information</h3>
            <p><strong>Name:</strong> ${currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'N/A'}</p>
            <p><strong>Phone:</strong> ${currentUser?.phone || 'N/A'}</p>
            <p><strong>Record Date:</strong> ${new Date().toLocaleDateString('en-GB')}</p>
          </div>

          <div class="section">
            <h2 class="section-title">📆 ANC Visit Log</h2>
            ${ancVisits.length > 0 ? ancVisits.map(visit => `
              <div class="record-card">
                <div class="record-date">${formatDate(visit.visitDate)}</div>
                <p><strong>Clinic:</strong> ${visit.clinic}</p>
                <p><strong>Outcome:</strong> ${visit.outcome}</p>
                ${visit.notes ? `<p><strong>Notes:</strong> ${visit.notes}</p>` : ''}
              </div>
            `).join('') : '<p>No ANC visits recorded.</p>'}
          </div>

          <div class="section">
            <h2 class="section-title">💉 Vaccination Records</h2>
            ${vaccinations.length > 0 ? vaccinations.map(vaccine => `
              <div class="record-card">
                <div class="record-date">${formatDate(vaccine.date)}</div>
                <p><strong>Vaccine:</strong> ${vaccine.vaccineName}</p>
                <p><strong>Status:</strong> <span class="status-${vaccine.status}">${vaccine.status.toUpperCase()}</span></p>
                ${vaccine.batchNumber ? `<p><strong>Batch Number:</strong> ${vaccine.batchNumber}</p>` : ''}
              </div>
            `).join('') : '<p>No vaccinations recorded.</p>'}
          </div>

          <div class="section">
            <h2 class="section-title">👩‍⚕️ Doctor&apos;s Notes</h2>
            ${doctorNotes.length > 0 ? doctorNotes.map(note => `
              <div class="record-card">
                <div class="record-date">${formatDate(note.date)}</div>
                <p><strong>Doctor:</strong> ${note.doctor}</p>
                <p><strong>Note:</strong> ${note.note}</p>
              </div>
            `).join('') : '<p>No doctor notes recorded.</p>'}
          </div>

          <div class="footer">
            <p>This document was generated by MamaCare Zimbabwe mobile application.</p>
            <p>For medical emergencies, contact your healthcare provider immediately.</p>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      // Share the PDF
      await Share.share({
        url: uri,
        title: 'Medical Records',
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showPINSetup) {
    return (
      <Modal visible={showPINSetup} animationType="slide">
        <PINLockScreen
          mode="create"
          onSuccess={handlePINSetupSuccess}
          onCancel={() => {
            setShowPINSetup(false);
            onBack();
          }}
        />
      </Modal>
    );
  }

  if (isLocked && hasPIN) {
    return (
      <PINLockScreen
        mode="verify"
        onSuccess={handlePINVerifySuccess}
        onCancel={onBack}
      />
    );
  }

  const ancVisits = getANCVisits();
  const vaccinations = getVaccinations();
  const doctorNotes = getDoctorNotes();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={['#4ea674', '#3d8f5f', '#2d6e47']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={onBack} 
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <Text style={styles.headerSubtitle}>Health Records & Settings</Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => {
                console.log('Refresh button pressed');
                loadMedicalRecords();
              }}
              style={styles.actionButton}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>🔄</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowSettings(true)}
              style={styles.actionButton}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={generatePDF}
              style={[styles.actionButton, styles.exportButton]}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>
                {isLoading ? '⏳' : '📤'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <View style={styles.statusIndicator} />
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {isLoading ? 'Loading...' : 
               currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Welcome!'}
            </Text>
            <Text style={styles.userRole}>
              {isLoading ? 'Loading profile...' : 'Patient Profile'}
            </Text>
            <Text style={styles.userEmail}>
              {isLoading ? 'Loading email...' : (currentUser?.email || 'Email not available')}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{isLoading ? '...' : medicalRecords.length}</Text>
                <Text style={styles.statLabel}>Records</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{isLoading ? '...' : ancVisits.length}</Text>
                <Text style={styles.statLabel}>Visits</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{isLoading ? '...' : vaccinations.length}</Text>
                <Text style={styles.statLabel}>Vaccines</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Actions Section */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Profile Management</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard} 
              activeOpacity={0.8}
              onPress={() => setShowPersonalInfo(true)}
            >
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>👤</Text>
              </View>
              <Text style={styles.quickActionText}>Personal Info</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard} 
              activeOpacity={0.8}
              onPress={() => setShowMedicalRecords(true)}
            >
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>🏥</Text>
              </View>
              <Text style={styles.quickActionText}>Medical Records</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard} 
              activeOpacity={0.8}
              onPress={() => setShowAccountSettings(true)}
            >
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>⚙️</Text>
              </View>
              <Text style={styles.quickActionText}>Account Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard} 
              activeOpacity={0.8}
              onPress={generatePDF}
            >
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>📄</Text>
              </View>
              <Text style={styles.quickActionText}>Export Records</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Connection Status Message */}
        {!isLoading && !currentUser && (
          <View style={styles.section}>
            <View style={styles.warningCard}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningTitle}>Profile Data Unavailable</Text>
              <Text style={styles.warningText}>
                Unable to load your profile information. This could be due to:
              </Text>
              <Text style={styles.warningText}>• Internet connection issues</Text>
              <Text style={styles.warningText}>• Server connectivity problems</Text>
              <Text style={styles.warningText}>• Authentication session expired</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  console.log('Retry button pressed');
                  loadMedicalRecords();
                }}
              >
                <Text style={styles.retryButtonText}>🔄 Retry Loading</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Debug Info - Remove in production */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🐛 Debug Info</Text>
            <View style={styles.modernRecordCard}>
              <View style={styles.recordContent}>
                <View style={styles.recordRow}>
                  <Text style={styles.recordLabel}>Auth Service User:</Text>
                  <Text style={styles.recordValue}>
                    {authService.getUser() ? 'Available' : 'Not available'}
                  </Text>
                </View>
                <View style={styles.recordRow}>
                  <Text style={styles.recordLabel}>Current User:</Text>
                  <Text style={styles.recordValue}>
                    {currentUser ? 'Loaded' : 'Not loaded'}
                  </Text>
                </View>
                <View style={styles.recordRow}>
                  <Text style={styles.recordLabel}>Loading:</Text>
                  <Text style={styles.recordValue}>{isLoading ? 'Yes' : 'No'}</Text>
                </View>
                <View style={styles.recordRow}>
                  <Text style={styles.recordLabel}>PIN Status:</Text>
                  <Text style={styles.recordValue}>
                    {isLocked ? 'Locked' : 'Unlocked'} / {hasPIN ? 'Has PIN' : 'No PIN'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* User Information Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📋 Profile Summary</Text>
            <TouchableOpacity
              onPress={() => setShowPersonalInfo(true)}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modernRecordCard}>
            <View style={styles.recordContent}>
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>Full Name:</Text>
                <Text style={styles.recordValue}>
                  {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Not available - please check your connection'}
                </Text>
              </View>
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>Email:</Text>
                <Text style={styles.recordValue}>
                  {currentUser?.email || 'Not available - please check your connection'}
                </Text>
              </View>
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>Phone:</Text>
                <Text style={styles.recordValue}>{currentUser?.phone || 'Not set'}</Text>
              </View>
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>User ID:</Text>
                <Text style={[styles.recordValue, { fontSize: 12, fontFamily: 'monospace' }]}>
                  {currentUser?._id || 'N/A'}
                </Text>
              </View>
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>Member Since:</Text>
                <Text style={styles.recordValue}>
                  {currentUser?.createdAt ? formatDate(currentUser.createdAt.split('T')[0]) : 'N/A'}
                </Text>
              </View>
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>PIN Protection:</Text>
                <Text style={[styles.recordValue, hasPIN && styles.completedText]}>
                  {hasPIN ? 'Enabled ✓' : 'Disabled'}
                </Text>
              </View>
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>Account Status:</Text>
                <Text style={[styles.recordValue, currentUser?.isActive && styles.completedText]}>
                  {currentUser?.isActive ? 'Active ✓' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard} 
              activeOpacity={0.8}
              onPress={() => {
                console.log('Book Appointment pressed');
                setShowAppointmentBooking(true);
              }}
            >
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>📱</Text>
              </View>
              <Text style={styles.quickActionText}>Book Appointment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard} 
              activeOpacity={0.8}
              onPress={() => {
                // Navigate to medications or show medications info
                console.log('Medications pressed');
                Alert.alert(
                  'Medications', 
                  'Medication tracking feature coming soon. You can add medication information to your medical records.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>💊</Text>
              </View>
              <Text style={styles.quickActionText}>Medications</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard} 
              activeOpacity={0.8}
              onPress={() => {
                // Show health statistics
                console.log('Health Stats pressed');
                const totalRecords = medicalRecords.length;
                const ancVisits = getANCVisits().length;
                const vaccinations = getVaccinations().length;
                const doctorNotes = getDoctorNotes().length;
                
                Alert.alert(
                  'Health Statistics',
                  `📊 Your Health Overview:\n\n` +
                  `• Total Records: ${totalRecords}\n` +
                  `• ANC Visits: ${ancVisits}\n` +
                  `• Vaccinations: ${vaccinations}\n` +
                  `• Doctor Notes: ${doctorNotes}\n\n` +
                  `Keep tracking your health journey!`,
                  [{ text: 'OK' }]
                );
              }}
            >
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>📊</Text>
              </View>
              <Text style={styles.quickActionText}>Health Stats</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard} 
              activeOpacity={0.8}
              onPress={generatePDF}
            >
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>📄</Text>
              </View>
              <Text style={styles.quickActionText}>Export Records</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ANC Visit Log Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📆 ANC Visits</Text>
            <View style={styles.sectionActions}>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{ancVisits.length}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowMedicalRecords(true)}
                style={styles.manageButton}
              >
                <Text style={styles.manageButtonText}>Manage</Text>
              </TouchableOpacity>
            </View>
          </View>
          {ancVisits.length > 0 ? (
            ancVisits.map((visit, index) => (
              <View key={index} style={styles.modernRecordCard}>
                <View style={styles.recordHeader}>
                  <View style={styles.recordIconContainer}>
                    <Text style={styles.recordIcon}>🏥</Text>
                  </View>
                  <View style={styles.recordHeaderText}>
                    <Text style={styles.recordTitle}>ANC Visit</Text>
                    <Text style={styles.recordDate}>{formatDate(visit.visitDate)}</Text>
                  </View>
                  <View style={styles.recordStatusBadge}>
                    <Text style={styles.recordStatusText}>✓</Text>
                  </View>
                </View>
                <View style={styles.recordContent}>
                  <View style={styles.recordRow}>
                    <Text style={styles.recordLabel}>Clinic:</Text>
                    <Text style={styles.recordValue}>{visit.clinic}</Text>
                  </View>
                  <View style={styles.recordRow}>
                    <Text style={styles.recordLabel}>Outcome:</Text>
                    <Text style={styles.recordValue}>{visit.outcome}</Text>
                  </View>
                  {visit.notes && (
                    <View style={styles.recordNotesContainer}>
                      <Text style={styles.recordNotesLabel}>Notes:</Text>
                      <Text style={styles.recordNotes}>{visit.notes}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>📋</Text>
              <Text style={styles.emptyStateText}>No ANC visits recorded yet</Text>
              <Text style={styles.emptyStateSubtext}>Your visit history will appear here</Text>
            </View>
          )}
        </View>

        {/* Vaccination Records Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💉 Vaccinations</Text>
            <View style={styles.sectionActions}>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{vaccinations.length}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowMedicalRecords(true)}
                style={styles.manageButton}
              >
                <Text style={styles.manageButtonText}>Manage</Text>
              </TouchableOpacity>
            </View>
          </View>
          {vaccinations.length > 0 ? (
            vaccinations.map((vaccine, index) => (
              <View key={index} style={styles.modernRecordCard}>
                <View style={styles.recordHeader}>
                  <View style={styles.recordIconContainer}>
                    <Text style={styles.recordIcon}>💉</Text>
                  </View>
                  <View style={styles.recordHeaderText}>
                    <Text style={styles.recordTitle}>{vaccine.vaccineName}</Text>
                    <Text style={styles.recordDate}>{formatDate(vaccine.date)}</Text>
                  </View>
                  <View style={[
                    styles.recordStatusBadge,
                    vaccine.status === 'completed' && styles.statusCompleted,
                    vaccine.status === 'scheduled' && styles.statusScheduled,
                    vaccine.status === 'overdue' && styles.statusOverdue,
                  ]}>
                    <Text style={[
                      styles.recordStatusText,
                      vaccine.status === 'completed' && styles.statusCompletedText,
                      vaccine.status === 'scheduled' && styles.statusScheduledText,
                      vaccine.status === 'overdue' && styles.statusOverdueText,
                    ]}>
                      {vaccine.status === 'completed' ? '✓' : 
                       vaccine.status === 'scheduled' ? '⏰' : '⚠️'}
                    </Text>
                  </View>
                </View>
                <View style={styles.recordContent}>
                  <View style={styles.recordRow}>
                    <Text style={styles.recordLabel}>Status:</Text>
                    <Text style={[
                      styles.recordValue,
                      vaccine.status === 'completed' && styles.completedText,
                      vaccine.status === 'scheduled' && styles.scheduledText,
                      vaccine.status === 'overdue' && styles.overdueText,
                    ]}>{vaccine.status.charAt(0).toUpperCase() + vaccine.status.slice(1)}</Text>
                  </View>
                  {vaccine.batchNumber && (
                    <View style={styles.recordRow}>
                      <Text style={styles.recordLabel}>Batch:</Text>
                      <Text style={styles.recordValue}>{vaccine.batchNumber}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>💉</Text>
              <Text style={styles.emptyStateText}>No vaccinations recorded yet</Text>
              <Text style={styles.emptyStateSubtext}>Your vaccination history will appear here</Text>
            </View>
          )}
        </View>

        {/* Doctor's Notes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>👩‍⚕️ Doctor&apos;s Notes</Text>
            <View style={styles.sectionActions}>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{doctorNotes.length}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowMedicalRecords(true)}
                style={styles.manageButton}
              >
                <Text style={styles.manageButtonText}>Manage</Text>
              </TouchableOpacity>
            </View>
          </View>
          {doctorNotes.length > 0 ? (
            doctorNotes.map((note, index) => (
              <View key={index} style={styles.modernRecordCard}>
                <View style={styles.recordHeader}>
                  <View style={styles.recordIconContainer}>
                    <Text style={styles.recordIcon}>📝</Text>
                  </View>
                  <View style={styles.recordHeaderText}>
                    <Text style={styles.recordTitle}>Medical Note</Text>
                    <Text style={styles.recordDate}>{formatDate(note.date)}</Text>
                  </View>
                  <View style={styles.recordStatusBadge}>
                    <Text style={styles.recordStatusText}>📋</Text>
                  </View>
                </View>
                <View style={styles.recordContent}>
                  <View style={styles.recordRow}>
                    <Text style={styles.recordLabel}>Doctor:</Text>
                    <Text style={styles.recordValue}>{note.doctor}</Text>
                  </View>
                  <View style={styles.recordNotesContainer}>
                    <Text style={styles.recordNotesLabel}>Notes:</Text>
                    <Text style={styles.recordNotes}>{note.note}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>📝</Text>
              <Text style={styles.emptyStateText}>No doctor notes recorded yet</Text>
              <Text style={styles.emptyStateSubtext}>Your medical notes will appear here</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Settings Modal */}
      <SettingsModal 
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onLogout={onLogout ? () => {
          setShowSettings(false);
          onLogout();
        } : undefined}
      />

      {/* Personal Info Editor */}
      <PersonalInfoEditor
        visible={showPersonalInfo}
        onClose={() => setShowPersonalInfo(false)}
        onUpdate={refreshData}
      />

      {/* Medical Records Manager */}
      <MedicalRecordsManager
        visible={showMedicalRecords}
        onClose={() => setShowMedicalRecords(false)}
        onUpdate={refreshData}
      />

      {/* Appointment Booking Modal */}
      <AppointmentBookingModal
        visible={showAppointmentBooking}
        onClose={() => setShowAppointmentBooking(false)}
        onBookAppointment={handleBookAppointment}
      />

      {/* Account Settings */}
      <AccountSettings
        visible={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
        onUpdate={refreshData}
        onLogout={() => {
          setShowAccountSettings(false);
          onBack();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fdf9',
  },
  
  // Header styles
  headerGradient: {
    paddingTop: StatusBar.currentHeight || 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#4ea674',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backIcon: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    marginLeft: -2, // Slight adjustment for visual centering
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionIcon: {
    fontSize: 20,
  },
  
  // Profile card styles
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f9f2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  avatarText: {
    fontSize: 32,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4ea674',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#4ea674',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#023337',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  
  // Content styles
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // Quick actions styles
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  quickActionCard: {
    width: (width - 60) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f9f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#023337',
    textAlign: 'center',
  },
  
  // Section styles
  section: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#e9f8e7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4ea674',
  },
  editButtonText: {
    fontSize: 14,
    color: '#4ea674',
    fontWeight: '600',
  },
  manageButton: {
    backgroundColor: '#f0f9f2',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  manageButtonText: {
    fontSize: 12,
    color: '#4ea674',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#023337',
  },
  sectionBadge: {
    backgroundColor: '#4ea674',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  
  // Modern record card styles
  modernRecordCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  recordIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f9f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recordIcon: {
    fontSize: 24,
  },
  recordHeaderText: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 2,
  },
  recordDate: {
    fontSize: 14,
    color: '#4ea674',
    fontWeight: '600',
  },
  recordStatusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e8f5e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordStatusText: {
    fontSize: 16,
  },
  recordContent: {
    padding: 16,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 80,
  },
  recordValue: {
    fontSize: 14,
    color: '#023337',
    flex: 1,
    fontWeight: '500',
  },
  recordNotesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  recordNotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  recordNotes: {
    fontSize: 14,
    color: '#023337',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  
  // Status styles
  statusCompleted: {
    backgroundColor: '#d4edda',
  },
  statusScheduled: {
    backgroundColor: '#fff3cd',
  },
  statusOverdue: {
    backgroundColor: '#f8d7da',
  },
  statusCompletedText: {
    color: '#155724',
  },
  statusScheduledText: {
    color: '#856404',
  },
  statusOverdueText: {
    color: '#721c24',
  },
  completedText: {
    color: '#155724',
    fontWeight: 'bold',
  },
  scheduledText: {
    color: '#856404',
    fontWeight: 'bold',
  },
  overdueText: {
    color: '#721c24',
    fontWeight: 'bold',
  },
  
  // Empty state styles
  emptyStateContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginTop: 8,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  
  // Warning/error state styles
  warningCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffeeba',
    marginTop: 8,
  },
  warningIcon: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    textAlign: 'center',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: '#4ea674',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Legacy styles (for compatibility)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#c0e6b9',
  },
  backButtonText: {
    fontSize: 16,
    color: '#4ea674',
    fontWeight: '500',
  },
  settingsButton: {
    padding: 8,
  },
  settingsButtonText: {
    fontSize: 20,
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  recordCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recordText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 20,
  },
  noteText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    lineHeight: 20,
    marginTop: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#023337',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  bottomSpacing: {
    height: 30,
  },
});

export default ProfileScreen;
