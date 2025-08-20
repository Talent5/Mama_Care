import { apiClient } from '../config/api';

/**
 * Simple function to test API connectivity
 * Call this from your app to check if the backend is reachable
 */
export const testApiConnection = async (): Promise<{
  success: boolean;
  workingUrl?: string;
  message: string;
}> => {
  try {
    console.log('🔍 [ConnectionTest] Starting API connectivity test...');
    
    // First try to find a working URL
    const workingUrl = await apiClient.findWorkingUrl();
    
    if (workingUrl) {
      console.log('✅ [ConnectionTest] Found working API URL:', workingUrl);
      return {
        success: true,
        workingUrl,
        message: `Successfully connected to backend at ${workingUrl}`
      };
    } else {
      console.log('❌ [ConnectionTest] No working API URL found');
      return {
        success: false,
        message: 'Could not connect to backend server. Please check:\n' +
                '1. Backend server is running (npm start)\n' +
                '2. You are using the correct IP address\n' +
                '3. Firewall is not blocking the connection\n' +
                '4. You are on the same network as the backend'
      };
    }
  } catch (error) {
    console.log('💥 [ConnectionTest] Connection test failed:', error);
    return {
      success: false,
      message: `Connection test failed: ${error}`
    };
  }
};

/**
 * Quick health check function
 */
export const quickHealthCheck = async (): Promise<boolean> => {
  try {
    const result = await apiClient.testConnection();
    console.log('🏥 [HealthCheck] Result:', result);
    return result;
  } catch (error) {
    console.log('💥 [HealthCheck] Failed:', error);
    return false;
  }
};

/**
 * Test the registration endpoint specifically
 */
export const testRegistrationEndpoint = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    console.log('🧪 [RegTest] Testing registration endpoint...');
    
    // Try a simple GET to /health to see if server is working
    const response = await fetch(`${apiClient.getBaseUrl().replace('/api', '')}/health`);
    
    if (response.ok) {
      return {
        success: true,
        message: 'Registration endpoint appears to be accessible'
      };
    } else {
      return {
        success: false,
        message: `Registration endpoint returned: ${response.status} ${response.statusText}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Cannot reach registration endpoint: ${error}`
    };
  }
};
