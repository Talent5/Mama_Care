import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppointmentBookingModal from '../components/AppointmentBookingModal';
import appointmentService, { CreateAppointmentData } from '../services/appointmentService';
import { Appointment } from '../config/api';

interface AppointmentsScreenProps {
  onBack: () => void;
}

const AppointmentsScreen: React.FC<AppointmentsScreenProps> = ({ onBack }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching appointments...');
      
      // Fetch approved appointments (scheduled/confirmed)
      const response = await appointmentService.getMyAppointments({
        status: 'scheduled'
      });
      
      console.log('Scheduled appointments response:', response);
      
      if (response.success && response.data) {
        // Backend returns { appointments: [...], pagination: {...} }
        const appointmentsData = response.data.appointments || [];
        console.log('Scheduled appointments data:', appointmentsData);
        setAppointments(appointmentsData);
      } else {
        console.log('No scheduled appointments found, using fallback data');
        // Fallback to mock data if API fails
        setAppointments([
          {
            _id: '1',
            patient: 'patient-1',
            provider: 'provider-1',
            date: '2025-08-06',
            time: '10:00',
            type: 'anc_visit',
            status: 'scheduled',
            priority: 'medium',
            notes: 'Routine Checkup',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
          },
          {
            _id: '2',
            patient: 'patient-2', 
            provider: 'provider-2',
            date: '2025-08-10',
            time: '14:30',
            type: 'consultation',
            status: 'scheduled',
            priority: 'medium',
            notes: 'Ultrasound Scan',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
          }
        ]);
      }

      // Fetch pending appointments
      console.log('Fetching pending appointments...');
      const pendingResponse = await appointmentService.getMyAppointments({
        status: 'pending'
      });
      
      console.log('Pending appointments response:', pendingResponse);
      
      if (pendingResponse.success && pendingResponse.data) {
        const pendingData = pendingResponse.data.appointments || [];
        console.log('Pending appointments data:', pendingData);
        setPendingAppointments(pendingData);
      } else {
        console.log('No pending appointments found');
        setPendingAppointments([]);
      }
      
    } catch (error) {
      console.error('Error fetching appointments:', error);
      // Fallback to mock data
      setAppointments([
        {
          _id: '1',
          patient: 'patient-1',
          provider: 'provider-1',
          date: '2025-08-06',
          time: '10:00',
          type: 'anc_visit',
          status: 'scheduled',
          priority: 'medium',
          notes: 'Routine Checkup',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        }
      ]);
      setPendingAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'short'
    });
  };

  const formatTime = (timeString: string) => {
    // Handle undefined or null values
    if (!timeString) {
      return 'TBA';
    }
    
    // Handle both "HH:MM" and "HH:MM AM/PM" formats
    if (timeString.includes('AM') || timeString.includes('PM')) {
      return timeString;
    }
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getAppointmentTime = (appointment: any) => {
    // Handle both old and new appointment data structures
    return appointment.appointmentTime || appointment.time || '';
  };

  const getAppointmentDate = (appointment: any) => {
    // Handle both old and new appointment data structures
    return appointment.appointmentDate || appointment.date || '';
  };

  const getAppointmentTitle = (appointment: Appointment) => {
    return appointment.notes || getTypeLabel(appointment.type);
  };

  const getTypeLabel = (type: string) => {
    const typeLabels: { [key: string]: string } = {
      'consultation': 'Consultation',
      'checkup': 'Routine Checkup',
      'prenatal': 'Prenatal Visit',
      'postnatal': 'Postnatal Visit',
      'emergency': 'Emergency',
      'follow_up': 'Follow-up',
      'vaccination': 'Vaccination',
      'ultrasound': 'Ultrasound',
      'lab_test': 'Lab Test',
      'other': 'Other'
    };
    return typeLabels[type] || type;
  };

  const getDoctorName = (appointment: Appointment) => {
    // For now, return a placeholder as provider is just an ID
    return 'Doctor TBA';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'confirmed': 
        return '#4ea674';
      case 'completed': 
        return '#28a745';
      case 'cancelled': 
        return '#dc3545';
      case 'no_show': 
        return '#fd7e14';
      default: 
        return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'confirmed': 
        return '📅';
      case 'completed': 
        return '✅';
      case 'cancelled': 
        return '❌';
      case 'no_show': 
        return '⏰';
      default: 
        return '📋';
    }
  };

  const upcomingAppointments = appointments.filter(app => 
    app.status === 'scheduled' || app.status === 'confirmed'
  );
  const pastAppointments = appointments.filter(app => 
    app.status === 'completed' || app.status === 'cancelled' || app.status === 'no_show'
  );

  // Appointment booking handler
  const handleCreateAppointment = async (appointmentData: CreateAppointmentData) => {
    try {
      const response = await appointmentService.createAppointment(appointmentData);
      if (response.success) {
        Alert.alert('Success', 'Appointment booked successfully!', [
          { text: 'OK', onPress: () => setShowBookingModal(false) }
        ]);
        // Refresh appointments list
        await fetchAppointments();
      } else {
        throw new Error(response.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    }
  };

  // Phone calling handlers
  const handleCallClinic = async () => {
    const clinicNumber = '+263242791631'; // Example clinic number
    
    Alert.alert(
      'Call Clinic',
      `Call the clinic at ${clinicNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: async () => {
            try {
              const phoneUrl = `tel:${clinicNumber}`;
              const canOpen = await Linking.canOpenURL(phoneUrl);
              
              if (canOpen) {
                await Linking.openURL(phoneUrl);
              } else {
                Alert.alert('Phone Not Available', 'Unable to open phone app. Please call manually.');
              }
            } catch (error) {
              console.error('Call clinic error:', error);
              Alert.alert('Call Failed', 'Unable to make call. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleBookAppointment = () => {
    setShowBookingModal(true);
  };

  const handleReschedule = () => {
    Alert.alert(
      'Reschedule Appointment',
      'Contact the clinic to reschedule your appointment.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Clinic', onPress: handleCallClinic }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header with Gradient */}
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
            <Text style={styles.headerTitle}>Appointments</Text>
            <Text style={styles.headerSubtitle}>Manage your healthcare visits</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.addButton}
            activeOpacity={0.8}
            onPress={() => setShowBookingModal(true)}
          >
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4ea674']}
            tintColor="#4ea674"
          />
        }
      >
        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8} onPress={handleBookAppointment}>
              <Text style={styles.quickActionIcon}>📱</Text>
              <Text style={styles.quickActionText}>Book Appointment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8} onPress={handleCallClinic}>
              <Text style={styles.quickActionIcon}>📞</Text>
              <Text style={styles.quickActionText}>Call Clinic</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8} onPress={handleReschedule}>
              <Text style={styles.quickActionIcon}>🗓️</Text>
              <Text style={styles.quickActionText}>Reschedule</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending Appointments */}
        {pendingAppointments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Approval</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{pendingAppointments.length}</Text>
              </View>
            </View>
            <Text style={styles.emptyStateText}>
              These appointments are waiting for doctor approval. You&apos;ll be notified once they respond.
            </Text>

            {pendingAppointments.map((appointment) => (
              <View key={appointment._id} style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                  <View style={styles.appointmentIconContainer}>
                    <Text style={styles.appointmentIcon}>⏳</Text>
                  </View>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentTitle}>{getAppointmentTitle(appointment)}</Text>
                    <Text style={styles.appointmentDoctor}>{getDoctorName(appointment)}</Text>
                    <View style={styles.appointmentTimeContainer}>
                      <Text style={styles.appointmentDate}>{formatDate(getAppointmentDate(appointment))}</Text>
                      <Text style={styles.appointmentTime}>{formatTime(getAppointmentTime(appointment))}</Text>
                    </View>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Pending</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{upcomingAppointments.length}</Text>
            </View>
          </View>

          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment) => (
              <View key={appointment._id} style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                  <View style={styles.appointmentIconContainer}>
                    <Text style={styles.appointmentIcon}>{getStatusIcon(appointment.status)}</Text>
                  </View>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentTitle}>{getAppointmentTitle(appointment)}</Text>
                    <Text style={styles.appointmentDoctor}>{getDoctorName(appointment)}</Text>
                    <Text style={styles.appointmentType}>{getTypeLabel(appointment.type)}</Text>
                  </View>
                  <View style={styles.appointmentTimeContainer}>
                    <Text style={styles.appointmentDate}>{formatDate(getAppointmentDate(appointment))}</Text>
                    <Text style={styles.appointmentTime}>{formatTime(getAppointmentTime(appointment))}</Text>
                  </View>
                </View>
                
                <View style={styles.appointmentActions}>
                  <TouchableOpacity style={styles.actionButton} activeOpacity={0.8} onPress={() => Alert.alert('View Details', `Appointment details for ${getTypeLabel(appointment.type)} on ${formatDate(getAppointmentDate(appointment))} at ${formatTime(getAppointmentTime(appointment))}`)}>
                    <Text style={styles.actionButtonText}>View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.rescheduleButton]} activeOpacity={0.8} onPress={handleReschedule}>
                    <Text style={[styles.actionButtonText, styles.rescheduleButtonText]}>Reschedule</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>📅</Text>
              <Text style={styles.emptyStateText}>No upcoming appointments</Text>
              <Text style={styles.emptyStateSubtext}>Book your next appointment to stay on track</Text>
            </View>
          )}
        </View>

        {/* Past Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Past Appointments</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{pastAppointments.length}</Text>
            </View>
          </View>

          {pastAppointments.map((appointment) => (
            <View key={appointment._id} style={[styles.appointmentCard, styles.pastAppointmentCard]}>
              <View style={styles.appointmentHeader}>
                <View style={styles.appointmentIconContainer}>
                  <Text style={styles.appointmentIcon}>{getStatusIcon(appointment.status)}</Text>
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentTitle}>{getAppointmentTitle(appointment)}</Text>
                  <Text style={styles.appointmentDoctor}>{getDoctorName(appointment)}</Text>
                  <Text style={styles.appointmentType}>{getTypeLabel(appointment.type)}</Text>
                </View>
                <View style={styles.appointmentTimeContainer}>
                  <Text style={styles.appointmentDate}>{formatDate(getAppointmentDate(appointment))}</Text>
                  <Text style={styles.appointmentTime}>{formatTime(getAppointmentTime(appointment))}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                    <Text style={styles.statusText}>{appointment.status}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Appointment Booking Modal */}
      <AppointmentBookingModal
        visible={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onBookAppointment={handleCreateAppointment}
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  
  // Content styles
  content: {
    flex: 1,
  },
  
  // Quick actions styles
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
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
  
  // Appointment card styles
  appointmentCard: {
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
  pastAppointmentCard: {
    opacity: 0.8,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  appointmentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f9f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appointmentIcon: {
    fontSize: 24,
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
  appointmentDoctor: {
    fontSize: 14,
    color: '#4ea674',
    fontWeight: '600',
    marginBottom: 2,
  },
  appointmentType: {
    fontSize: 12,
    color: '#666',
  },
  appointmentTimeContainer: {
    alignItems: 'flex-end',
  },
  appointmentDate: {
    fontSize: 12,
    color: '#023337',
    fontWeight: '600',
    marginBottom: 2,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#4ea674',
    fontWeight: 'bold',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  
  // Actions styles
  appointmentActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#4ea674',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rescheduleButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4ea674',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  rescheduleButtonText: {
    color: '#4ea674',
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
  
  bottomSpacing: {
    height: 30,
  },
});

export default AppointmentsScreen;
