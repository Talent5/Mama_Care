import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { authService } from '../services';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onNavigateToRegister: () => void;
}

export default function LoginScreen({ onLoginSuccess, onNavigateToRegister }: LoginScreenProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.login({
        email: formData.email.trim(),
        password: formData.password
      });

      if (result.success) {
        onLoginSuccess();
      } else {
        Alert.alert('Login Failed', result.message || t('login.errors.invalidCredentials'));
      }
    } catch (error) {
      // Handle authentication errors more specifically
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('Invalid email or password') || 
          errorMessage.includes('Authentication failed (401)')) {
        Alert.alert(
          'Invalid Credentials',
          'The email or password you entered is incorrect. Please check your credentials and try again.'
        );
      } else if (errorMessage.includes('Network request failed') || 
                 errorMessage.includes('timeout')) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to the server. Please check your internet connection and try again.'
        );
      } else {
        Alert.alert('Login Error', 'An unexpected error occurred. Please try again.');
      }
      
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('login.title')}</Text>
            <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('login.email')}</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder={t('login.emailPlaceholder')}
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('login.password')}</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, errors.password && styles.inputError]}
                  placeholder={t('login.passwordPlaceholder')}
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  secureTextEntry={!showPassword}
                  autoComplete="current-password"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? '🙈' : '👁️'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Logging in...' : t('login.loginButton')}
              </Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerLinkContainer}>
              <Text style={styles.registerLinkText}>{t('login.noAccount')} </Text>
              <TouchableOpacity onPress={onNavigateToRegister}>
                <Text style={styles.registerLink}>{t('login.registerLink')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Decorative Elements */}
          <View style={styles.decorativeContainer}>
            <View style={styles.decorativeCircle} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e9f8e7',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 60,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#023337',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#4ea674',
    textAlign: 'center',
    fontWeight: '500',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#023337',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingRight: 50, // Make room for the eye button
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flex: 1,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
    height: '100%',
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  loginButton: {
    backgroundColor: '#4ea674',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    elevation: 3,
    shadowColor: '#4ea674',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  registerLinkText: {
    color: '#023337',
    fontSize: 16,
  },
  registerLink: {
    color: '#4ea674',
    fontSize: 16,
    fontWeight: '600',
  },
  decorativeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  decorativeCircle: {
    position: 'absolute',
    top: 120,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#c0e6b9',
    opacity: 0.2,
  },
});