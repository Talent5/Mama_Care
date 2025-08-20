// Test script to verify API connection to the new backend
const fetch = require('node-fetch');

const API_BASE_URL = 'https://mama-care-g7y1.onrender.com';

async function testApiConnection() {
  console.log('🔍 Testing API connection to:', API_BASE_URL);
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      timeout: 10000
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.text();
      console.log('✅ Health endpoint working:', healthData);
    } else {
      console.log('❌ Health endpoint failed:', healthResponse.status, healthResponse.statusText);
    }
    
    // Test API base endpoint
    console.log('\n2. Testing API base endpoint...');
    const apiResponse = await fetch(`${API_BASE_URL}/api`, {
      method: 'GET',
      timeout: 10000
    });
    
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log('✅ API base endpoint working:', apiData);
    } else {
      console.log('❌ API base endpoint failed:', apiResponse.status, apiResponse.statusText);
    }
    
    // Test auth endpoints availability
    console.log('\n3. Testing auth endpoints...');
    const authResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phoneNumber: 'test', password: 'test' }),
      timeout: 10000
    });
    
    // We expect this to fail with 400 or similar, but it shouldn't be a connection error
    console.log('✅ Auth endpoint accessible (status:', authResponse.status, ')');
    
  } catch (error) {
    console.error('💥 API connection test failed:', error.message);
  }
}

testApiConnection();
