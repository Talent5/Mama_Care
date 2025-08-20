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
import { AuthStorage, StoredUser } from '../utils/databaseAuthStorage';

interface PersonalInfoEditorProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const PersonalInfoEditor: React.FC<PersonalInfoEditorProps> = ({
  visible,
  onClose,
  onUpdate,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<StoredUser | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (visible) {
      loadUserData();
    }
  }, [visible]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const user = await AuthStorage.getCurrentUser();
      if (user) {
        setUserData(user);
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          phone: user.phone || '',
          email: user.email || '',
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }

    try {
      setIsLoading(true);
      
      // Update user data
      const updatedUser = {
        ...userData,
        ...formData,
      };
      
      await AuthStorage.updateUser(updatedUser);
      
      Alert.alert('Success', 'Personal information updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            onUpdate();
            onClose();
          },
        },
      ]);
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Failed to update personal information');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal Information</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, isLoading && styles.disabledButton]}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                placeholder="Enter your first name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                placeholder="Enter your last name"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Enter your email address"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

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
  disabledButton: {
    backgroundColor: '#c0e6b9',
  },
  saveButtonText: {
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
  bottomSpacing: {
    height: 40,
  },
});

export default PersonalInfoEditor;
