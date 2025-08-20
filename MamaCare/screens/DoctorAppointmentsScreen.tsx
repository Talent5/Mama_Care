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
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import appointmentService from '../services/appointmentService';
import { Appointment } from '../config/api';

interface DoctorAppointmentsScreenProps {
  onBack: () => void;
}

const DoctorAppointmentsScreen: React.FC<DoctorAppointmentsScreenProps> = ({ onBack }) => {
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [proposedDate, setProposedDate] = useState(new Date());
  const [proposedTime, setProposedTime] = useState(new Date());
  const [doctorNotes, setDoctorNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    fetchPendingAppointments();
  }, []);

  const fetchPendingAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getPendingAppointments();
      
      if (response.success && response.data) {
        setPendingAppointments(response.data.appointments || []);
      } else {
        // Fallback to mock data for testing
        setPendingAppointments([
          {
            _id: '1',
            patient: 'patient-1',
            provider: 'provider-1',
            date: '2025-08-06',
            time: '10:00',
            type: 'consultation',
            status: 'pending',
            priority: 'medium',
            notes: 'Patient reports feeling unwell',
            createdAt: '2025-08-05T00:00:00Z',
            updatedAt: '2025-08-05T00:00:00Z'
          },
          {
            _id: '2',
            patient: 'patient-2',
            provider: 'provider-2',
            date: '2025-08-07',
            time: '14:30',
            type: 'anc_visit',
            status: 'pending',
            priority: 'high',
            notes: 'Routine prenatal checkup',
            createdAt: '2025-08-05T00:00:00Z',
            updatedAt: '2025-08-05T00:00:00Z'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching pending appointments:', error);
      Alert.alert('Error', 'Failed to fetch pending appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPendingAppointments();
    setRefreshing(false);
  };

  const openApprovalModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setProposedDate(new Date(appointment.date));
    // Parse time string to Date object
    const [hours, minutes] = appointment.time.split(':');
    const timeDate = new Date();
    timeDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    setProposedTime(timeDate);
    setDoctorNotes('');
    setRejectionReason('');
    setShowApprovalModal(true);
  };

  const handleApprove = async () => {
    if (!selectedAppointment) return;

    try {
      setLoading(true);
      const appointmentData = {
        appointmentDate: proposedDate.toISOString().split('T')[0],
        appointmentTime: proposedTime.toTimeString().slice(0, 5),
        doctorNotes: doctorNotes.trim()
      };

      const response = await appointmentService.approveAppointment(
        selectedAppointment._id,
        appointmentData
      );

      if (response.success) {
        Alert.alert('Success', 'Appointment approved successfully');
        setShowApprovalModal(false);
        await fetchPendingAppointments();
      } else {
        Alert.alert('Error', response.message || 'Failed to approve appointment');
      }
    } catch (error) {
      console.error('Error approving appointment:', error);
      Alert.alert('Error', 'Failed to approve appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAppointment || !rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    try {
      setLoading(true);
      const response = await appointmentService.rejectAppointment(
        selectedAppointment._id,
        rejectionReason.trim()
      );

      if (response.success) {
        Alert.alert('Success', 'Appointment rejected');
        setShowApprovalModal(false);
        await fetchPendingAppointments();
      } else {
        Alert.alert('Error', response.message || 'Failed to reject appointment');
      }
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      Alert.alert('Error', 'Failed to reject appointment');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type: string) => {
    const typeLabels: { [key: string]: string } = {
      'consultation': 'Consultation',
      'anc_visit': 'ANC Visit',
      'emergency': 'Emergency',
      'follow_up': 'Follow-up',
      'vaccination': 'Vaccination'
    };
    return typeLabels[type] || type;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ff4757';
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffa726';
      case 'low': return '#66bb6a';
      default: return '#ffa726';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4ea674', '#3d8f5f']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Appointment Requests</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4ea674']}
          />
        }
      >
        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Pending Requests</Text>
          <Text style={styles.summaryCount}>{pendingAppointments.length}</Text>
        </View>

        {/* Pending Appointments */}
        {pendingAppointments.length > 0 ? (
          pendingAppointments.map((appointment) => (
            <View key={appointment._id} style={styles.appointmentCard}>
              <View style={styles.cardHeader}>
                <View style={styles.typeContainer}>
                  <Text style={styles.appointmentType}>{getTypeLabel(appointment.type)}</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(appointment.priority) }]}>
                    <Text style={styles.priorityText}>{appointment.priority.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.requestDate}>
                  Requested: {new Date(appointment.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.patientName}>Patient Request</Text>
                <Text style={styles.appointmentReason}>{appointment.notes}</Text>
                
                <View style={styles.timeContainer}>
                  <Text style={styles.requestedTime}>
                    Requested: {formatDate(new Date(appointment.date))} at {appointment.time}
                  </Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => {
                    setSelectedAppointment(appointment);
                    setRejectionReason('');
                    Alert.prompt(
                      'Reject Appointment',
                      'Please provide a reason for rejection:',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Reject', 
                          onPress: (reason) => {
                            if (reason?.trim()) {
                              setRejectionReason(reason.trim());
                              handleReject();
                            }
                          }
                        }
                      ],
                      'plain-text'
                    );
                  }}
                >
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => openApprovalModal(appointment)}
                >
                  <Text style={styles.approveButtonText}>Review & Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Pending Requests</Text>
            <Text style={styles.emptyStateText}>
              All appointment requests have been reviewed
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Approval Modal */}
      <Modal
        visible={showApprovalModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowApprovalModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Review Appointment</Text>
            <TouchableOpacity onPress={handleApprove} disabled={loading}>
              <Text style={[styles.modalApprove, loading && styles.modalApproveDisabled]}>
                {loading ? 'Approving...' : 'Approve'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedAppointment && (
              <>
                <View style={styles.appointmentSummary}>
                  <Text style={styles.summaryLabel}>Type:</Text>
                  <Text style={styles.summaryValue}>{getTypeLabel(selectedAppointment.type)}</Text>
                  
                  <Text style={styles.summaryLabel}>Reason:</Text>
                  <Text style={styles.summaryValue}>{selectedAppointment.notes}</Text>
                  
                  <Text style={styles.summaryLabel}>Priority:</Text>
                  <Text style={styles.summaryValue}>{selectedAppointment.priority}</Text>
                </View>

                <View style={styles.timeSection}>
                  <Text style={styles.sectionTitle}>Appointment Time</Text>
                  
                  <TouchableOpacity 
                    style={styles.timeButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.timeLabel}>Date:</Text>
                    <Text style={styles.timeValue}>{formatDate(proposedDate)}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.timeButton}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={styles.timeLabel}>Time:</Text>
                    <Text style={styles.timeValue}>{formatTime(proposedTime)}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.notesSection}>
                  <Text style={styles.sectionTitle}>Doctor Notes (Optional)</Text>
                  <TextInput
                    style={styles.notesInput}
                    value={doctorNotes}
                    onChangeText={setDoctorNotes}
                    placeholder="Add any notes for the patient..."
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </>
            )}
          </ScrollView>

          {/* Date/Time Pickers */}
          {showDatePicker && (
            <DateTimePicker
              value={proposedDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setProposedDate(selectedDate);
                }
              }}
              minimumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={proposedTime}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) {
                  setProposedTime(selectedTime);
                }
              }}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fdf9',
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summary: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  summaryCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4ea674',
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  appointmentType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#023337',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  requestDate: {
    fontSize: 12,
    color: '#666',
  },
  cardBody: {
    padding: 16,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#023337',
    marginBottom: 8,
  },
  appointmentReason: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  timeContainer: {
    backgroundColor: '#f8fdf9',
    padding: 12,
    borderRadius: 8,
  },
  requestedTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#023337',
  },
  cardActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ff4757',
  },
  rejectButtonText: {
    color: '#ff4757',
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#4ea674',
  },
  approveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#023337',
  },
  modalApprove: {
    fontSize: 16,
    color: '#4ea674',
    fontWeight: '600',
  },
  modalApproveDisabled: {
    color: '#ccc',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  appointmentSummary: {
    backgroundColor: '#f8fdf9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#023337',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    color: '#666',
  },
  timeSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 12,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8fdf9',
    borderRadius: 8,
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#023337',
  },
  timeValue: {
    fontSize: 14,
    color: '#666',
  },
  notesSection: {
    marginBottom: 20,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    backgroundColor: '#ffffff',
  },
});

export default DoctorAppointmentsScreen;
