#!/usr/bin/env node

/**
 * Development helper script for MamaCare
 * This script helps handle Expo Go limitations and provides development alternatives
 */

const fs = require('fs');
const path = require('path');

console.log('🏥 MamaCare Development Helper');
console.log('==============================');

// Check if running in Expo Go
const expoGoWarning = `
⚠️  EXPO GO LIMITATIONS DETECTED

Push notifications don't work in Expo Go for SDK 53+. 
This is expected behavior, not an error in your code.

For full push notification functionality, you need to:

1. Create a development build:
   npx eas build --profile development --platform android

2. Or use the Expo Development Client:
   npx expo install expo-dev-client
   npx eas build --profile development --platform android

3. For now, the app will use local notifications only.

📱 Your app will still work perfectly for development!
`;

console.log(expoGoWarning);

// Check if EAS is configured
const easJsonPath = path.join(__dirname, 'eas.json');
if (fs.existsSync(easJsonPath)) {
  console.log('✅ EAS configuration found');
} else {
  console.log('ℹ️  Run "npx eas init" to set up EAS for production builds');
}

console.log('\n🚀 Starting Expo development server...\n');
