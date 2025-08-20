import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  FlatList,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { medicalRecordService, MedicalRecord, CreateMedicalRecordData } from '../services';

interface MedicalRecordsScreenProps {
  route: any;
  navigation: any;
}

const MedicalRecordsScreen: React.FC<MedicalRecordsScreenProps> = ({ route, navigation }) => {
  const { patientId } = route.params || {};
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // New record form state
  const [newRecord, setNewRecord] = useState<Partial<CreateMedicalRecordData>>({
    visitType: 'consultation',
    chiefComplaint: '',
    diagnosis: { primary: '' },
    physicalExamination: {
      vitals: {
        bloodPressure: { systolic: 0, diastolic: 0 },
        heartRate: 0,
        temperature: 0
      }
    }
  });

  useEffect(() => {
    loadMedicalRecords();
  }, [patientId]);

  const loadMedicalRecords = async () => {
    try {
      setLoading(true);
      let response;
      
      if (patientId) {
        response = await medicalRecordService.getPatientMedicalHistory(patientId);
      } else {
        // For providers, get their records
        response = await medicalRecordService.getProviderMedicalRecords('current');
      }
      
      if (response.success && response.data) {
        setRecords(response.data.records);
      }
    } catch (error) {
      console.error('Error loading medical records:', error);
      Alert.alert('Error', 'Failed to load medical records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateRecord = async () => {
    try {
      if (!newRecord.patientId || !newRecord.appointmentId || !newRecord.chiefComplaint || !newRecord.diagnosis?.primary) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const response = await medicalRecordService.createMedicalRecord(newRecord as CreateMedicalRecordData);
      
      if (response.success) {
        Alert.alert('Success', 'Medical record created successfully');
        setShowCreateModal(false);
        setNewRecord({
          visitType: 'consultation',
          chiefComplaint: '',
          diagnosis: { primary: '' },
          physicalExamination: {
            vitals: {
              bloodPressure: { systolic: 0, diastolic: 0 },
              heartRate: 0,
              temperature: 0
            }
          }
        });
        loadMedicalRecords();
      }
    } catch (error) {
      console.error('Error creating medical record:', error);
      Alert.alert('Error', 'Failed to create medical record');
    }
  };

  const renderRecordItem = ({ item }: { item: MedicalRecord }) => (
    <TouchableOpacity
      style={styles.recordCard}
      onPress={() => setSelectedRecord(item)}
    >
      <View style={styles.recordHeader}>
        <Text style={styles.recordDate}>
          {new Date(item.visitDate).toLocaleDateString()}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.recordType}>{item.visitType.replace('_', ' ').toUpperCase()}</Text>
      <Text style={styles.chiefComplaint}>{item.chiefComplaint}</Text>
      <Text style={styles.diagnosis}>Primary Diagnosis: {item.diagnosis.primary}</Text>
      
      {item.physicalExamination?.vitals && (
        <View style={styles.vitalsContainer}>
          <Text style={styles.vitalsText}>
            BP: {item.physicalExamination.vitals.bloodPressure?.systolic || 0}/
            {item.physicalExamination.vitals.bloodPressure?.diastolic || 0} | 
            HR: {item.physicalExamination.vitals.heartRate || 0} bpm
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    const colors = {
      draft: '#6B7280',
      completed: '#10B981',
      reviewed: '#3B82F6',
      amended: '#F59E0B'
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  };

  const CreateRecordModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Create Medical Record</Text>
          <TouchableOpacity onPress={() => setShowCreateModal(false)}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Visit Type</Text>
            <View style={styles.visitTypeContainer}>
              {['consultation', 'prenatal', 'emergency', 'follow_up'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.visitTypeButton,
                    newRecord.visitType === type && styles.visitTypeButtonActive
                  ]}
                  onPress={() => setNewRecord({ ...newRecord, visitType: type as any })}
                >
                  <Text style={[
                    styles.visitTypeText,
                    newRecord.visitType === type && styles.visitTypeTextActive
                  ]}>
                    {type.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Chief Complaint *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Patient's main concern..."
              value={newRecord.chiefComplaint}
              onChangeText={(text) => setNewRecord({ ...newRecord, chiefComplaint: text })}
              multiline
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Primary Diagnosis *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Primary diagnosis..."
              value={newRecord.diagnosis?.primary || ''}
              onChangeText={(text) => setNewRecord({
                ...newRecord,
                diagnosis: { ...newRecord.diagnosis, primary: text }
              })}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Vital Signs</Text>
            <View style={styles.vitalsRow}>
              <View style={styles.vitalInput}>
                <Text style={styles.vitalLabel}>Systolic BP</Text>
                <TextInput
                  style={styles.smallInput}
                  placeholder="120"
                  keyboardType="numeric"
                  value={newRecord.physicalExamination?.vitals?.bloodPressure?.systolic?.toString() || ''}
                  onChangeText={(text) => setNewRecord({
                    ...newRecord,
                    physicalExamination: {
                      ...newRecord.physicalExamination,
                      vitals: {
                        ...newRecord.physicalExamination?.vitals,
                        bloodPressure: {
                          ...newRecord.physicalExamination?.vitals?.bloodPressure,
                          systolic: parseInt(text) || 0
                        }
                      }
                    }
                  })}
                />
              </View>
              
              <View style={styles.vitalInput}>
                <Text style={styles.vitalLabel}>Diastolic BP</Text>
                <TextInput
                  style={styles.smallInput}
                  placeholder="80"
                  keyboardType="numeric"
                  value={newRecord.physicalExamination?.vitals?.bloodPressure?.diastolic?.toString() || ''}
                  onChangeText={(text) => setNewRecord({
                    ...newRecord,
                    physicalExamination: {
                      ...newRecord.physicalExamination,
                      vitals: {
                        ...newRecord.physicalExamination?.vitals,
                        bloodPressure: {
                          ...newRecord.physicalExamination?.vitals?.bloodPressure,
                          diastolic: parseInt(text) || 0
                        }
                      }
                    }
                  })}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.createButton} onPress={handleCreateRecord}>
            <Text style={styles.createButtonText}>Create Record</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Medical Records</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search records..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={records.filter(record => 
          record.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.diagnosis.primary.toLowerCase().includes(searchQuery.toLowerCase())
        )}
        renderItem={renderRecordItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadMedicalRecords} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <CreateRecordModal />

      {/* Record Detail Modal */}
      <Modal
        visible={!!selectedRecord}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Medical Record Details</Text>
            <TouchableOpacity onPress={() => setSelectedRecord(null)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedRecord && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Visit Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedRecord.visitDate).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Visit Type</Text>
                <Text style={styles.detailValue}>
                  {selectedRecord.visitType.replace('_', ' ').toUpperCase()}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Chief Complaint</Text>
                <Text style={styles.detailValue}>{selectedRecord.chiefComplaint}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Primary Diagnosis</Text>
                <Text style={styles.detailValue}>{selectedRecord.diagnosis.primary}</Text>
              </View>

              {selectedRecord.physicalExamination?.vitals && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Vital Signs</Text>
                  <Text style={styles.detailValue}>
                    Blood Pressure: {selectedRecord.physicalExamination.vitals.bloodPressure?.systolic || 0}/
                    {selectedRecord.physicalExamination.vitals.bloodPressure?.diastolic || 0} mmHg{'\n'}
                    Heart Rate: {selectedRecord.physicalExamination.vitals.heartRate || 0} bpm{'\n'}
                    Temperature: {selectedRecord.physicalExamination.vitals.temperature || 0}°C
                  </Text>
                </View>
              )}

              {selectedRecord.treatment?.medications && selectedRecord.treatment.medications.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Medications</Text>
                  {selectedRecord.treatment.medications.map((med, index) => (
                    <Text key={index} style={styles.detailValue}>
                      • {med.name} - {med.dosage} {med.frequency}
                    </Text>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  addButton: {
    backgroundColor: '#4ea674',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  searchIcon: {
    marginRight: 10
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16
  },
  listContainer: {
    padding: 20,
    paddingTop: 10
  },
  recordCard: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  recordDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  },
  recordType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ea674',
    marginBottom: 5
  },
  chiefComplaint: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5
  },
  diagnosis: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10
  },
  vitalsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 5
  },
  vitalsText: {
    fontSize: 12,
    color: '#666'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  modalContent: {
    flex: 1,
    padding: 20
  },
  formGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: 'white'
  },
  visitTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  visitTypeButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'white'
  },
  visitTypeButtonActive: {
    backgroundColor: '#4ea674',
    borderColor: '#4ea674'
  },
  visitTypeText: {
    fontSize: 14,
    color: '#666'
  },
  visitTypeTextActive: {
    color: 'white'
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: 15
  },
  vitalInput: {
    flex: 1
  },
  vitalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  smallInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: 'white',
    textAlign: 'center'
  },
  createButton: {
    backgroundColor: '#4ea674',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  detailSection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22
  }
});

export default MedicalRecordsScreen;
