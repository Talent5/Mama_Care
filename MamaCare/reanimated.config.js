/**
 * React Native Reanimated Configuration
 * This file configures Reanimated to work better with touch responsiveness
 * and accessibility settings, and suppresses the reduced motion warning.
 */

// Suppress console warnings for Reanimated in development
if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    // Filter out the reduced motion warning specifically
    if (args[0] && typeof args[0] === 'string' && 
        args[0].includes('Reduced motion setting is enabled')) {
      // Silently ignore this warning
      return;
    }
    // Allow other warnings through
    originalWarn(...args);
  };
}

// Note: React Native Reanimated doesn't export a configure function in newer versions
// The main configuration should be done through babel plugins and metro config
