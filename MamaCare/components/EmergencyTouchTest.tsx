import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Emergency Touch Test Component
 * This bypasses all complex navigation and components to test raw touch responsiveness
 */
export default function EmergencyTouchTest() {
  const [pressCount, setPressCount] = useState(0);
  const [lastPressTime, setLastPressTime] = useState<string>('Never');

  const handlePress = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    setPressCount(count => count + 1);
    setLastPressTime(timeString);
    
    console.log(`[EmergencyTouch] Press #${pressCount + 1} at ${timeString}`);
    
    // Show immediate feedback
    Alert.alert('Touch Works!', `Press #${pressCount + 1} registered at ${timeString}`);
  };

  const resetTest = () => {
    setPressCount(0);
    setLastPressTime('Never');
    console.log('[EmergencyTouch] Test reset');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚨 Emergency Touch Test</Text>
      <Text style={styles.subtitle}>Direct touch testing - bypasses all app complexity</Text>
      
      <View style={styles.stats}>
        <Text style={styles.statText}>Presses: {pressCount}</Text>
        <Text style={styles.statText}>Last Press: {lastPressTime}</Text>
      </View>

      <TouchableOpacity 
        style={styles.testButton}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={styles.testButtonText}>TAP TO TEST TOUCH</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.resetButton}
        onPress={resetTest}
        activeOpacity={0.7}
      >
        <Text style={styles.resetButtonText}>Reset Counter</Text>
      </TouchableOpacity>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>Instructions:</Text>
        <Text style={styles.instructionText}>1. Tap the button multiple times</Text>
        <Text style={styles.instructionText}>2. Each tap should show an alert immediately</Text>
        <Text style={styles.instructionText}>3. Counter should increment instantly</Text>
        <Text style={styles.instructionText}>4. If this works, the issue is in navigation/components</Text>
        <Text style={styles.instructionText}>5. If this fails, it's a device/Expo issue</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e9f8e7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4ea674',
    marginBottom: 30,
    textAlign: 'center',
  },
  stats: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    minWidth: 200,
    alignItems: 'center',
  },
  statText: {
    fontSize: 18,
    color: '#023337',
    marginBottom: 10,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  testButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#4ea674',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    maxWidth: 350,
  },
  instructionText: {
    fontSize: 14,
    color: '#023337',
    marginBottom: 5,
    lineHeight: 20,
  },
});
