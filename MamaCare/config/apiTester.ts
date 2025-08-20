// API connectivity test utility
import { API_CONFIG } from './api';

export class ApiConnectionTester {
  static async testConnection(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    const baseUrl = API_CONFIG.BASE_URL;
    console.log('🔍 [ApiTester] Testing connection to:', baseUrl);
    
    // Test different possible URLs
    const testUrls = [
      baseUrl,
      baseUrl.replace('10.0.2.2', 'localhost'),
      baseUrl.replace('localhost', '10.0.2.2'),
      baseUrl.replace('http://', 'https://')
    ];

    for (const testUrl of testUrls) {
      try {
        console.log(`🧪 [ApiTester] Trying URL: ${testUrl}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for test
        
        const response = await fetch(`${testUrl.replace('/api', '')}/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ [ApiTester] Connection successful!', data);
          return {
            success: true,
            message: `Successfully connected to ${testUrl}`,
            details: data
          };
        } else {
          console.log(`❌ [ApiTester] HTTP ${response.status} for ${testUrl}`);
        }
      } catch (error) {
        console.log(`💥 [ApiTester] Failed to connect to ${testUrl}:`, error);
      }
    }

    return {
      success: false,
      message: 'Could not connect to any backend server URL. Please check if the backend is running and your network configuration.',
      details: {
        testedUrls: testUrls,
        suggestions: [
          'Make sure backend server is running (npm start in backend folder)',
          'Check if you are using Android Emulator (use 10.0.2.2) or iOS Simulator (use localhost)',
          'For physical device, use your computer\'s IP address',
          'Check firewall settings on your computer'
        ]
      }
    };
  }

  static async testApiEndpoint(endpoint: string, method: string = 'GET'): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      console.log(`🧪 [ApiTester] Testing ${method} ${endpoint}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ [ApiTester] ${endpoint} works!`);
        return {
          success: true,
          message: `${endpoint} endpoint is working`,
          data
        };
      } else {
        console.log(`❌ [ApiTester] ${endpoint} failed: ${response.status}`);
        return {
          success: false,
          message: `${endpoint} returned HTTP ${response.status}: ${data.message || 'Unknown error'}`
        };
      }
    } catch (error) {
      console.log(`💥 [ApiTester] ${endpoint} error:`, error);
      return {
        success: false,
        message: `Failed to test ${endpoint}: ${error}`
      };
    }
  }
}

// Quick test function you can call from your component
export const quickApiTest = async () => {
  console.log('🚀 [ApiTester] Starting quick API connectivity test...');
  
  // Test basic connection
  const connectionTest = await ApiConnectionTester.testConnection();
  console.log('📋 [ApiTester] Connection test result:', connectionTest);
  
  if (connectionTest.success) {
    // Test auth endpoint
    const authTest = await ApiConnectionTester.testApiEndpoint('/health');
    console.log('📋 [ApiTester] Health endpoint test:', authTest);
  }
  
  return connectionTest;
};
