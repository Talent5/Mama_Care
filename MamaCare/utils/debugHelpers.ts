// Lightweight debug helpers for tracking critical issues only

export class TouchDebugger {
  private static touchCount = 0;
  private static lastTouchTime = Date.now();
  private static isLoggingEnabled = false; // Disabled by default for performance
  private static maxTouchLogs = 5; // Severely limited

  static logTouch(component: string, action: string) {
    if (!this.isLoggingEnabled) return;
    
    this.touchCount++;
    
    // Only log first few touches in development
    if (this.touchCount <= this.maxTouchLogs) {
      console.log(`[Touch] ${component} - ${action}`);
    }
  }

  static enableLogging() {
    this.isLoggingEnabled = true;
    console.log('[Touch] Debug logging enabled');
  }

  static disableLogging() {
    this.isLoggingEnabled = false;
  }

  static reset() {
    this.touchCount = 0;
    this.lastTouchTime = Date.now();
  }
}

export class PerformanceMonitor {
  private static startTime = Date.now();
  private static warningCount = 0;
  private static maxWarnings = 3; // Limit warnings

  static logPerformance(component: string, operation: string) {
    // Only log critical performance issues
    if (this.warningCount < this.maxWarnings) {
      const uptime = Date.now() - this.startTime;
      
      if (uptime > 60000 && this.warningCount === 0) {
        console.warn('[Performance] App running 60+ seconds - monitor touch responsiveness');
        this.warningCount++;
      }
    }
  }
}

// Minimal error handling without performance impact
export const setupGlobalErrorHandling = () => {
  // Only set up in development
  if (__DEV__) {
    const originalError = console.error;
    console.error = (...args) => {
      // Only log React Native specific errors
      if (args[0] && typeof args[0] === 'string' && args[0].includes('Warning:')) {
        return; // Suppress React warnings in production
      }
      originalError(...args);
    };
  }
};
