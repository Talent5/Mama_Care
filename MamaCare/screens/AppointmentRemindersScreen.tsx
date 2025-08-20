import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
interface AppointmentRemindersScreenProps {
  onBack: () => void;
}

export default function AppointmentRemindersScreen({ onBack }: AppointmentRemindersScreenProps) {
  const [appointments] = useState([
    {
      id: 1,
      type: 'Prenatal Checkup',
      date: '2024-03-15',
      time: '2:00 PM',
      doctor: 'Dr. Sarah Mukamuri',
      location: 'Harare Central Hospital',
      reminder: true
    },
    {
      id: 2,
      type: 'Ultrasound',
      date: '2024-03-22',
      time: '10:30 AM',
      doctor: 'Dr. James Chiweshe',
      location: 'Avenues Clinic',
      reminder: false
    },
    {
      id: 3,
      type: 'Blood Test',
      date: '2024-04-05',
      time: '8:00 AM',
      doctor: 'Lab Technician',
      location: 'PathLab Zimbabwe',
      reminder: true
    }
  ]);

  const handleAddReminder = () => {
    Alert.alert(
      'Add Reminder',
      'Feature coming soon! You will be able to add custom appointment reminders.',
      [{ text: 'OK' }]
    );
  };

  const handleToggleReminder = (id: number) => {
    Alert.alert(
      'Reminder Updated',
      'Reminder settings have been updated for this appointment.',
      [{ text: 'OK' }]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>⏰ Appointment Reminders</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.subtitle}>Stay on top of your healthcare appointments</Text>
          
          {/* Add Reminder Button */}
          <TouchableOpacity style={styles.addButton} onPress={handleAddReminder}>
            <Text style={styles.addButtonText}>+ Add New Appointment</Text>
          </TouchableOpacity>

          {/* Appointments List */}
          <View style={styles.appointmentsList}>
            {appointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                  <Text style={styles.appointmentType}>{appointment.type}</Text>
                  <TouchableOpacity
                    style={[
                      styles.reminderButton,
                      appointment.reminder && styles.reminderButtonActive
                    ]}
                    onPress={() => handleToggleReminder(appointment.id)}
                  >
                    <Text style={[
                      styles.reminderButtonText,
                      appointment.reminder && styles.reminderButtonTextActive
                    ]}>
                      {appointment.reminder ? '🔔' : '🔕'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.appointmentDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📅 Date:</Text>
                    <Text style={styles.detailValue}>{formatDate(appointment.date)}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>🕐 Time:</Text>
                    <Text style={styles.detailValue}>{appointment.time}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>👨‍⚕️ Doctor:</Text>
                    <Text style={styles.detailValue}>{appointment.doctor}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>📍 Location:</Text>
                    <Text style={styles.detailValue}>{appointment.location}</Text>
                  </View>
                </View>

                {appointment.reminder && (
                  <View style={styles.reminderStatus}>
                    <Text style={styles.reminderStatusText}>
                      ✅ Reminder set for 24 hours before
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e9f8e7',
    paddingTop: 40, // Account for status bar
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Extra padding to avoid tab bar overlap
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#023337',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#023337',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  content: {
    gap: 20,
  },
  addButton: {
    backgroundColor: '#4ea674',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  appointmentsList: {
    gap: 15,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  appointmentType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#023337',
  },
  reminderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderButtonActive: {
    backgroundColor: '#c0e6b9',
  },
  reminderButtonText: {
    fontSize: 18,
  },
  reminderButtonTextActive: {
    fontSize: 18,
  },
  appointmentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#023337',
    fontWeight: '500',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#4ea674',
    fontWeight: '600',
    flex: 1,
  },
  reminderStatus: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#c0e6b9',
    borderRadius: 8,
  },
  reminderStatusText: {
    fontSize: 12,
    color: '#023337',
    fontWeight: '500',
    textAlign: 'center',
  },
});
