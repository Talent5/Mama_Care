// Test script to verify the API URL fix
console.log('🔍 Testing API connection fix...');

// Test the corrected API URL construction
const VITE_API_URL = 'https://mama-care-g7y1.onrender.com';
const API_BASE_URL = `${VITE_API_URL}/api`;

console.log('📡 API Base URL:', API_BASE_URL);
console.log('🔗 Auth login endpoint:', `${API_BASE_URL}/auth/login`);

// Test fetch to health endpoint
async function testConnection() {
  try {
    console.log('\n🏥 Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health endpoint working:', healthData);
    } else {
      console.log('❌ Health endpoint failed:', healthResponse.status, healthResponse.statusText);
    }
    
    // Test auth endpoint (should return 400 for empty body, not 404)
    console.log('\n🔐 Testing auth endpoint...');
    const authResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}) // Empty body should give validation error, not 404
    });
    
    console.log('🔑 Auth endpoint status:', authResponse.status);
    if (authResponse.status === 400) {
      console.log('✅ Auth endpoint accessible (validation error expected)');
    } else if (authResponse.status === 404) {
      console.log('❌ Auth endpoint not found - URL might still be wrong');
    } else {
      console.log('⚠️  Auth endpoint returned unexpected status:', authResponse.status);
    }
    
  } catch (error) {
    console.error('💥 Connection test failed:', error.message);
  }
}

// Run the test
testConnection();
