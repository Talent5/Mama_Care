const fs = require('fs');
const path = require('path');

// Files to clean console.log from
const filesToClean = [
  'backend/server.js',
  'admin-dashboard/src/services/api.ts',
  'admin-dashboard/src/components/AppUsersManagement.tsx'
];

function removeDebugLogs(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalLines = content.split('\n').length;

    // Remove debug console.log statements but keep important ones
    content = content.replace(/^\s*console\.log\(['"][🚀🔍📡🔗🏥🔐🔑⚠️✅❌🌐]\s.*$/gm, '');
    content = content.replace(/^\s*console\.log\(['"].*debug.*['"].*\);?\s*$/gmi, '');
    content = content.replace(/^\s*console\.log\(['"].*test.*['"].*\);?\s*$/gmi, '');
    
    // Clean up multiple empty lines
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    const newLines = content.split('\n').length;
    const removedLines = originalLines - newLines;

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Cleaned ${filePath} - removed ${removedLines} debug lines`);
  } catch (error) {
    console.log(`❌ Error cleaning ${filePath}:`, error.message);
  }
}

console.log('🧹 Removing debug console.log statements...\n');

filesToClean.forEach(removeDebugLogs);

console.log('\n✅ Debug cleanup complete!');
