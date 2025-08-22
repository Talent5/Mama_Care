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
import ConnectionStatus from '../components/ConnectionStatus';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address (e.g., user@example.com)';
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
    setErrors({}); // Clear previous errors
    
    try {
      console.log('Attempting login with email:', formData.email.trim());
      
      const result = await authService.login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      console.log('Login result:', result);

      if (result.success) {
        console.log('Login successful, calling onLoginSuccess');
        // Small delay to ensure auth state is properly set
        setTimeout(() => {
          onLoginSuccess();
        }, 100);
      } else {
        // Handle specific error messages from the server
        const errorMessage = result.message || 'Login failed';
        
        if (errorMessage.toLowerCase().includes('invalid email or password') ||
            errorMessage.toLowerCase().includes('invalid credentials') ||
            errorMessage.toLowerCase().includes('user not found') ||
            errorMessage.toLowerCase().includes('incorrect password')) {
          Alert.alert(
            'Invalid Credentials',
            'The email or password you entered is incorrect. Please double-check your credentials and try again.'
          );
        } else if (errorMessage.toLowerCase().includes('account not verified') ||
                   errorMessage.toLowerCase().includes('email not verified')) {
          Alert.alert(
            'Account Not Verified',
            'Please check your email and verify your account before signing in.'
          );
        } else if (errorMessage.toLowerCase().includes('account disabled') ||
                   errorMessage.toLowerCase().includes('account suspended')) {
          Alert.alert(
            'Account Disabled',
            'Your account has been disabled. Please contact support for assistance.'
          );
        } else if (errorMessage.toLowerCase().includes('only patients')) {
          Alert.alert(
            'Access Restricted',
            'Only patient accounts can access the mobile app. Please use the web dashboard for other account types.'
          );
        } else {
          Alert.alert(
            'Login Failed',
            errorMessage || 'Unable to sign in. Please try again.'
          );
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different types of errors more specifically
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('Authentication failed (401)') || 
          errorMessage.includes('Unauthorized')) {
        Alert.alert(
          'Invalid Credentials',
          'The email or password you entered is incorrect. Please check your credentials and try again.'
        );
      } else if (errorMessage.includes('timeout') || 
                 errorMessage.includes('Request timeout')) {
        Alert.alert(
          'Connection Timeout',
          'The request took too long to complete. Please check your internet connection and try again.'
        );
      } else if (errorMessage.includes('Network request failed') || 
                 errorMessage.includes('Failed to fetch') ||
                 errorMessage.includes('fetch')) {
        Alert.alert(
          'Network Error',
          'Unable to connect to the server. Please check your internet connection and try again.'
        );
      } else if (errorMessage.includes('server')) {
        Alert.alert(
          'Server Error',
          'The server is currently unavailable. Please try again in a few moments.'
        );
      } else {
        Alert.alert(
          'Login Error',
          'An unexpected error occurred while trying to sign in. Please try again.'
        );
      }
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
      {/* Only show connection status in development */}
      {__DEV__ && <ConnectionStatus />}
      
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
                placeholderTextColor="#999"
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
                  placeholderTextColor="#999"
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

            {/* Forgot Password Link */}
            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity 
                onPress={() => setShowForgotPassword(true)}
                style={styles.forgotPasswordButton}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
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

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        visible={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
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
    color: '#023337', // Explicit text color
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
    color: '#023337', // Explicit text color
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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  forgotPasswordText: {
    color: '#4ea674',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
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