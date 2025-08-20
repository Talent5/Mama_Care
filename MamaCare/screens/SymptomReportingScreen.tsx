import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { dashboardService } from '../services';

interface SymptomReportingScreenProps {
  onBack?: () => void; // Optional so the screen can be used as a standalone tab
}

export default function SymptomReportingScreen({ onBack }: SymptomReportingScreenProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [notes, setNotes] = useState('');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const commonSymptoms = [
    'Morning sickness',
    'Fatigue',
    'Headache',
    'Back pain',
    'Swelling',
    'Heartburn',
    'Difficulty sleeping',
    'Mood changes'
  ];

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSubmit = async () => {
    if (selectedSymptoms.length === 0 && !customSymptom.trim()) {
      Alert.alert('No Symptoms', 'Please select or enter at least one symptom.');
      return;
    }
    if (!severity) {
      Alert.alert('Missing Severity', 'Please select severity level.');
      return;
    }

    // Compose final symptom list (deduplicate & trim)
    const allSymptoms = Array.from(new Set([
      ...selectedSymptoms,
      ...(customSymptom.trim() ? [customSymptom.trim()] : []),
    ]));

    setIsSubmitting(true);
    try {
      await dashboardService.logSymptoms({
        symptoms: allSymptoms,
        severity,
        notes: notes.trim() || undefined,
      });

      Alert.alert(
        'Symptom Reported',
        'Your symptom report has been saved. If you experience severe symptoms, please contact your healthcare provider immediately.',
        [
          { text: 'OK', onPress: () => {
            setSelectedSymptoms([]);
            setCustomSymptom('');
            setNotes('');
            setSeverity(null);
            onBack && onBack();
          } }
        ]
      );
    } catch (error) {
      console.error('Failed to submit symptom report', error);
      Alert.alert('Error', 'Failed to submit symptom report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityColor = (level: string): [string, string] => {
    switch (level) {
      case 'mild': return ['#4ea674', '#3d8f5f'];
      case 'moderate': return ['#ffd93d', '#f7b500'];
      case 'severe': return ['#ff6b6b', '#ff4757'];
      default: return ['#4ea674', '#3d8f5f'];
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      {/* Themed Header */}
      <LinearGradient
        colors={['#4ea674', '#3d8f5f', '#2d6e47']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            disabled={!onBack}
            onPress={() => onBack && onBack()}
            style={[styles.backButton, !onBack && { opacity: 0 }]}
            activeOpacity={0.8}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Symptom Reporting</Text>
            <Text style={styles.headerSubtitle}>Track how you&apos;re feeling today</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsIcon}>💬</Text>
            <Text style={styles.instructionsTitle}>How are you feeling?</Text>
            <Text style={styles.instructionsText}>Select symptoms, choose severity, and add notes to help monitor trends.</Text>
        </View>

        {/* Common Symptoms */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Common Symptoms</Text>
          <View style={styles.symptomsGrid}>
            {commonSymptoms.map((symptom, index) => {
              const selected = selectedSymptoms.includes(symptom);
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.symptomCard, selected && styles.symptomCardSelected]}
                  onPress={() => toggleSymptom(symptom)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.symptomCardText, selected && styles.symptomCardTextSelected]}>{symptom}</Text>
                  {selected && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedCheck}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Custom Symptom */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Other Symptoms</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Describe any other symptoms..."
            value={customSymptom}
            onChangeText={setCustomSymptom}
            multiline
            numberOfLines={3}
            placeholderTextColor="#999"
          />
        </View>

        {/* Severity */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Severity Level</Text>
          <View style={styles.severityRow}>
            {(['mild','moderate','severe'] as const).map(level => {
              const active = severity === level;
              return (
                <TouchableOpacity
                  key={level}
                  style={[styles.severityPill, active && styles.severityPillActive]}
                  onPress={() => setSeverity(level)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={active ? getSeverityColor(level) : ['#ffffff', '#ffffff']}
                    style={styles.severityGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={[styles.severityLabel, active && styles.severityLabelActive]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Additional Notes (optional)</Text>
          <Text style={styles.notesSubtitle}>Add context like duration, time of day, triggers, or anything else.</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any extra details (timing, triggers, duration)..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#999"
          />
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isSubmitting ? ['#cccccc', '#aaaaaa'] : ['#4ea674', '#3d8f5f']}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Report</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.privacyNote}>Your data is kept private and secure.</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fdf9',
  },
  // Header
  headerGradient: {
    paddingTop: (StatusBar.currentHeight || 50),
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 6,
    shadowColor: '#4ea674',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  backIcon: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: -2,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  // Scroll/content
  scrollArea: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  instructionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 24,
  },
  instructionsIcon: { fontSize: 32, marginBottom: 10 },
  instructionsTitle: { fontSize: 18, fontWeight: 'bold', color: '#023337', marginBottom: 6 },
  instructionsText: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
  sectionBlock: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#023337', marginBottom: 14 },
  symptomsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  symptomCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: '45%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  symptomCardSelected: { borderColor: '#4ea674', backgroundColor: '#f0f9f2' },
  symptomCardText: { fontSize: 13, fontWeight: '600', color: '#023337', textAlign: 'center' },
  symptomCardTextSelected: { color: '#4ea674' },
  selectedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#4ea674',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectedCheck: { fontSize: 12, color: '#ffffff', fontWeight: 'bold' },
  notesInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#023337',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 90,
    textAlignVertical: 'top'
  },
  notesSubtitle: { fontSize: 12, color: '#666', marginBottom: 10 },
  severityRow: { flexDirection: 'row', gap: 10 },
  severityPill: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff'
  },
  severityPillActive: { borderColor: 'transparent' },
  severityGradient: { paddingVertical: 14, alignItems: 'center' },
  severityLabel: { fontSize: 14, fontWeight: '600', color: '#666' },
  severityLabelActive: { color: '#ffffff' },
  submitSection: { marginTop: 10 },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#4ea674',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitGradient: { paddingVertical: 16, alignItems: 'center' },
  submitButtonText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  privacyNote: { marginTop: 14, fontSize: 12, color: '#777', textAlign: 'center' },
});
