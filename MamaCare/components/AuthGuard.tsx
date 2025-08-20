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
        
        // Verify authentication status
        const isLoggedIn = await authService.isLoggedIn();
        
        if (!isMounted) return;
        
        if (isLoggedIn) {
          // Double-check with current user
          try {
            const userResponse = await authService.getCurrentUser();
            if (userResponse.success && userResponse.data?.user) {
              setAuthState({
                isChecking: false,
                isAuthenticated: true,
                error: null
              });
            } else {
              throw new Error('Invalid user session');
            }
          } catch (userError) {
            console.error('[AuthGuard] User validation failed:', userError);
            // Force complete logout on user verification failure
            await authService.forceCompleteLogout();
            setAuthState({
              isChecking: false,
              isAuthenticated: false,
              error: 'Session expired'
            });
            onAuthFailure();
          }
        } else {
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
          // Force complete logout on any authentication error
          await authService.forceCompleteLogout();
          setAuthState({
            isChecking: false,
            isAuthenticated: false,
            error: 'Authentication check failed'
          });
          onAuthFailure();
        }
      }
    };

    // Initial check
    checkAuthentication();

    // Set up periodic authentication checks (every 5 minutes)
    const authCheckInterval = setInterval(checkAuthentication, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(authCheckInterval);
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
