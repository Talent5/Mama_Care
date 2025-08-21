import fetch from 'node-fetch';

const testLocalDevelopment = async () => {
  console.log('🧪 Testing Local Development CORS Setup...\n');
  
  const backendUrl = 'http://localhost:5000';
  const testOrigins = [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // React dev server
    'http://localhost:8081', // Expo dev server
    'http://127.0.0.1:5173', // Alternative localhost
    'http://192.168.0.49:5173', // Local network (adjust IP as needed)
    'http://10.0.2.2:5173', // Android emulator
  ];
  
  console.log(`Testing backend at: ${backendUrl}\n`);
  
  for (const origin of testOrigins) {
    console.log(`🔍 Testing origin: ${origin}`);
    
    try {
      // Test preflight OPTIONS request
      const preflightResponse = await fetch(`${backendUrl}/api/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });
      
      console.log(`  Preflight: ${preflightResponse.status}`);
      
      // Test actual GET request
      const getResponse = await fetch(`${backendUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Origin': origin,
          'Content-Type': 'application/json'
        }
      });
      
      const corsOrigin = getResponse.headers.get('Access-Control-Allow-Origin');
      console.log(`  GET: ${getResponse.status}, CORS Origin: ${corsOrigin || 'MISSING'}`);
      
      if (corsOrigin && (corsOrigin === origin || corsOrigin === '*')) {
        console.log(`  ✅ CORS working for ${origin}`);
      } else {
        console.log(`  ❌ CORS failed for ${origin}`);
      }
      
    } catch (error) {
      console.log(`  💥 Error testing ${origin}: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🏁 Local development CORS test completed');
};

// Run the test
console.log('Starting local development CORS test...');
console.log('Make sure your backend is running on http://localhost:5000\n');

testLocalDevelopment().catch(console.error);
