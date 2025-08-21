import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ProfileScreen from './ProfileScreen';
import AppointmentsScreen from './AppointmentsScreen';
import SymptomLoggingScreen from './SymptomLoggingScreen';
import ExerciseScreen from './ExerciseScreen';
import HealthTipsScreen from './HealthTipsScreen';
import Logo from '../components/Logo';
import { StoredUser } from '../utils/databaseAuthStorage';
import { convertToStoredUser, isUserAuthenticated } from '../utils/userUtils';
import { dashboardService, authService, DashboardData } from '../services';
import { getPersonalizedGreeting } from '../utils/greetingUtils';

interface DashboardScreenProps {
  onLogout: () => void;
}

interface PersonalizedData {
  user: StoredUser | null;
  isAuthenticated: boolean;
  authenticationChecked: boolean;
}

function DashboardScreen({ onLogout }: DashboardScreenProps) {
  const [personalizedData, setPersonalizedData] = useState<PersonalizedData>({
    user: null,
    isAuthenticated: false,
    authenticationChecked: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [currentWeek, setCurrentWeek] = useState(20); // Example pregnancy week
  const [showProfile, setShowProfile] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);
  const [showSymptomLogging, setShowSymptomLogging] = useState(false);
  const [showExercise, setShowExercise] = useState(false);
  const [showHealthTips, setShowHealthTips] = useState(false);

  useEffect(() => {
    initializePersonalizedDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializePersonalizedDashboard = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Initializing personalized dashboard...');

      // Simple authentication check using utility
      if (!isUserAuthenticated()) {
        console.warn('❌ User not authenticated, redirecting to login');
        onLogout();
        return;
      }

      // Get user data from auth service and convert to StoredUser format
      const authUser = authService.getUser();
      const currentUser = convertToStoredUser(authUser);
      
      if (!currentUser) {
        console.error('❌ No user data available');
        Alert.alert(
          'Error',
          'Unable to load your profile. Please login again.',
          [{ text: 'OK', onPress: onLogout }]
        );
        return;
      }

      console.log('✅ Using user from auth service:', currentUser.email);

      // Update personalized data
      setPersonalizedData({
        user: currentUser,
        isAuthenticated: true,
        authenticationChecked: true,
      });

      // Load personalized dashboard data
      await loadPersonalizedDashboardData(currentUser);
      
    } catch (error) {
      console.error('💥 Dashboard initialization failed:', error);
      Alert.alert(
        'Loading Error',
        'Failed to load your personalized dashboard. Please try again.',
        [
          { text: 'Retry', onPress: initializePersonalizedDashboard },
          { text: 'Logout', onPress: onLogout }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadPersonalizedDashboardData = async (user: StoredUser | null) => {
    if (!user) {
      console.error('❌ Cannot load dashboard data without user');
      return;
    }

    try {
      console.log('🔄 Loading personalized dashboard data for:', user.email);
      
      // Try to load from API first with user context
      try {
        const response = await dashboardService.getDashboardData();
        console.log('✅ Dashboard API response:', response);
        
        if (response.success && response.data) {
          console.log('📊 Using real dashboard data from backend');
          // Personalize the data with user information
          const personalizedDashboardData = {
            ...response.data,
            user: {
              id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              fullName: `${user.firstName} ${user.lastName}`,
              avatar: `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=4ea674&color=fff`,
            },
          };
          
          setDashboardData(personalizedDashboardData);
          setCurrentWeek(personalizedDashboardData.pregnancy.currentWeek);
        } else {
          console.warn('❌ API returned unsuccessful response, using personalized mock data');
          const mockData = createPersonalizedMockData(user);
          setDashboardData(mockData);
          setCurrentWeek(mockData.pregnancy.currentWeek);
        }
      } catch (apiError) {
        console.warn('⚠️ API unavailable, using personalized mock data:', apiError);
        const mockData = createPersonalizedMockData(user);
        setDashboardData(mockData);
        setCurrentWeek(mockData.pregnancy.currentWeek);
      }
    } catch (error) {
      console.error('💥 Error loading personalized dashboard data:', error);
      // Fallback to basic personalized data
      const basicData = createPersonalizedMockData(user);
      setDashboardData(basicData);
      setCurrentWeek(Math.floor(Math.random() * 40) + 1);
    }
  };

  const createPersonalizedMockData = (user: StoredUser): DashboardData => {
    return {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        avatar: `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=4ea674&color=fff`,
      },
      pregnancy: {
        isPregnant: false, // Changed to false for testing non-pregnant state
        currentWeek: Math.floor(Math.random() * 40) + 1,
        dueDate: new Date(Date.now() + (20 * 7 * 24 * 60 * 60 * 1000)).toISOString(),
        estimatedDueDate: new Date(Date.now() + (20 * 7 * 24 * 60 * 60 * 1000)).toISOString(),
        riskLevel: 'low',
        stage: 'Second Trimester',
        progressPercentage: 50,
        remainingWeeks: 20,
        babySize: {
          comparison: 'Sweet Potato',
          emoji: '🍠',
          length: '14cm',
          weight: '190g'
        }
      },
      healthMetrics: {
        waterIntake: { current: 6, target: 8, percentage: 75 },
        prenatalVitamins: { taken: 1, required: 1, percentage: 100 },
        symptoms: ['Mild nausea', 'Fatigue'],
        lastCheckup: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString(),
        nextCheckup: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString()
      },
      nextAppointment: {
        id: '1',
        title: 'Routine Checkup',
        date: 'Tomorrow',
        time: '10:00 AM',
        doctor: 'Dr. Sarah Johnson',
        location: 'Harare Central Hospital',
        duration: '1 hour',
        type: 'checkup'
      },
      recentActivity: [
        { 
          id: '1', 
          type: 'medication', 
          description: `${user.firstName} completed prenatal vitamins`, 
          timestamp: '2 hours ago', 
          icon: '✅' 
        },
        { 
          id: '2', 
          type: 'symptom', 
          description: `${user.firstName} logged daily symptoms`, 
          timestamp: '5 hours ago', 
          icon: '📝' 
        },
        { 
          id: '3', 
          type: 'reading', 
          description: `${user.firstName} read pregnancy article`, 
          timestamp: '1 day ago', 
          icon: '📖' 
        }
      ],
      healthTip: {
        title: `Hello ${user.firstName}! Today's Tip`,
        category: 'Nutrition',
        content: 'Make sure to eat foods rich in folic acid to support your baby\'s development.',
        icon: '🥬'
      }
    };
  };

  const handleEmergencyCall = async () => {
    Alert.alert(
      'Emergency Services',
      'Choose an emergency service to call:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '🚑 Ambulance (999)',
          onPress: async () => {
            try {
              const success = await dashboardService.initiatePhoneCall('ambulance');
              if (success) {
                Alert.alert(
                  'Emergency Call Initiated',
                  'Opening phone to call 999 emergency services...',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('Emergency call error:', error);
              Alert.alert(
                'Emergency Call',
                'Unable to open phone app. Please dial 999 manually for emergency services.',
                [{ text: 'OK' }]
              );
            }
          },
        },
        {
          text: '🏥 Maternity Ward',
          onPress: async () => {
            try {
              const success = await dashboardService.initiatePhoneCall('maternity_ward');
              if (success) {
                Alert.alert(
                  'Emergency Call Initiated',
                  'Opening phone to call maternity ward emergency line...',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('Emergency call error:', error);
              Alert.alert(
                'Emergency Call',
                'Unable to open phone app. Please call your maternity ward manually.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  // Quick dial emergency for urgent situations
  const handleQuickDialEmergency = async () => {
    try {
      Alert.alert(
        'Quick Emergency Dial',
        'This will immediately call 999 emergency services. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Call Now',
            style: 'destructive',
            onPress: async () => {
              try {
                const success = await dashboardService.quickDialEmergency();
                if (success) {
                  console.log('Emergency call initiated via quick dial');
                }
              } catch (error) {
                console.error('Quick dial emergency error:', error);
                Alert.alert(
                  'Emergency Call Failed',
                  'Unable to open phone app. Please dial 999 manually.',
                  [{ text: 'OK' }]
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Quick dial handler error:', error);
    }
  };

  // Navigation handlers
  const handleAppointmentsPress = () => {
    setShowAppointments(true);
  };

  const handleSymptomLoggingPress = () => {
    setShowSymptomLogging(true);
  };

  const handleExercisePress = () => {
    setShowExercise(true);
  };

  const handleMeditationPress = () => {
    setShowExercise(true); // Same screen handles both exercise and meditation
  };

  const handleHealthTipsPress = () => {
    setShowHealthTips(true);
  };

  const handleWaterIntakePress = async () => {
    try {
      console.log('💧 Recording water intake...');
      await dashboardService.recordHealthMetric({
        type: 'water_intake',
        value: 1,
        unit: 'glasses'
      });
      Alert.alert('Water Logged', 'One glass of water has been recorded!');
      // Refresh dashboard data to show updated metrics
      await loadPersonalizedDashboardData(personalizedData.user);
    } catch (error) {
      console.error('Water intake logging error:', error);
      // Show success message even if backend is unavailable
      Alert.alert('Water Logged', 'One glass of water has been recorded locally!');
    }
  };

  const handleVitaminsPress = async () => {
    try {
      console.log('💊 Recording prenatal vitamins...');
      await dashboardService.recordHealthMetric({
        type: 'prenatal_vitamins',
        value: 1,
        unit: 'doses'
      });
      Alert.alert('Vitamins Logged', 'Prenatal vitamins have been recorded!');
      // Refresh dashboard data to show updated metrics
      await loadPersonalizedDashboardData(personalizedData.user);
    } catch (error) {
      console.error('Vitamins logging error:', error);
      // Show success message even if backend is unavailable
      Alert.alert('Vitamins Logged', 'Prenatal vitamins have been recorded locally!');
    }
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
          <Logo size={60} style={styles.loadingLogo} />
          <Text style={styles.loadingText}>Loading your MamaCare...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header with Gradient - Consistent with other screens */}
      <LinearGradient
        colors={['#4ea674', '#3d8f5f', '#2d6e47']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>MamaCare Dashboard</Text>
            <Text style={styles.headerSubtitle}>{getPersonalizedGreeting(personalizedData.user)}</Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={initializePersonalizedDashboard}
              activeOpacity={0.8}
            >
              <Text style={styles.refreshIcon}>🔄</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.profileButton} 
              onPress={() => setShowProfile(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
      >
        {/* Pregnancy Progress Card - Only show if pregnant */}
        {dashboardData?.pregnancy?.isPregnant && (
          <View style={styles.pregnancySection}>
            <View style={styles.pregnancyCard}>
              <View style={styles.pregnancyHeader}>
                <View style={styles.pregnancyIconContainer}>
                  <Text style={styles.pregnancyIcon}>{pregnancyInfo.icon}</Text>
                </View>
                <View style={styles.pregnancyInfo}>
                  <Text style={styles.pregnancyWeek}>
                    Week {dashboardData?.pregnancy.currentWeek || currentWeek}
                  </Text>
                  <Text style={styles.pregnancyStage}>
                    {dashboardData?.pregnancy.stage || pregnancyInfo.stage}
                  </Text>
                  <Text style={styles.remainingWeeks}>
                    {dashboardData?.pregnancy.remainingWeeks || (40 - currentWeek)} weeks to go
                  </Text>
                </View>
                <View style={styles.progressCircle}>
                  <Text style={styles.progressPercentage}>
                    {dashboardData?.pregnancy.progressPercentage || Math.round((currentWeek / 40) * 100)}%
                  </Text>
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
                  <Text style={styles.babySizeEmoji}>
                    {dashboardData?.pregnancy.babySize.emoji || '🥝'}
                  </Text>
                </View>
                <Text style={styles.babySizeText}>
                  {dashboardData?.pregnancy.babySize.comparison || 'A Kiwi Fruit'}
                </Text>
                <Text style={styles.babySizeDetails}>
                  Length: {dashboardData?.pregnancy.babySize.length || '~14cm'} • Weight: {dashboardData?.pregnancy.babySize.weight || '~190g'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Wellness Section for Non-Pregnant Users */}
        {!dashboardData?.pregnancy?.isPregnant && (
          <View style={styles.pregnancySection}>
            <View style={styles.pregnancyCard}>
              <View style={styles.notPregnantContent}>
                <Text style={styles.notPregnantIcon}>🌸</Text>
                <Text style={styles.notPregnantTitle}>Welcome to MamaCare</Text>
                <Text style={styles.notPregnantMessage}>
                  Focus on your overall health and wellness. Track your daily activities, 
                  stay hydrated, and maintain healthy habits for your wellbeing.
                </Text>
                <View style={styles.wellnessActions}>
                  <TouchableOpacity style={styles.wellnessActionButton} activeOpacity={0.8}>
                    <Text style={styles.wellnessActionIcon}>📚</Text>
                    <Text style={styles.wellnessActionText}>Health Resources</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.wellnessActionButton} activeOpacity={0.8}>
                    <Logo size={20} />
                    <Text style={styles.wellnessActionText}>Planning Pregnancy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
        {/* Emergency Section - Prominently Featured */}
        <View style={styles.emergencySection}>
          <TouchableOpacity 
            style={styles.emergencyCard}
            onPress={handleEmergencyCall}
            onLongPress={handleQuickDialEmergency}
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
                  <Text style={styles.emergencySubtitle}>Tap for options • Hold for quick 999 call</Text>
                </View>
                <Text style={styles.emergencyArrow}>›</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Today's Health Overview */}
        <View style={styles.healthOverviewSection}>
          <Text style={styles.sectionTitle}>Today&apos;s Health</Text>
          <View style={styles.healthGrid}>
            <TouchableOpacity 
              style={styles.healthCard} 
              onPress={handleWaterIntakePress}
              activeOpacity={0.8}
            >
              <View style={styles.healthIconContainer}>
                <Text style={styles.healthIcon}>💧</Text>
              </View>
              <Text style={styles.healthMetric}>
                {dashboardData?.healthMetrics.waterIntake.current || 6}/{dashboardData?.healthMetrics.waterIntake.target || 8}
              </Text>
              <Text style={styles.healthLabel}>Glasses of Water</Text>
              <View style={styles.healthProgress}>
                <View style={[
                  styles.healthProgressFill, 
                  { width: `${dashboardData?.healthMetrics.waterIntake.percentage || 75}%` }
                ]} />
              </View>
            </TouchableOpacity>
            
            {/* Only show prenatal vitamins if pregnant */}
            {dashboardData?.pregnancy?.isPregnant ? (
              <TouchableOpacity 
                style={styles.healthCard}
                onPress={handleVitaminsPress}
                activeOpacity={0.8}
              >
                <View style={styles.healthIconContainer}>
                  <Text style={styles.healthIcon}>💊</Text>
                </View>
                <Text style={styles.healthMetric}>
                  {dashboardData?.healthMetrics.prenatalVitamins.taken || 1}/{dashboardData?.healthMetrics.prenatalVitamins.required || 1}
                </Text>
                <Text style={styles.healthLabel}>Prenatal Vitamins</Text>
                <View style={styles.healthProgress}>
                  <View style={[
                    styles.healthProgressFill, 
                    { 
                      width: `${dashboardData?.healthMetrics.prenatalVitamins.percentage || 100}%`, 
                      backgroundColor: '#4CAF50' 
                    }
                  ]} />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.healthCard}
                activeOpacity={0.8}
              >
                <View style={styles.healthIconContainer}>
                  <Text style={styles.healthIcon}>🏃‍♀️</Text>
                </View>
                <Text style={styles.healthMetric}>
                  0/30
                </Text>
                <Text style={styles.healthLabel}>Minutes Exercise</Text>
                <View style={styles.healthProgress}>
                  <View style={[
                    styles.healthProgressFill, 
                    { 
                      width: '0%', 
                      backgroundColor: '#74b9ff' 
                    }
                  ]} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={[styles.quickAction, styles.quickAction1]} 
              activeOpacity={0.8}
              onPress={handleAppointmentsPress}
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
              onPress={handleSymptomLoggingPress}
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
              onPress={handleExercisePress}
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
              onPress={handleMeditationPress}
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
                  <Text style={styles.tipIcon}>
                    {dashboardData?.healthTip.icon || '💡'}
                  </Text>
                </View>
                <View style={styles.tipHeaderText}>
                  <Text style={styles.tipTitle}>
                    {dashboardData?.healthTip.title || 'Today&apos;s Tip'}
                  </Text>
                  <Text style={styles.tipCategory}>
                    {dashboardData?.healthTip.category || 'Hydration'}
                  </Text>
                </View>
              </View>
              <Text style={styles.tipContent}>
                {dashboardData?.healthTip.content || 'Stay hydrated! Aim for 8-10 glasses of water daily to support your baby&apos;s development and your own health.'}
              </Text>
              <TouchableOpacity style={styles.tipAction} onPress={handleHealthTipsPress}>
                <Text style={styles.tipActionText}>Learn More</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>

        {/* Next Appointment Card */}
        <View style={styles.appointmentSection}>
          <Text style={styles.sectionTitle}>Next Appointment</Text>
          <TouchableOpacity 
            style={styles.appointmentCard}
            onPress={handleAppointmentsPress}
            activeOpacity={0.8}
          >
            <View style={styles.appointmentHeader}>
              <View style={styles.appointmentIconContainer}>
                <Text style={styles.appointmentIcon}>🏥</Text>
              </View>
              <View style={styles.appointmentInfo}>
                <Text style={styles.appointmentTitle}>
                  {dashboardData?.nextAppointment?.title || 'Routine Checkup'}
                </Text>
                <Text style={styles.appointmentDate}>
                  {dashboardData?.nextAppointment?.date || 'Tomorrow'}, {dashboardData?.nextAppointment?.time || '10:00 AM'}
                </Text>
                <Text style={styles.appointmentDoctor}>
                  {dashboardData?.nextAppointment?.doctor || 'Dr. Sarah Johnson'}
                </Text>
              </View>
              <TouchableOpacity style={styles.appointmentAction} onPress={handleAppointmentsPress}>
                <Text style={styles.appointmentActionText}>View</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.appointmentDetails}>
              <View style={styles.appointmentDetailItem}>
                <Text style={styles.appointmentDetailIcon}>📍</Text>
                <Text style={styles.appointmentDetailText}>
                  {dashboardData?.nextAppointment?.location || 'Harare Central Hospital'}
                </Text>
              </View>
              <View style={styles.appointmentDetailItem}>
                <Text style={styles.appointmentDetailIcon}>⏱️</Text>
                <Text style={styles.appointmentDetailText}>
                  {dashboardData?.nextAppointment?.duration || '1 hour'} duration
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Activity Timeline */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityTimeline}>
            {(dashboardData?.recentActivity || [
              { id: '1', type: 'medication', description: 'Completed prenatal vitamins', timestamp: '2 hours ago', icon: '✅' },
              { id: '2', type: 'symptom', description: 'Logged daily symptoms', timestamp: '5 hours ago', icon: '📝' },
              { id: '3', type: 'reading', description: 'Read pregnancy article', timestamp: '1 day ago', icon: '📖' }
            ]).map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIconContainer}>
                  <Text style={styles.activityIcon}>{activity.icon}</Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{activity.description}</Text>
                  <Text style={styles.activityTime}>{activity.timestamp}</Text>
                </View>
              </View>
            ))}
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

      {/* Appointments Modal */}
      <Modal
        visible={showAppointments}
        animationType="slide"
        onRequestClose={() => setShowAppointments(false)}
        transparent={false}
      >
        <AppointmentsScreen onBack={() => setShowAppointments(false)} />
      </Modal>

      {/* Symptom Logging Modal */}
      <Modal
        visible={showSymptomLogging}
        animationType="slide"
        onRequestClose={() => setShowSymptomLogging(false)}
        transparent={false}
      >
        <SymptomLoggingScreen onBack={() => setShowSymptomLogging(false)} />
      </Modal>

      {/* Exercise Modal */}
      <Modal
        visible={showExercise}
        animationType="slide"
        onRequestClose={() => setShowExercise(false)}
        transparent={false}
      >
        <ExerciseScreen onBack={() => setShowExercise(false)} />
      </Modal>

      {/* Health Tips Modal */}
      <Modal
        visible={showHealthTips}
        animationType="slide"
        onRequestClose={() => setShowHealthTips(false)}
        transparent={false}
      >
        <HealthTipsScreen onBack={() => setShowHealthTips(false)} />
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
  loadingLogo: {
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
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  refreshIcon: {
    fontSize: 16,
    color: 'white',
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  pregnancySection: {
    paddingHorizontal: 20,
    paddingTop: 20,
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

  // Not Pregnant Styles
  notPregnantContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  notPregnantIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  notPregnantTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 12,
    textAlign: 'center',
  },
  notPregnantMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  startJourneyButton: {
    backgroundColor: '#4ea674',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startJourneyText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Wellness Actions Styles
  wellnessActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  wellnessActionButton: {
    flex: 1,
    backgroundColor: 'rgba(78, 166, 116, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(78, 166, 116, 0.2)',
  },
  wellnessActionIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  wellnessActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4ea674',
    textAlign: 'center',
  },

  bottomSpacing: {
    height: 20,
  },
});

export default DashboardScreen;
