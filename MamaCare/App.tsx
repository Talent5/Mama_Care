import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Configure Reanimated early to suppress warnings and optimize performance
import './reanimated.config';

// Import i18n
import './i18n';

// Import screens
import MainTabNavigator from './navigation/MainTabNavigator';
import LanguageSelectionScreen from './screens/LanguageSelectionScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import WelcomeScreen from './screens/WelcomeScreen';

// Import utilities
import { authService } from './services';
import { notificationService } from './services/NotificationService';

// Suppress Reanimated reduced motion warning in development
if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && 
        args[0].includes('[Reanimated] Reduced motion setting is enabled')) {
      return; // Suppress this specific warning
    }
    originalWarn(...args);
  };
}

type AppState = 'loading' | 'onboarding' | 'auth' | 'main';

const Stack = createStackNavigator();

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [isInitialized, setIsInitialized] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion setting to optimize animations
    const checkReducedMotion = async () => {
      try {
        const isReducedMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
        setReducedMotion(isReducedMotionEnabled);
        if (isReducedMotionEnabled) {
          console.log('[App] Reduced motion detected - optimizing for accessibility');
        }
      } catch {
        console.log('[App] Could not detect reduced motion setting');
      }
    };

    checkReducedMotion();
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    // Register for authentication failure callbacks
    const handleAuthFailure = () => {
      console.log('[App] Authentication failure detected, redirecting to onboarding');
      if (isMounted) {
        setAppState('onboarding');
      }
    };
    
    authService.onAuthenticationFailure(handleAuthFailure);
    
    // Enhanced initialization with better authentication checks
    const initializeApp = async () => {
      try {
        console.log('[App] Initializing...');
        
        // Initialize auth service first
        await authService.initialize();
        
        // Initialize notification service
        await notificationService.initialize();
        
        // Enhanced authentication checks
        const hasCompletedOnboarding = await authService.hasCompletedOnboarding();
        console.log('[App] Onboarding completed:', hasCompletedOnboarding);
        
        if (!isMounted) return;

        if (!hasCompletedOnboarding) {
          console.log('[App] Redirecting to onboarding - onboarding not completed');
          setAppState('onboarding');
          setIsInitialized(true);
          return;
        }

        // Check if user is authenticated with token validation
        const isLoggedIn = await authService.isLoggedIn();
        console.log('[App] User logged in:', isLoggedIn);
        
        if (!isMounted) return;

        if (!isLoggedIn) {
          console.log('[App] Redirecting to auth - user not authenticated');
          setAppState('auth');
        } else {
          // Additional security check - verify token is still valid
          try {
            const userResponse = await authService.getCurrentUser();
            if (userResponse.success && userResponse.data?.user) {
              console.log('[App] User authenticated successfully, entering main app');
              setAppState('main');
            } else {
              console.log('[App] Token validation failed, redirecting to auth');
              setAppState('auth');
            }
          } catch (error) {
            console.error('[App] Token validation error, redirecting to auth:', error);
            setAppState('auth');
          }
        }
        
        setIsInitialized(true);
        console.log('[App] Initialization complete');
      } catch (error) {
        console.error('[App] Initialization error:', error);
        if (isMounted) {
          // On any error, redirect to onboarding for a clean start
          setAppState('onboarding');
          setIsInitialized(true);
        }
      }
    };

    // Start initialization immediately
    initializeApp();

    // Failsafe timeout - much shorter and cleaner
    const failsafeTimeout = setTimeout(() => {
      if (isMounted && !isInitialized) {
        console.warn('[App] Failsafe triggered - forcing onboarding state');
        setAppState('onboarding');
        setIsInitialized(true);
      }
    }, 3000);

    return () => {
      isMounted = false;
      // Remove auth failure callback
      authService.removeAuthenticationFailureCallback(handleAuthFailure);
      clearTimeout(failsafeTimeout);
    };
  }, [isInitialized]);

  const handleLanguageSelected = () => {
    setAppState('auth');
  };

  const handleAuthSuccess = async () => {
    try {
      // Show brief loading state while localStorage is being refreshed
      console.log('[App] Authentication successful, preparing personalized experience...');
      // The authService already refreshed localStorage during login/register
      setAppState('main');
    } catch (error) {
      console.error('[App] Error after auth success:', error);
      // Fallback to main anyway
      setAppState('main');
    }
  };

  const handleLogout = async () => {
    try {
      console.log('[App] Complete logout initiated - terminating user session...');
      
      // Set loading state to prevent user interaction during logout
      setAppState('loading');
      setIsInitialized(false);
      
      // Perform complete logout
      await authService.logout();
      
      // Additional app-level cleanup
      console.log('[App] Performing app-level logout cleanup...');
      
      // Reset all state variables to initial values
      setAppState('onboarding');
      setIsInitialized(true);
      
      console.log('[App] Complete logout finished - user totally logged out');
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, force the user out of the app
      console.log('[App] Forcing logout due to error - clearing app state');
      
      // Force reset to clean state
      setAppState('onboarding');
      setIsInitialized(true);
    }
  };

  // Show minimal loading screen only while initializing
  if (!isInitialized) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer} pointerEvents="auto">
          <StatusBar style="auto" />
          <Text style={styles.loadingIcon}>🤰</Text>
          <Text style={styles.loadingText}>MamaCare</Text>
          <Text style={styles.loadingSubtext}>Loading...</Text>
          {/* Immediate skip option for better UX */}
          <TouchableOpacity 
            style={styles.skipButton} 
            onPress={() => {
              setAppState('onboarding');
              setIsInitialized(true);
            }}
            activeOpacity={0.6}
            delayPressIn={0}
            delayPressOut={0}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.skipButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: false,
            gestureEnabled: true,
            cardStyle: { backgroundColor: 'transparent' },
            // Optimize for better touch responsiveness
            animation: reducedMotion ? 'none' : 'slide_from_right',
            cardStyleInterpolator: reducedMotion 
              ? undefined // Use default minimal animation for reduced motion
              : ({ current }: any) => ({
                  cardStyle: {
                    opacity: current.progress,
                  },
                }),
          }}
        >
          {appState === 'onboarding' ? (
            <Stack.Screen 
              name="LanguageSelection"
              options={{ 
                gestureEnabled: false // Prevent accidental swipe back
              }}
            >
              {() => (
                <LanguageSelectionScreen 
                  onLanguageSelected={handleLanguageSelected}
                />
              )}
            </Stack.Screen>
          ) : appState === 'auth' ? (
            <Stack.Group>
              <Stack.Screen name="Welcome">
                {({ navigation }: any) => (
                  <WelcomeScreen 
                    onRegister={() => navigation.navigate('Register')}
                    onLogin={() => navigation.navigate('Login')}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Register">
                {({ navigation }: any) => (
                  <RegisterScreen 
                    onRegisterSuccess={handleAuthSuccess}
                    onNavigateToLogin={() => navigation.navigate('Login')}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Login">
                {({ navigation }: any) => (
                  <LoginScreen 
                    onLoginSuccess={handleAuthSuccess}
                    onNavigateToRegister={() => navigation.navigate('Register')}
                  />
                )}
              </Stack.Screen>
            </Stack.Group>
          ) : (
            <Stack.Screen 
              name="Main"
              options={{
                gestureEnabled: false // Prevent swipe back from main app
              }}
            >
              {() => <MainTabNavigator onLogout={handleLogout} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#e9f8e7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#023337',
    marginBottom: 10,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#4ea674',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  skipButton: {
    backgroundColor: '#4ea674',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  skipButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
