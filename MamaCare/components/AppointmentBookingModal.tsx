import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import doctorService from '../services/doctorService';
import patientService from '../services/patientService';

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  specialization?: string;
  role: string;
}

interface Patient {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface AppointmentBookingModalProps {
  visible: boolean;
  onClose: () => void;
  onBookAppointment: (appointmentData: any) => Promise<void>;
}

const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  visible,
  onClose,
  onBookAppointment,
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // Form state
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [appointmentType, setAppointmentType] = useState<string>('consultation');
  const [priority, setPriority] = useState<string>('medium');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('30');
  
  // Date/time picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const appointmentTypes = [
    { label: 'Consultation', value: 'consultation' },
    { label: 'Routine Checkup', value: 'checkup' },
    { label: 'Prenatal Visit', value: 'prenatal' },
    { label: 'Postnatal Visit', value: 'postnatal' },
    { label: 'Emergency', value: 'emergency' },
    { label: 'Follow-up', value: 'follow_up' },
    { label: 'Vaccination', value: 'vaccination' },
    { label: 'Ultrasound', value: 'ultrasound' },
    { label: 'Lab Test', value: 'lab_test' },
    { label: 'Other', value: 'other' },
  ];

  const priorities = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Urgent', value: 'urgent' },
  ];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00'
  ];

  useEffect(() => {
    if (visible) {
      fetchDoctors();
      fetchCurrentPatient();
      resetForm();
    }
  }, [visible]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await doctorService.getDoctors();
      
      if (response.success && response.data) {
        setDoctors(response.data.doctors);
      } else {
        // Fallback to mock data if API fails
        const mockDoctors: Doctor[] = [
          {
            _id: '1',
            firstName: 'Dr. Sarah',
            lastName: 'Johnson',
            specialization: 'Obstetrics & Gynecology',
            role: 'doctor'
          },
          {
            _id: '2',
            firstName: 'Dr. James',
            lastName: 'Chitando',
            specialization: 'General Medicine',
            role: 'doctor'
          },
          {
            _id: '3',
            firstName: 'Dr. Sarah',
            lastName: 'Mukamuri',
            specialization: 'Pediatrics',
            role: 'doctor'
          },
          {
            _id: '4',
            firstName: 'Dr. Michael',
            lastName: 'Nyoni',
            specialization: 'Family Medicine',
            role: 'doctor'
          },
        ];
        setDoctors(mockDoctors);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      // Fallback to mock data
      const mockDoctors: Doctor[] = [
        {
          _id: '1',
          firstName: 'Dr. Sarah',
          lastName: 'Johnson',
          specialization: 'Obstetrics & Gynecology',
          role: 'doctor'
        },
        {
          _id: '2',
          firstName: 'Dr. James',
          lastName: 'Chitando',
          specialization: 'General Medicine',
          role: 'doctor'
        },
        {
          _id: '3',
          firstName: 'Dr. Sarah',
          lastName: 'Mukamuri',
          specialization: 'Pediatrics',
          role: 'doctor'
        },
        {
          _id: '4',
          firstName: 'Dr. Michael',
          lastName: 'Nyoni',
          specialization: 'Family Medicine',
          role: 'doctor'
        },
      ];
      setDoctors(mockDoctors);
      Alert.alert('Notice', 'Using offline doctors list. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentPatient = async () => {
    try {
      const response = await patientService.getMyProfile();
      
      if (response.success && response.data) {
        // Handle both possible data structures
        const patient = response.data;
        const patientData: Patient = {
          _id: patient._id,
          user: {
            firstName: patient.firstName || 'Current',
            lastName: patient.lastName || 'User'
          }
        };
        setPatients([patientData]);
        setSelectedPatient(patientData._id);
      } else {
        // Fallback to mock patient
        const mockPatients: Patient[] = [
          {
            _id: '1',
            user: {
              firstName: 'Current',
              lastName: 'User'
            }
          }
        ];
        setPatients(mockPatients);
        setSelectedPatient(mockPatients[0]._id);
      }
    } catch (error) {
      console.error('Error fetching current patient:', error);
      // Fallback to mock patient
      const mockPatients: Patient[] = [
        {
          _id: '1',
          user: {
            firstName: 'Current',
            lastName: 'User'
          }
        }
      ];
      setPatients(mockPatients);
      setSelectedPatient(mockPatients[0]._id);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedDoctor('');
    setSelectedDate(new Date());
    setSelectedTime(new Date());
    setAppointmentType('consultation');
    setPriority('medium');
    setReason('');
    setNotes('');
    setDuration('30');
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setSelectedTime(selectedTime);
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

  const validateStep1 = () => {
    if (!selectedDoctor) {
      Alert.alert('Validation Error', 'Please select a doctor');
      return false;
    }
    if (!appointmentType) {
      Alert.alert('Validation Error', 'Please select appointment type');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!reason.trim()) {
      Alert.alert('Validation Error', 'Please provide a reason for the appointment');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const appointmentData = {
        patientId: selectedPatient,
        healthcareProviderId: selectedDoctor,
        appointmentDate: selectedDate.toISOString().split('T')[0],
        appointmentTime: formatTime(selectedTime),
        type: appointmentType,
        priority,
        reason,
        notes,
        duration: parseInt(duration),
      };

      console.log('Submitting appointment request:', appointmentData);
      const response = await onBookAppointment(appointmentData);
      console.log('Appointment response:', response);
      
      onClose();
      Alert.alert(
        'Request Submitted', 
        'Your appointment request has been sent to the doctor. You will be notified once they approve and confirm the appointment.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert('Error', `Failed to submit appointment request: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Doctor & Type</Text>
      
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Doctor *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedDoctor}
            onValueChange={setSelectedDoctor}
            style={styles.picker}
          >
            <Picker.Item label="Select a doctor..." value="" />
            {doctors.map((doctor) => (
              <Picker.Item
                key={doctor._id}
                label={`${doctor.firstName} ${doctor.lastName}${doctor.specialization ? ` - ${doctor.specialization}` : ''}`}
                value={doctor._id}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Appointment Type *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={appointmentType}
            onValueChange={setAppointmentType}
            style={styles.picker}
          >
            {appointmentTypes.map((type) => (
              <Picker.Item
                key={type.value}
                label={type.label}
                value={type.value}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Priority</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={priority}
            onValueChange={setPriority}
            style={styles.picker}
          >
            {priorities.map((priority) => (
              <Picker.Item
                key={priority.value}
                label={priority.label}
                value={priority.value}
              />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Appointment Details</Text>
      
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Reason for Visit *</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={reason}
          onChangeText={setReason}
          placeholder="Please describe your symptoms or reason for the visit..."
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Additional Notes</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional information or special requests..."
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Duration (minutes)</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={duration}
            onValueChange={setDuration}
            style={styles.picker}
          >
            <Picker.Item label="15 minutes" value="15" />
            <Picker.Item label="30 minutes" value="30" />
            <Picker.Item label="45 minutes" value="45" />
            <Picker.Item label="60 minutes" value="60" />
            <Picker.Item label="90 minutes" value="90" />
          </Picker>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Date & Time</Text>
      
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Appointment Date *</Text>
        <TouchableOpacity
          style={styles.dateTimeButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateTimeText}>{formatDate(selectedDate)}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Appointment Time *</Text>
        <TouchableOpacity
          style={styles.dateTimeButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.dateTimeText}>{formatTime(selectedTime)}</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Appointment Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Doctor:</Text>
          <Text style={styles.summaryValue}>
            {doctors.find(d => d._id === selectedDoctor)?.firstName} {doctors.find(d => d._id === selectedDoctor)?.lastName}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Type:</Text>
          <Text style={styles.summaryValue}>
            {appointmentTypes.find(t => t.value === appointmentType)?.label}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Date:</Text>
          <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Time:</Text>
          <Text style={styles.summaryValue}>{formatTime(selectedTime)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Duration:</Text>
          <Text style={styles.summaryValue}>{duration} minutes</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#4ea674', '#3d8f5f']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Book Appointment</Text>
            <View style={styles.placeholder} />
          </View>
          
          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            {[1, 2, 3].map((stepNum) => (
              <View key={stepNum} style={styles.stepIndicatorContainer}>
                <View style={[
                  styles.stepCircle,
                  step >= stepNum && styles.stepCircleActive
                ]}>
                  <Text style={[
                    styles.stepNumber,
                    step >= stepNum && styles.stepNumberActive
                  ]}>
                    {stepNum}
                  </Text>
                </View>
                {stepNum < 3 && (
                  <View style={[
                    styles.stepLine,
                    step > stepNum && styles.stepLineActive
                  ]} />
                )}
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.buttonRow}>
            {step > 1 && (
              <TouchableOpacity
                style={[styles.button, styles.backButton]}
                onPress={handleBack}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.button, styles.nextButton, step === 1 && styles.fullWidth]}
              onPress={step === 3 ? handleSubmit : handleNext}
              disabled={loading}
            >
              <Text style={styles.nextButtonText}>
                {loading ? 'Submitting...' : step === 3 ? 'Submit Request' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date/Time Pickers */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fdf9',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 24,
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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#ffffff',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepNumberActive: {
    color: '#4ea674',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 20,
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#023337',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateTimeButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#023337',
    fontWeight: '500',
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#023337',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  fullWidth: {
    flex: 1,
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4ea674',
  },
  backButtonText: {
    color: '#4ea674',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#4ea674',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppointmentBookingModal;
