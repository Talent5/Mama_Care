// Test script to verify CORS fix
const fetch = require('node-fetch');

const testCORS = async () => {
  const baseUrl = 'https://mama-care-g7y1.onrender.com';
  
  console.log('🔍 Testing CORS configuration...\n');
  
  try {
    // Test health endpoint first
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Headers:`, healthResponse.headers.raw());
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log(`   Response:`, health);
    }
    
    console.log('\n2. Testing OPTIONS preflight request...');
    const optionsResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log(`   Status: ${optionsResponse.status}`);
    console.log(`   Access-Control-Allow-Origin: ${optionsResponse.headers.get('access-control-allow-origin')}`);
    console.log(`   Access-Control-Allow-Methods: ${optionsResponse.headers.get('access-control-allow-methods')}`);
    console.log(`   Access-Control-Allow-Headers: ${optionsResponse.headers.get('access-control-allow-headers')}`);
    
    console.log('\n3. Testing actual POST request...');
    const postResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123'
      })
    });
    
    console.log(`   Status: ${postResponse.status}`);
    console.log(`   Access-Control-Allow-Origin: ${postResponse.headers.get('access-control-allow-origin')}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testCORS();
