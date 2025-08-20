import { useRef } from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface SafeTouchableOpacityProps extends TouchableOpacityProps {
  throttleDelay?: number;
  debugLabel?: string;
}

/**
 * A safer TouchableOpacity that prevents rapid taps with minimal overhead
 * Removed heavy debugging to improve performance
 */
export default function SafeTouchableOpacity({
  onPress,
  throttleDelay = 150, // Reduced for better responsiveness
  debugLabel = 'SafeTouchable',
  children,
  ...props
}: SafeTouchableOpacityProps) {
  const lastPressTime = useRef(0);

  const handlePress = (event?: any) => {
    const now = Date.now();
    const timeSinceLastPress = now - lastPressTime.current;

    // Simple throttling without complex logging
    if (timeSinceLastPress < throttleDelay) {
      return;
    }

    lastPressTime.current = now;

    if (onPress) {
      try {
        onPress(event);
      } catch (error) {
        console.error(`[${debugLabel}] Error in onPress:`, error);
      }
    }
  };

  return (
    <TouchableOpacity
      {...props}
      onPress={handlePress}
      activeOpacity={props.activeOpacity ?? 0.7}
      delayPressIn={props.delayPressIn ?? 0}
      delayPressOut={props.delayPressOut ?? 50}
    >
      {children}
    </TouchableOpacity>
  );
}
