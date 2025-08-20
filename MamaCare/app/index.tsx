import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

// Import i18n
import '../i18n';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import WelcomeScreen from '../screens/WelcomeScreen';

// Import utilities
import { AuthStorage } from '../utils/authStorage';

type AppState = 'loading' | 'onboarding' | 'auth' | 'main';

export default function Index() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [currentScreen, setCurrentScreen] = useState<string>('LanguageSelection');

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      const hasCompletedOnboarding = await AuthStorage.hasCompletedOnboarding();
      const isLoggedIn = await AuthStorage.isLoggedIn();

      if (!hasCompletedOnboarding) {
        setAppState('onboarding');
        setCurrentScreen('LanguageSelection');
      } else if (!isLoggedIn) {
        setAppState('auth');
        setCurrentScreen('Welcome');
      } else {
        setAppState('main');
        setCurrentScreen('Dashboard');
      }
    } catch (error) {
      console.error('Error checking app state:', error);
      setAppState('onboarding');
      setCurrentScreen('LanguageSelection');
    }
  };

  const handleLanguageSelected = () => {
    setAppState('auth');
    setCurrentScreen('Welcome');
  };

  const handleNavigateToRegister = () => {
    setCurrentScreen('Register');
  };

  const handleNavigateToLogin = () => {
    setCurrentScreen('Login');
  };

  const handleAuthSuccess = () => {
    setAppState('main');
    setCurrentScreen('Dashboard');
  };

  const handleLogout = () => {
    setAppState('auth');
    setCurrentScreen('Welcome');
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'LanguageSelection':
        return (
          <LanguageSelectionScreen 
            onLanguageSelected={handleLanguageSelected}
          />
        );
      
      case 'Welcome':
        return (
          <WelcomeScreen 
            onRegister={handleNavigateToRegister}
            onLogin={handleNavigateToLogin}
          />
        );
      
      case 'Register':
        return (
          <RegisterScreen 
            onRegisterSuccess={handleAuthSuccess}
            onNavigateToLogin={handleNavigateToLogin}
          />
        );
      
      case 'Login':
        return (
          <LoginScreen 
            onLoginSuccess={handleAuthSuccess}
            onNavigateToRegister={handleNavigateToRegister}
          />
        );
      
      case 'Dashboard':
        return (
          <DashboardScreen 
            onLogout={handleLogout}
          />
        );
      
      default:
        return (
          <LanguageSelectionScreen 
            onLanguageSelected={handleLanguageSelected}
          />
        );
    }
  };

  if (appState === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      {renderCurrentScreen()}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#e9f8e7',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
