import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';

interface TouchPerformanceMonitorProps {
  children: React.ReactNode;
}

/**
 * A lightweight component that monitors touch performance without blocking the UI
 */
export default function TouchPerformanceMonitor({ children }: TouchPerformanceMonitorProps) {
  const lastCheckTime = useRef(Date.now());
  const renderCount = useRef(0);
  const hasLoggedWarning = useRef(false);

  useEffect(() => {
    renderCount.current += 1;
    
    // Only log performance warnings once to avoid console spam
    if (renderCount.current > 100 && !hasLoggedWarning.current) {
      console.warn('[TouchPerformance] High render count detected - potential performance issue');
      hasLoggedWarning.current = true;
    }

    // Lightweight performance check every 30 seconds
    const checkInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastCheck = now - lastCheckTime.current;
      
      if (timeSinceLastCheck > 35000) {
        console.warn('[TouchPerformance] UI may be blocked - check for touch responsiveness');
      }
      
      lastCheckTime.current = now;
    }, 30000);

    return () => clearInterval(checkInterval);
  }, []);

  const handleTouchStart = () => {
    lastCheckTime.current = Date.now();
  };

  return (
    <View style={{ flex: 1 }} onTouchStart={handleTouchStart}>
      {children}
    </View>
  );
}
