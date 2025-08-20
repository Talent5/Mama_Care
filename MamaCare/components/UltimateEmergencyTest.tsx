import { useEffect, useRef, useState } from 'react';
import { Dimensions, PanResponder, StyleSheet, Text, View } from 'react-native';

const UltimateEmergencyTest = () => {
  const [touchCount, setTouchCount] = useState(0);
  const [lastTouch, setLastTouch] = useState<string>('');
  const touchCountRef = useRef(0);
  const gestureRef = useRef<any>(null);

  // Use PanResponder for lower-level touch handling
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        console.log('[UltimateEmergency] PanResponder onStartShouldSetPanResponder');
        return true;
      },
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        touchCountRef.current += 1;
        const now = new Date().toLocaleTimeString();
        console.log(`[UltimateEmergency] PanResponder Touch #${touchCountRef.current} at ${now}`);
        
        // Update state immediately
        setTouchCount(touchCountRef.current);
        setLastTouch(now);
        
        // Force a visual change by flashing background
        if (gestureRef.current) {
          gestureRef.current.setNativeProps({
            style: {
              backgroundColor: touchCountRef.current % 2 === 0 ? '#ff0000' : '#00ff00'
            }
          });
        }
      },
      onPanResponderMove: () => {
        // Do nothing to keep it simple
      },
      onPanResponderRelease: () => {
        console.log('[UltimateEmergency] PanResponder onPanResponderRelease');
      },
    })
  ).current;

  // Also try native touch events
  useEffect(() => {
    const interval = setInterval(() => {
      console.log(`[UltimateEmergency] Heartbeat - Touch count: ${touchCountRef.current}`);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>ULTIMATE EMERGENCY TOUCH TEST</Text>
        <Text style={styles.subtitle}>Tap ANYWHERE on this screen</Text>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Text style={styles.countText}>Touch Count: {touchCount}</Text>
        <Text style={styles.timeText}>Last Touch: {lastTouch || 'None'}</Text>
        <Text style={styles.statusText}>
          Status: {touchCount === 0 ? 'Waiting...' : touchCount === 1 ? 'ONE TOUCH!' : 'MULTIPLE TOUCHES!'}
        </Text>
      </View>

      {/* Full screen touch area using PanResponder */}
      <View
        ref={gestureRef}
        style={[
          styles.touchArea,
          {
            width: screenWidth,
            height: screenHeight * 0.7,
            backgroundColor: touchCount % 2 === 0 ? '#e9f8e7' : '#f8e7e9',
          }
        ]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.instructions}>
          {touchCount === 0 ? 'TAP HERE TO START' : 
           touchCount === 1 ? 'TAP AGAIN - DID IT WORK?' : 
           'KEEP TAPPING!'}
        </Text>

        {/* Visual feedback blocks */}
        <View style={styles.feedbackGrid}>
          {Array.from({ length: Math.min(touchCount, 12) }, (_, i) => (
            <View
              key={i}
              style={[
                styles.feedbackBlock,
                { backgroundColor: i % 2 === 0 ? '#4ea674' : '#023337' }
              ]}
            />
          ))}
        </View>
      </View>

      {/* Debug info */}
      <View style={styles.debug}>
        <Text style={styles.debugText}>Using PanResponder for low-level touch detection</Text>
        <Text style={styles.debugText}>Ref count: {touchCountRef.current}</Text>
        <Text style={styles.debugText}>State count: {touchCount}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 20,
    backgroundColor: '#023337',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 5,
    textAlign: 'center',
  },
  stats: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  countText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#023337',
  },
  timeText: {
    fontSize: 16,
    color: '#4ea674',
    marginTop: 5,
  },
  statusText: {
    fontSize: 16,
    color: '#e74c3c',
    marginTop: 5,
    fontWeight: 'bold',
  },
  touchArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#023337',
  },
  instructions: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#023337',
    marginBottom: 20,
  },
  feedbackGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackBlock: {
    width: 30,
    height: 30,
    margin: 5,
    borderRadius: 5,
  },
  debug: {
    padding: 10,
    backgroundColor: '#333333',
    alignItems: 'center',
  },
  debugText: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default UltimateEmergencyTest;
