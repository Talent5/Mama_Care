import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { authService } from '../services';

interface AuthGuardProps {
  children: React.ReactNode;
  onAuthFailure: () => void;
  fallback?: React.ReactNode;
}

interface AuthState {
  isChecking: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  onAuthFailure, 
  fallback 
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    isChecking: true,
    isAuthenticated: false,
    error: null
  });

  useEffect(() => {
    let isMounted = true;
    
    const checkAuthentication = async () => {
      try {
        setAuthState(prev => ({ ...prev, isChecking: true, error: null }));
        
        // Simple authentication check - just verify we have a token and user
        const isAuthenticated = authService.isAuthenticated();
        const user = authService.getUser();
        const token = authService.getToken();
        
        if (!isMounted) return;
        
        if (isAuthenticated && user && token) {
          setAuthState({
            isChecking: false,
            isAuthenticated: true,
            error: null
          });
        } else {
          console.log('[AuthGuard] Authentication check failed - missing token or user');
          setAuthState({
            isChecking: false,
            isAuthenticated: false,
            error: 'Not authenticated'
          });
          onAuthFailure();
        }
      } catch (error) {
        console.error('[AuthGuard] Authentication check failed:', error);
        if (isMounted) {
          setAuthState({
            isChecking: false,
            isAuthenticated: false,
            error: 'Authentication check failed'
          });
          onAuthFailure();
        }
      }
    };

    // Initial check only - no periodic checks
    checkAuthentication();

    return () => {
      isMounted = false;
    };
  }, [onAuthFailure]);

  if (authState.isChecking) {
    return fallback || (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4ea674" />
        <Text style={styles.text}>Verifying authentication...</Text>
      </View>
    );
  }

  if (!authState.isAuthenticated) {
    return fallback || (
      <View style={styles.container}>
        <Text style={styles.errorText}>Authentication required</Text>
        <Text style={styles.subText}>Please login to continue</Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#4ea674',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc3545',
    marginBottom: 8,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
});

export default AuthGuard;
