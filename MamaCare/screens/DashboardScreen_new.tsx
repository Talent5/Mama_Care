import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ProfileScreen from './ProfileScreen';
import { AuthStorage, StoredUser } from '../utils/authStorage';
import ActivityService from '../services/activityService';
import { getCompleteGreeting } from '../utils/greetingUtils';

interface DashboardScreenProps {
  onLogout: () => void;
}

const { width } = Dimensions.get('window');

export default function DashboardScreen({ onLogout }: DashboardScreenProps) {
  const { t } = useTranslation();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(20); // Example pregnancy week
  const [showProfile, setShowProfile] = useState(false);

  // Health tracking methods
  const trackWaterIntake = () => {
    ActivityService.recordHealthMetric({
      type: 'water_intake',
      value: 1,
      unit: 'glasses',
      notes: 'Logged from dashboard'
    });
  };

  const trackMedication = () => {
    ActivityService.trackMedication('Prenatal Vitamins', true);
  };

  useEffect(() => {
    loadUserData();
    // Track dashboard view
    ActivityService.trackAppUsage('Dashboard');
    // In a real app, you'd calculate this based on due date
    setCurrentWeek(Math.floor(Math.random() * 40) + 1);
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await AuthStorage.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Services',
      'Choose an emergency service to call:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '🚑 Ambulance (999)',
          onPress: () => {
            // Track emergency call
            ActivityService.trackEmergencyCall('ambulance');
            Alert.alert(
              'Calling Emergency Services',
              'This would dial 999 for emergency ambulance services.',
              [{ text: 'OK' }]
            );
          },
        },
        {
          text: '🏥 Maternity Ward',
          onPress: () => {
            // Track emergency call
            ActivityService.trackEmergencyCall('maternity_ward');
            Alert.alert(
              'Calling Maternity Ward',
              'This would call your local maternity ward emergency line.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const getPregnancyStageInfo = (week: number) => {
    if (week <= 12) {
      return { stage: 'First Trimester', color: '#ff9999', icon: '🌱' };
    } else if (week <= 28) {
      return { stage: 'Second Trimester', color: '#ffcc99', icon: '🌿' };
    } else {
      return { stage: 'Third Trimester', color: '#99ccff', icon: '🌸' };
    }
  };

  const pregnancyInfo = getPregnancyStageInfo(currentWeek);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingIcon}>🤰</Text>
          <Text style={styles.loadingText}>Loading your MamaCare...</Text>
        </View>
      </View>
    );
  }

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
          <View style={styles.greetingSection}>
            <Text style={styles.timeGreeting}>{getCompleteGreeting(user).greeting}</Text>
            <Text style={styles.userName}>{getCompleteGreeting(user).message}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={() => setShowProfile(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Enhanced Pregnancy Progress Card */}
        <View style={styles.pregnancyCard}>
          <View style={styles.pregnancyHeader}>
            <View style={styles.pregnancyIconContainer}>
              <Text style={styles.pregnancyIcon}>{pregnancyInfo.icon}</Text>
            </View>
            <View style={styles.pregnancyInfo}>
              <Text style={styles.pregnancyWeek}>Week {currentWeek}</Text>
              <Text style={styles.pregnancyStage}>{pregnancyInfo.stage}</Text>
              <Text style={styles.remainingWeeks}>{40 - currentWeek} weeks to go</Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercentage}>{Math.round((currentWeek / 40) * 100)}%</Text>
            </View>
          </View>
          
          {/* Enhanced Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${(currentWeek / 40) * 100}%`,
                    backgroundColor: pregnancyInfo.color 
                  }
                ]} 
              />
            </View>
          </View>

          {/* Baby Development Card */}
          <View style={styles.babySizeCard}>
            <View style={styles.babySizeHeader}>
              <Text style={styles.babySizeTitle}>Your baby is the size of</Text>
              <Text style={styles.babySizeEmoji}>🥝</Text>
            </View>
            <Text style={styles.babySizeText}>A Kiwi Fruit</Text>
            <Text style={styles.babySizeDetails}>Length: ~14cm • Weight: ~190g</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
      >
        {/* Emergency Section - Prominently Featured */}
        <View style={styles.emergencySection}>
          <TouchableOpacity 
            style={styles.emergencyCard}
            onPress={handleEmergencyCall}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#ff4757', '#ff3742', '#e84118']}
              style={styles.emergencyGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.emergencyContent}>
                <View style={styles.emergencyIconContainer}>
                  <Text style={styles.emergencyIcon}>🚨</Text>
                </View>
                <View style={styles.emergencyText}>
                  <Text style={styles.emergencyTitle}>Emergency Call</Text>
                  <Text style={styles.emergencySubtitle}>24/7 immediate medical assistance</Text>
                </View>
                <Text style={styles.emergencyArrow}>›</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Today's Health Overview */}
        <View style={styles.healthOverviewSection}>
          <Text style={styles.sectionTitle}>Todays Health</Text>
          <View style={styles.healthGrid}>
            <TouchableOpacity 
              style={styles.healthCard}
              onPress={trackWaterIntake}
              activeOpacity={0.8}
            >
              <View style={styles.healthIconContainer}>
                <Text style={styles.healthIcon}>💧</Text>
              </View>
              <Text style={styles.healthMetric}>6/8</Text>
              <Text style={styles.healthLabel}>Glasses of Water</Text>
              <View style={styles.healthProgress}>
                <View style={[styles.healthProgressFill, { width: '75%' }]} />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.healthCard}
              onPress={trackMedication}
              activeOpacity={0.8}
            >
              <View style={styles.healthIconContainer}>
                <Text style={styles.healthIcon}>💊</Text>
              </View>
              <Text style={styles.healthMetric}>1/1</Text>
              <Text style={styles.healthLabel}>Prenatal Vitamins</Text>
              <View style={styles.healthProgress}>
                <View style={[styles.healthProgressFill, { width: '100%', backgroundColor: '#4CAF50' }]} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={[styles.quickAction, styles.quickAction1]} 
              activeOpacity={0.8}
              onPress={() => {
                ActivityService.trackActivity({
                  type: 'app_usage',
                  description: 'Accessed Appointments section'
                });
              }}
            >
              <LinearGradient
                colors={['#a8e6cf', '#88d8a3']}
                style={styles.quickActionGradient}
              >
                <Text style={styles.quickActionIcon}>📅</Text>
                <Text style={styles.quickActionText}>Appointments</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickAction, styles.quickAction2]} 
              activeOpacity={0.8}
              onPress={() => {
                ActivityService.logSymptoms({
                  symptoms: ['General checkup'],
                  severity: 'mild',
                  notes: 'Daily symptom check via dashboard'
                });
              }}
            >
              <LinearGradient
                colors={['#ffd93d', '#ffcd02']}
                style={styles.quickActionGradient}
              >
                <Text style={styles.quickActionIcon}>📝</Text>
                <Text style={styles.quickActionText}>Log Symptoms</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickAction, styles.quickAction3]} 
              activeOpacity={0.8}
              onPress={() => {
                ActivityService.trackActivity({
                  type: 'app_usage',
                  description: 'Accessed Exercise section'
                });
              }}
            >
              <LinearGradient
                colors={['#74b9ff', '#0984e3']}
                style={styles.quickActionGradient}
              >
                <Text style={styles.quickActionIcon}>🏃‍♀️</Text>
                <Text style={styles.quickActionText}>Exercise</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickAction, styles.quickAction4]} 
              activeOpacity={0.8}
              onPress={() => {
                ActivityService.trackActivity({
                  type: 'app_usage',
                  description: 'Accessed Meditation section'
                });
              }}
            >
              <LinearGradient
                colors={['#fd79a8', '#e84393']}
                style={styles.quickActionGradient}
              >
                <Text style={styles.quickActionIcon}>🧘‍♀️</Text>
                <Text style={styles.quickActionText}>Meditation</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured Health Tip */}
        <View style={styles.tipSection}>
          <View style={styles.tipCard}>
            <LinearGradient
              colors={['#FFE0F0', '#FFF0F8']}
              style={styles.tipGradient}
            >
              <View style={styles.tipHeader}>
                <View style={styles.tipIconContainer}>
                  <Text style={styles.tipIcon}>💡</Text>
                </View>
                <View style={styles.tipHeaderText}>
                  <Text style={styles.tipTitle}>Todays Tip</Text>
                  <Text style={styles.tipCategory}>Hydration</Text>
                </View>
              </View>
              <Text style={styles.tipContent}>
                Stay hydrated! Aim for 8-10 glasses of water daily to support your babys development and your own health.
              </Text>
              <TouchableOpacity 
                style={styles.tipAction}
                onPress={() => {
                  ActivityService.trackReading('Daily Hydration Tip', 'tip');
                }}
              >
                <Text style={styles.tipActionText}>Learn More</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>

        {/* Next Appointment Card */}
        <View style={styles.appointmentSection}>
          <Text style={styles.sectionTitle}>Next Appointment</Text>
          <View style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
              <View style={styles.appointmentIconContainer}>
                <Text style={styles.appointmentIcon}>🏥</Text>
              </View>
              <View style={styles.appointmentInfo}>
                <Text style={styles.appointmentTitle}>Routine Checkup</Text>
                <Text style={styles.appointmentDate}>Tomorrow, 10:00 AM</Text>
                <Text style={styles.appointmentDoctor}>Dr. Sarah Johnson</Text>
              </View>
              <TouchableOpacity style={styles.appointmentAction}>
                <Text style={styles.appointmentActionText}>View</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.appointmentDetails}>
              <View style={styles.appointmentDetailItem}>
                <Text style={styles.appointmentDetailIcon}>📍</Text>
                <Text style={styles.appointmentDetailText}>Harare Central Hospital</Text>
              </View>
              <View style={styles.appointmentDetailItem}>
                <Text style={styles.appointmentDetailIcon}>⏱️</Text>
                <Text style={styles.appointmentDetailText}>1 hour duration</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity Timeline */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityTimeline}>
            <View style={styles.activityItem}>
              <View style={styles.activityIconContainer}>
                <Text style={styles.activityIcon}>✅</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Completed prenatal vitamins</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIconContainer}>
                <Text style={styles.activityIcon}>📝</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Logged daily symptoms</Text>
                <Text style={styles.activityTime}>5 hours ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIconContainer}>
                <Text style={styles.activityIcon}>📖</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Read pregnancy article</Text>
                <Text style={styles.activityTime}>1 day ago</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Profile Modal */}
      <Modal
        visible={showProfile}
        animationType="slide"
        onRequestClose={() => setShowProfile(false)}
        transparent={false}
      >
        <ProfileScreen 
          onBack={() => setShowProfile(false)} 
          onLogout={onLogout}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#023337',
    fontWeight: '500',
  },

  // Enhanced Styles
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingSection: {
    flex: 1,
  },
  timeGreeting: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginBottom: 4,
  },
  userName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileIcon: {
    fontSize: 20,
    color: 'white',
  },
  pregnancyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  pregnancyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  pregnancyIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  pregnancyIcon: {
    fontSize: 24,
  },
  pregnancyInfo: {
    flex: 1,
  },
  pregnancyWeek: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 2,
  },
  pregnancyStage: {
    fontSize: 14,
    color: '#4ea674',
    fontWeight: '600',
    marginBottom: 2,
  },
  remainingWeeks: {
    fontSize: 12,
    color: '#666',
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4ea674',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4ea674',
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e8f5e8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  babySizeCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  babySizeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  babySizeTitle: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  babySizeEmoji: {
    fontSize: 20,
  },
  babySizeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 4,
  },
  babySizeDetails: {
    fontSize: 12,
    color: '#666',
  },

  // Emergency Section
  emergencySection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emergencyCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  emergencyGradient: {
    padding: 20,
  },
  emergencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  emergencyIcon: {
    fontSize: 24,
    color: 'white',
  },
  emergencyText: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  emergencySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  emergencyArrow: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
  },

  // Health Overview Styles
  healthOverviewSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  healthGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  healthCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  healthIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  healthIcon: {
    fontSize: 20,
  },
  healthMetric: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 4,
  },
  healthLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  healthProgress: {
    width: '100%',
    height: 4,
    backgroundColor: '#e8f5e8',
    borderRadius: 2,
    overflow: 'hidden',
  },
  healthProgressFill: {
    height: '100%',
    backgroundColor: '#ffd93d',
    borderRadius: 2,
  },

  // Quick Actions Section
  quickActionsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    minWidth: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    margin: 2,
  },
  quickAction1: {},
  quickAction2: {},
  quickAction3: {},
  quickAction4: {},
  quickActionGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },

  // Tip Section
  tipSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tipCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipGradient: {
    padding: 20,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(232, 67, 147, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipHeaderText: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 2,
  },
  tipCategory: {
    fontSize: 12,
    color: '#e84393',
    fontWeight: '600',
  },
  tipContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  tipAction: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(232, 67, 147, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e84393',
  },
  tipActionText: {
    color: '#e84393',
    fontSize: 12,
    fontWeight: '600',
  },

  // Appointment Section
  appointmentSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  appointmentIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  appointmentIcon: {
    fontSize: 20,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 14,
    color: '#4ea674',
    fontWeight: '600',
    marginBottom: 2,
  },
  appointmentDoctor: {
    fontSize: 12,
    color: '#666',
  },
  appointmentAction: {
    backgroundColor: '#4ea674',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  appointmentActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  appointmentDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  appointmentDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentDetailIcon: {
    fontSize: 14,
    marginRight: 10,
    width: 20,
  },
  appointmentDetailText: {
    fontSize: 12,
    color: '#666',
  },

  // Activity Section
  activitySection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  activityTimeline: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityIcon: {
    fontSize: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#023337',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },

  bottomSpacing: {
    height: 20,
  },
});
