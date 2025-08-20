import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { AuthStorage, MedicalRecord } from '../utils/databaseAuthStorage';

interface MedicalRecordsManagerProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

type RecordType = 'anc_visit' | 'vaccination' | 'doctor_note';

const MedicalRecordsManager: React.FC<MedicalRecordsManagerProps> = ({
  visible,
  onClose,
  onUpdate,
}) => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [recordType, setRecordType] = useState<RecordType>('anc_visit');
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (visible) {
      loadRecords();
    }
  }, [visible]);

  const loadRecords = async () => {
    try {
      setIsLoading(true);
      const medicalRecords = await AuthStorage.getMedicalRecords();
      setRecords(medicalRecords || []);
    } catch (error) {
      console.error('Error loading records:', error);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({});
    setShowAddForm(false);
  };

  const getFormFields = () => {
    switch (recordType) {
      case 'anc_visit':
        return [
          { key: 'visitDate', label: 'Visit Date', type: 'date', required: true },
          { key: 'clinic', label: 'Clinic/Hospital', type: 'text', required: true },
          { key: 'outcome', label: 'Visit Outcome', type: 'text', required: true },
          { key: 'notes', label: 'Additional Notes', type: 'multiline', required: false },
        ];
      case 'vaccination':
        return [
          { key: 'vaccineName', label: 'Vaccine Name', type: 'text', required: true },
          { key: 'date', label: 'Vaccination Date', type: 'date', required: true },
          { key: 'status', label: 'Status', type: 'select', options: ['completed', 'scheduled', 'overdue'], required: true },
          { key: 'batchNumber', label: 'Batch Number', type: 'text', required: false },
        ];
      case 'doctor_note':
        return [
          { key: 'date', label: 'Date', type: 'date', required: true },
          { key: 'doctor', label: 'Doctor Name', type: 'text', required: true },
          { key: 'note', label: 'Medical Note', type: 'multiline', required: true },
        ];
      default:
        return [];
    }
  };

  const validateForm = () => {
    const fields = getFormFields();
    for (const field of fields) {
      if (field.required && !formData?.[field.key]?.trim()) {
        Alert.alert('Error', `${field.label} is required`);
        return false;
      }
    }
    return true;
  };

  const handleSaveRecord = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      const newRecord = {
        type: recordType,
        date: formData?.date || formData?.visitDate || new Date().toISOString().split('T')[0],
        data: formData || {},
      };

      await AuthStorage.addMedicalRecord(newRecord);
      
      Alert.alert('Success', 'Medical record added successfully', [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            loadRecords();
            onUpdate();
          },
        },
      ]);
    } catch (error) {
      console.error('Error saving record:', error);
      Alert.alert('Error', 'Failed to save medical record');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'anc_visit': return '🏥';
      case 'vaccination': return '💉';
      case 'doctor_note': return '📝';
      default: return '📋';
    }
  };

  const getRecordTitle = (type: string) => {
    switch (type) {
      case 'anc_visit': return 'ANC Visit';
      case 'vaccination': return 'Vaccination';
      case 'doctor_note': return 'Doctor Note';
      default: return 'Medical Record';
    }
  };

  const renderFormField = (field: any) => {
    if (field.type === 'select') {
      return (
        <View key={field.key} style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{field.label} {field.required && '*'}</Text>
          <View style={styles.selectContainer}>
            {field.options.map((option: string) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.selectOption,
                  formData?.[field.key] === option && styles.selectedOption,
                ]}
                onPress={() => setFormData({ ...(formData || {}), [field.key]: option })}
              >
                <Text style={[
                  styles.selectOptionText,
                  formData?.[field.key] === option && styles.selectedOptionText,
                ]}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    return (
      <View key={field.key} style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{field.label} {field.required && '*'}</Text>
        <TextInput
          style={[
            styles.textInput,
            field.type === 'multiline' && styles.multilineInput,
          ]}
          value={formData?.[field.key] || ''}
          onChangeText={(text) => setFormData({ ...(formData || {}), [field.key]: text })}
          placeholder={`Enter ${field.label.toLowerCase()}`}
          placeholderTextColor="#999"
          multiline={field.type === 'multiline'}
          numberOfLines={field.type === 'multiline' ? 4 : 1}
          keyboardType={field.type === 'date' ? 'numeric' : 'default'}
        />
        {field.type === 'date' && (
          <Text style={styles.dateHint}>Format: YYYY-MM-DD (e.g., {new Date().toISOString().split('T')[0]})</Text>
        )}
      </View>
    );
  };

  if (showAddForm) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={resetForm} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Medical Record</Text>
            <TouchableOpacity 
              onPress={handleSaveRecord} 
              style={[styles.saveButton, isLoading && styles.disabledButton]}
              disabled={isLoading}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Record Type Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Record Type</Text>
              <View style={styles.typeSelector}>
                {(['anc_visit', 'vaccination', 'doctor_note'] as RecordType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      recordType === type && styles.selectedType,
                    ]}
                    onPress={() => {
                      setRecordType(type);
                      setFormData({});
                    }}
                  >
                    <Text style={styles.typeEmoji}>{getRecordIcon(type)}</Text>
                    <Text style={[
                      styles.typeText,
                      recordType === type && styles.selectedTypeText,
                    ]}>
                      {getRecordTitle(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Record Details</Text>
              {getFormFields().map(renderFormField)}
            </View>

            <View style={styles.bottomSpacing} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medical Records</Text>
          <TouchableOpacity 
            onPress={() => setShowAddForm(true)} 
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading records...</Text>
            </View>
          ) : !records || records.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No medical records yet</Text>
              <Text style={styles.emptySubtext}>Tap &quot;Add&quot; to create your first record</Text>
            </View>
          ) : (
            <View style={styles.recordsList}>
              {records && records.length > 0 && records.map((record, index) => (
                <View key={record?._id || `record-${index}`} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <View style={styles.recordIconContainer}>
                      <Text style={styles.recordIcon}>{getRecordIcon(record.type || 'unknown')}</Text>
                    </View>
                    <View style={styles.recordHeaderText}>
                      <Text style={styles.recordTitle}>{getRecordTitle(record.type || 'unknown')}</Text>
                      <Text style={styles.recordDate}>{formatDate(record.date || '')}</Text>
                    </View>
                  </View>
                  <View style={styles.recordContent}>
                    {record.data && Object.entries(record.data).map(([key, value]) => (
                      <View key={key} style={styles.recordRow}>
                        <Text style={styles.recordLabel}>
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                        </Text>
                        <Text style={styles.recordValue}>{value as string}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

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
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#023337',
  },
  saveButton: {
    backgroundColor: '#4ea674',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButton: {
    backgroundColor: '#4ea674',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#c0e6b9',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  addButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeOption: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
  },
  selectedType: {
    borderColor: '#4ea674',
    backgroundColor: '#e9f8e7',
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
    textAlign: 'center',
  },
  selectedTypeText: {
    color: '#4ea674',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#023337',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#023337',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateHint: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    fontStyle: 'italic',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedOption: {
    backgroundColor: '#4ea674',
    borderColor: '#4ea674',
  },
  selectOptionText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  recordsList: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  recordCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
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
  recordContent: {
    padding: 16,
  },
  recordRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  recordLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 120,
    flexShrink: 0,
  },
  recordValue: {
    fontSize: 14,
    color: '#023337',
    flex: 1,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default MedicalRecordsManager;
