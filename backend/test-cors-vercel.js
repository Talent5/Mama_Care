import fetch from 'node-fetch';

const testCorsEndpoint = async () => {
  const baseUrl = 'https://mama-care-g7y1.onrender.com';
  const frontendOrigin = 'https://mama-care-2m7mq1hws-talent5s-projects.vercel.app';
  
  console.log('🧪 Testing CORS configuration...\n');
  
  // Test 1: Health check endpoint
  try {
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Origin': frontendOrigin,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${healthResponse.status}`);
    console.log('CORS Headers:');
    console.log(`  Access-Control-Allow-Origin: ${healthResponse.headers.get('Access-Control-Allow-Origin')}`);
    console.log(`  Access-Control-Allow-Credentials: ${healthResponse.headers.get('Access-Control-Allow-Credentials')}`);
    console.log(`  Access-Control-Allow-Methods: ${healthResponse.headers.get('Access-Control-Allow-Methods')}`);
    
    if (healthResponse.ok) {
      const data = await healthResponse.json();
      console.log('✅ Health check successful');
      console.log(`Database status: ${data.database}\n`);
    } else {
      console.log('❌ Health check failed\n');
    }
  } catch (error) {
    console.log(`❌ Health check error: ${error.message}\n`);
  }
  
  // Test 2: OPTIONS preflight request
  try {
    console.log('2️⃣ Testing OPTIONS preflight request...');
    const preflightResponse = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'OPTIONS',
      headers: {
        'Origin': frontendOrigin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log(`Status: ${preflightResponse.status}`);
    console.log('Preflight CORS Headers:');
    console.log(`  Access-Control-Allow-Origin: ${preflightResponse.headers.get('Access-Control-Allow-Origin')}`);
    console.log(`  Access-Control-Allow-Methods: ${preflightResponse.headers.get('Access-Control-Allow-Methods')}`);
    console.log(`  Access-Control-Allow-Headers: ${preflightResponse.headers.get('Access-Control-Allow-Headers')}`);
    
    if (preflightResponse.status === 204 || preflightResponse.status === 200) {
      console.log('✅ Preflight request successful\n');
    } else {
      console.log('❌ Preflight request failed\n');
    }
  } catch (error) {
    console.log(`❌ Preflight request error: ${error.message}\n`);
  }
  
  // Test 3: Actual API request (will fail without auth, but should pass CORS)
  try {
    console.log('3️⃣ Testing actual API request (without auth)...');
    const apiResponse = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Origin': frontendOrigin,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${apiResponse.status}`);
    console.log('API CORS Headers:');
    console.log(`  Access-Control-Allow-Origin: ${apiResponse.headers.get('Access-Control-Allow-Origin')}`);
    
    if (apiResponse.headers.get('Access-Control-Allow-Origin')) {
      console.log('✅ CORS headers present in API response');
    } else {
      console.log('❌ Missing CORS headers in API response');
    }
    
    // Even if unauthorized, we should get CORS headers
    const responseText = await apiResponse.text();
    console.log(`Response: ${responseText.substring(0, 100)}...\n`);
    
  } catch (error) {
    console.log(`❌ API request error: ${error.message}\n`);
  }
  
  console.log('🏁 CORS test completed');
};

testCorsEndpoint().catch(console.error);
