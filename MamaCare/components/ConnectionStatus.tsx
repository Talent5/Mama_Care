import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { API_CONFIG } from '../config/api';

interface ConnectionStatusProps {
  visible?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ visible = true }) => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const serverUrl = API_CONFIG.BASE_URL;

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.log('Connection check failed:', error);
      setConnectionStatus('disconnected');
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#4ea674';
      case 'disconnected':
        return '#e74c3c';
      case 'checking':
        return '#f39c12';
      default:
        return '#666';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return '● Connected';
      case 'disconnected':
        return '● Disconnected';
      case 'checking':
        return '● Checking...';
      default:
        return '● Unknown';
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={checkConnection} style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
        <Text style={styles.urlText} numberOfLines={1}>
          {serverUrl}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    zIndex: 1000,
  },
  statusContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    minWidth: 120,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  urlText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default ConnectionStatus;
