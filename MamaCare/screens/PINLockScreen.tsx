import * as LocalAuthentication from 'expo-local-authentication';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';
import { AuthStorage } from '../utils/authStorage';

interface PINLockScreenProps {
  mode: 'create' | 'verify';
  onSuccess: () => void;
  onCancel?: () => void;
}

const PINLockScreen: React.FC<PINLockScreenProps> = ({ mode, onSuccess, onCancel }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [attempts, setAttempts] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkBiometricAvailability = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricAvailable(hasHardware && isEnrolled && mode === 'verify');
      } catch (error) {
        console.error('Error checking biometric availability:', error);
      }
    };
    
    checkBiometricAvailability();
  }, [mode]);

  const handleBiometricAuth = async () => {
    try {
      setIsLoading(true);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Use your fingerprint to access your medical records',
        fallbackLabel: 'Use PIN instead',
        disableDeviceFallback: false,
      });

      if (result.success) {
        onSuccess();
      } else {
        Alert.alert('Authentication Failed', 'Please try again or use your PIN.');
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert('Error', 'Biometric authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNumberPress = (number: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + number);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = useCallback(async () => {
    if (pin.length !== 4) return;

    if (mode === 'create') {
      if (step === 'enter') {
        setConfirmPin(pin);
        setPin('');
        setStep('confirm');
      } else {
        if (pin === confirmPin) {
          try {
            setIsLoading(true);
            await AuthStorage.setPIN(confirmPin);
            Alert.alert('Success', 'PIN created successfully!', [
              { text: 'OK', onPress: onSuccess }
            ]);
          } catch {
            Alert.alert('Error', 'Failed to create PIN. Please try again.');
          } finally {
            setIsLoading(false);
          }
        } else {
          Alert.alert('Error', 'PINs do not match. Please try again.');
          setPin('');
          setConfirmPin('');
          setStep('enter');
          Vibration.vibrate(500);
        }
      }
    } else {
      try {
        setIsLoading(true);
        const isValid = await AuthStorage.verifyPIN(pin);
        if (isValid) {
          onSuccess();
        } else {
          setAttempts(prev => prev + 1);
          setPin('');
          Vibration.vibrate(500);
          
          if (attempts >= 2) {
            Alert.alert(
              'Too Many Attempts',
              'Please wait 30 seconds before trying again.',
              [{ text: 'OK' }]
            );
            setTimeout(() => setAttempts(0), 30000);
          } else {
            Alert.alert('Incorrect PIN', `${2 - attempts} attempts remaining`);
          }
        }
      } catch {
        Alert.alert('Error', 'Failed to verify PIN');
      } finally {
        setIsLoading(false);
      }
    }
  }, [pin, mode, step, confirmPin, attempts, onSuccess]);

  const renderPinDots = () => {
    return (
      <View style={styles.pinDotsContainer}>
        {[...Array(4)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              index < pin.length ? styles.pinDotFilled : styles.pinDotEmpty
            ]}
          />
        ))}
      </View>
    );
  };

  const renderNumberPad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'delete']
    ];

    return (
      <View style={styles.numberPad}>
        {numbers.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.numberRow}>
            {row.map((item, itemIndex) => {
              if (item === '') {
                return <View key={itemIndex} style={styles.numberButton} />;
              }
              
              if (item === 'delete') {
                return (
                  <TouchableOpacity
                    key={itemIndex}
                    style={styles.numberButton}
                    onPress={handleDelete}
                    disabled={pin.length === 0}
                  >
                    <Text style={styles.deleteButton}>⌫</Text>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={itemIndex}
                  style={styles.numberButton}
                  onPress={() => handleNumberPress(item)}
                  disabled={pin.length >= 4}
                >
                  <Text style={styles.numberText}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const getTitle = () => {
    if (mode === 'create') {
      return step === 'enter' ? 'Create Your PIN' : 'Confirm Your PIN';
    }
    return 'Enter Your PIN';
  };

  const getSubtitle = () => {
    if (mode === 'create') {
      return step === 'enter' 
        ? 'Create a 4-digit PIN to secure your medical records'
        : 'Re-enter your PIN to confirm';
    }
    return 'Enter your PIN to access your medical records';
  };

  useEffect(() => {
    if (pin.length === 4) {
      const timeoutId = setTimeout(handleSubmit, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [pin, handleSubmit]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{getTitle()}</Text>
          <Text style={styles.subtitle}>{getSubtitle()}</Text>
        </View>

        {renderPinDots()}
        {renderNumberPad()}

        {biometricAvailable && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricAuth}
            disabled={isLoading}
          >
            <Text style={styles.biometricText}>👆 Use Fingerprint</Text>
          </TouchableOpacity>
        )}

        {onCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e9f8e7',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    marginBottom: 50,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  pinDotEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4ea674',
  },
  pinDotFilled: {
    backgroundColor: '#4ea674',
  },
  numberPad: {
    marginBottom: 30,
  },
  numberRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  numberButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  numberText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#023337',
  },
  deleteButton: {
    fontSize: 20,
    color: '#666',
  },
  biometricButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    backgroundColor: '#c0e6b9',
    borderRadius: 25,
    marginBottom: 20,
  },
  biometricText: {
    fontSize: 16,
    color: '#023337',
    fontWeight: '500',
  },
  cancelButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

export default PINLockScreen;
