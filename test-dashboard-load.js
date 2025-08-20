// Test script to identify dashboard loading issues
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api';

// Test dashboard endpoints that might be causing issues
const testEndpoints = [
  '/analytics/dashboard',
  '/auth/profile', 
  '/notifications',
  '/admin/system/status',
  '/admin/dashboard/stats'
];

async function testEndpoint(endpoint) {
  try {
    console.log(`Testing ${endpoint}...`);
    const start = Date.now();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add auth token if you have one
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });
    
    const duration = Date.now() - start;
    console.log(`✅ ${endpoint}: ${response.status} ${response.statusText} (${duration}ms)`);
    
    if (response.status === 429) {
      console.log('⚠️  Rate limit hit!');
      const text = await response.text();
      console.log('Response:', text);
    }
    
  } catch (error) {
    console.log(`❌ ${endpoint}: ${error.message}`);
  }
}

async function testMultipleRequests() {
  console.log('Testing multiple rapid requests (simulating dashboard loading)...\n');
  
  // Test multiple requests in parallel (like dashboard does)
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(testEndpoint('/analytics/dashboard'));
  }
  
  await Promise.all(promises);
  
  console.log('\n--- Individual endpoint tests ---');
  for (const endpoint of testEndpoints) {
    await testEndpoint(endpoint);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

testMultipleRequests().then(() => {
  console.log('\nTest completed!');
}).catch(error => {
  console.error('Test failed:', error);
});
