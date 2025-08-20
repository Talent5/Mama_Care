import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { dashboardService } from '../services';

interface SymptomLoggingScreenProps {
  onBack: () => void;
}

interface Symptom {
  id: string;
  name: string;
  category: string;
  icon: string;
  selected: boolean;
}

const SymptomLoggingScreen: React.FC<SymptomLoggingScreenProps> = ({ onBack }) => {
  const [symptoms, setSymptoms] = useState<Symptom[]>([
    { id: '1', name: 'Nausea', category: 'digestive', icon: '🤢', selected: false },
    { id: '2', name: 'Morning Sickness', category: 'digestive', icon: '🤮', selected: false },
    { id: '3', name: 'Fatigue', category: 'general', icon: '😴', selected: false },
    { id: '4', name: 'Headache', category: 'general', icon: '🤕', selected: false },
    { id: '5', name: 'Back Pain', category: 'pain', icon: '🦴', selected: false },
    { id: '6', name: 'Leg Cramps', category: 'pain', icon: '🦵', selected: false },
    { id: '7', name: 'Heartburn', category: 'digestive', icon: '🔥', selected: false },
    { id: '8', name: 'Constipation', category: 'digestive', icon: '💩', selected: false },
    { id: '9', name: 'Swelling', category: 'general', icon: '🫧', selected: false },
    { id: '10', name: 'Dizziness', category: 'general', icon: '😵‍💫', selected: false },
    { id: '11', name: 'Mood Swings', category: 'emotional', icon: '😢', selected: false },
    { id: '12', name: 'Anxiety', category: 'emotional', icon: '😰', selected: false },
  ]);

  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleSymptom = (id: string) => {
    setSymptoms(prev => prev.map(symptom => 
      symptom.id === id ? { ...symptom, selected: !symptom.selected } : symptom
    ));
  };

  const handleSubmit = async () => {
    const selectedSymptoms = symptoms.filter(s => s.selected);
    
    if (selectedSymptoms.length === 0) {
      Alert.alert('No Symptoms Selected', 'Please select at least one symptom to log.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Call the API service
      await dashboardService.logSymptoms({
        symptoms: selectedSymptoms.map(s => s.name),
        severity,
        notes
      });
      
      Alert.alert(
        'Symptoms Logged',
        'Your symptoms have been recorded successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setSymptoms(prev => prev.map(s => ({ ...s, selected: false })));
              setSeverity('mild');
              setNotes('');
              onBack();
            }
          }
        ]
      );
    } catch {
      Alert.alert('Error', 'Failed to log symptoms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'mild': return '#4ea674';
      case 'moderate': return '#ffd93d';
      case 'severe': return '#ff4757';
      default: return '#4ea674';
    }
  };

  const groupedSymptoms = symptoms.reduce((acc, symptom) => {
    if (!acc[symptom.category]) {
      acc[symptom.category] = [];
    }
    acc[symptom.category].push(symptom);
    return acc;
  }, {} as Record<string, Symptom[]>);

  const categoryNames: Record<string, string> = {
    general: 'General',
    digestive: 'Digestive',
    pain: 'Pain & Discomfort',
    emotional: 'Emotional'
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header */}
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
            <Text style={styles.headerTitle}>Log Symptoms</Text>
            <Text style={styles.headerSubtitle}>Track how you&apos;re feeling today</Text>
          </View>
          
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsIcon}>📝</Text>
          <Text style={styles.instructionsTitle}>How are you feeling today?</Text>
          <Text style={styles.instructionsText}>
            Select all symptoms you&apos;re experiencing and rate their severity. This helps track your pregnancy journey.
          </Text>
        </View>

        {/* Symptom Categories */}
        {Object.entries(groupedSymptoms).map(([category, categorySymptoms]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{categoryNames[category]}</Text>
            
            <View style={styles.symptomsGrid}>
              {categorySymptoms.map((symptom) => (
                <TouchableOpacity
                  key={symptom.id}
                  style={[
                    styles.symptomCard,
                    symptom.selected && styles.symptomCardSelected
                  ]}
                  onPress={() => toggleSymptom(symptom.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.symptomIcon}>{symptom.icon}</Text>
                  <Text style={[
                    styles.symptomText,
                    symptom.selected && styles.symptomTextSelected
                  ]}>
                    {symptom.name}
                  </Text>
                  {symptom.selected && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedCheck}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Severity Selection */}
        <View style={styles.severitySection}>
          <Text style={styles.sectionTitle}>Severity Level</Text>
          <View style={styles.severityOptions}>
            {(['mild', 'moderate', 'severe'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.severityOption,
                  severity === level && { backgroundColor: getSeverityColor(level) }
                ]}
                onPress={() => setSeverity(level)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.severityText,
                  severity === level && styles.severityTextSelected
                ]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <Text style={styles.notesSubtitle}>
            Add any additional details about your symptoms (optional)
          </Text>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={4}
            placeholder="Describe your symptoms in more detail..."
            placeholderTextColor="#999"
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isLoading ? ['#ccc', '#999'] : ['#4ea674', '#3d8f5f']}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Logging Symptoms...' : 'Log Symptoms'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={styles.submitNote}>
            Your data is kept private and secure
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    marginLeft: -2,
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
  headerRight: {
    width: 44,
  },
  
  // Content styles
  content: {
    flex: 1,
  },
  
  // Instructions card
  instructionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  instructionsIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Category styles
  categorySection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 12,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  symptomCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '30%',
    maxWidth: '32%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  symptomCardSelected: {
    borderColor: '#4ea674',
    backgroundColor: '#f0f9f2',
  },
  symptomIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  symptomText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#023337',
    textAlign: 'center',
  },
  symptomTextSelected: {
    color: '#4ea674',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#4ea674',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheck: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  
  // Severity styles
  severitySection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 12,
  },
  severityOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  severityOption: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  severityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  severityTextSelected: {
    color: '#ffffff',
  },
  
  // Notes styles
  notesSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  notesSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#023337',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 100,
  },
  
  // Submit styles
  submitSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#4ea674',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  submitGradient: {
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  submitNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
  
  bottomSpacing: {
    height: 30,
  },
});

export default SymptomLoggingScreen;
