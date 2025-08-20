import { useEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';

export default function DiagnosticTest() {
  const [touchCount, setTouchCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isResponding, setIsResponding] = useState(true);
  const lastTouchTime = useRef<number>(0);
  const touchCheckInterval = useRef<number | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `${timestamp}: ${message}`;
    console.log(`[DiagnosticTest] ${logEntry}`);
    setLogs(prev => [...prev.slice(-4), logEntry]); // Keep last 5 logs
  };

  // Check if touch system is still responding
  useEffect(() => {
    touchCheckInterval.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastTouch = now - lastTouchTime.current;
      
      if (touchCount > 0 && timeSinceLastTouch > 10000) { // 10 seconds since last touch
        if (isResponding) {
          addLog('⚠️ Touch system appears unresponsive');
          setIsResponding(false);
        }
      }
    }, 2000) as unknown as number;

    return () => {
      if (touchCheckInterval.current) {
        clearInterval(touchCheckInterval.current);
      }
    };
  }, [touchCount, isResponding]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        addLog('📱 Touch detected by PanResponder');
        return true;
      },
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const now = Date.now();
        lastTouchTime.current = now;
        setTouchCount(prev => prev + 1);
        setIsResponding(true);
        addLog(`✅ Touch #${touchCount + 1} registered`);
      },
      onPanResponderMove: () => {
        // Track movement
      },
      onPanResponderRelease: () => {
        addLog('👆 Touch released');
      },
    })
  ).current;

  const getStatusColor = () => {
    if (touchCount === 0) return '#FFA500'; // Orange - waiting for first touch
    if (isResponding) return '#4CAF50'; // Green - working
    return '#F44336'; // Red - unresponsive
  };

  const getStatusText = () => {
    if (touchCount === 0) return 'Waiting for first touch...';
    if (isResponding) return 'Touch system active';
    return 'Touch system appears frozen';
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.header}>
        <Text style={styles.title}>🔬 Touch Diagnostic Test</Text>
        <Text style={[styles.status, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statText}>Touch Count: {touchCount}</Text>
        <Text style={styles.statText}>
          Status: {isResponding ? '✅ Active' : '❌ Frozen'}
        </Text>
      </View>

      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>📋 Recent Activity:</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          🎯 Tap anywhere to test touch response
        </Text>
        <Text style={styles.instructionText}>
          🔄 Pull down to reload if touch stops working
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  status: {
    fontSize: 18,
    fontWeight: '600',
  },
  stats: {
    backgroundColor: '#222',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  statText: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 5,
  },
  logContainer: {
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    minHeight: 120,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  logText: {
    fontSize: 12,
    color: '#CCC',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  instructions: {
    backgroundColor: '#1E3A8A',
    padding: 15,
    borderRadius: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 5,
  },
});
