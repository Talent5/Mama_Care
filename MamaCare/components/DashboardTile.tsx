import { useRef } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface DashboardTileProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  backgroundColor?: string;
  urgent?: boolean;
}

export default function DashboardTile({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  backgroundColor = '#c0e6b9',
  urgent = false 
}: DashboardTileProps) {
  const lastPressTime = useRef(0);

  const handlePress = () => {
    // Simple throttling to prevent double-taps - reduced from 300ms to 150ms
    const now = Date.now();
    if (now - lastPressTime.current < 150) {
      return;
    }
    lastPressTime.current = now;
    
    onPress();
  };

  return (
    <TouchableOpacity 
      style={[
        styles.tile,
        { backgroundColor },
        urgent && styles.urgentTile
      ]} 
      onPress={handlePress}
      activeOpacity={0.6}
      delayPressIn={0}
      delayPressOut={0}
      hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
    >
      <View style={styles.tileContent}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.title, urgent && styles.urgentText]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, urgent && styles.urgentSubtext]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {urgent && (
        <View style={styles.urgentIndicator}>
          <Text style={styles.urgentIndicatorText}>!</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    minHeight: 100,
    justifyContent: 'center',
  },
  urgentTile: {
    backgroundColor: '#ff6b6b',
  },
  tileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#023337',
    marginBottom: 4,
  },
  urgentText: {
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#023337',
    opacity: 0.8,
    lineHeight: 18,
  },
  urgentSubtext: {
    color: 'white',
    opacity: 0.9,
  },
  urgentIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentIndicatorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
});
