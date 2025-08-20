# MongoDB Atlas Setup Script for MamaCare (PowerShell)
# This script helps you configure MongoDB Atlas for your MamaCare project

Write-Host "🏥 MamaCare MongoDB Atlas Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Prerequisites Checklist:" -ForegroundColor Yellow
Write-Host "✓ MongoDB Atlas account created"
Write-Host "✓ Database cluster created (free M0 tier is fine)"
Write-Host "✓ Database user created with read/write permissions"
Write-Host "✓ Network access configured (0.0.0.0/0 for development)"
Write-Host "✓ Connection string obtained from Atlas dashboard"
Write-Host ""

Write-Host "🔗 Steps to get your connection string:" -ForegroundColor Cyan
Write-Host "1. Login to MongoDB Atlas (https://cloud.mongodb.com)"
Write-Host "2. Go to your cluster and click 'Connect'"
Write-Host "3. Choose 'Connect your application'"
Write-Host "4. Select 'Node.js' driver"
Write-Host "5. Copy the connection string"
Write-Host ""

$atlasUri = Read-Host "📝 Enter your MongoDB Atlas connection string"

if ([string]::IsNullOrEmpty($atlasUri)) {
    Write-Host "❌ Error: Connection string cannot be empty" -ForegroundColor Red
    exit 1
}

# Backup current .env file
if (Test-Path ".env") {
    Copy-Item ".env" ".env.backup"
    Write-Host "✅ Backed up current .env to .env.backup" -ForegroundColor Green
}

# Update .env file with Atlas URI
Write-Host "🔄 Updating .env file with MongoDB Atlas configuration..." -ForegroundColor Yellow

# Create new .env with Atlas configuration
$envContent = @"
# Environment Variables
NODE_ENV=development
PORT=5000

# MongoDB Atlas Configuration (Cloud)
MONGODB_URI=$atlasUri

# JWT Configuration
JWT_SECRET=mamacare_super_secret_jwt_key_2025_zimbabwe_healthcare
JWT_EXPIRE=7d

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Admin Configuration
ADMIN_EMAIL=admin@mamacare.com
ADMIN_PASSWORD=ChangeThisPassword123!

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:19006

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "✅ Environment configuration updated!" -ForegroundColor Green
Write-Host ""

Write-Host "🧪 Testing MongoDB Atlas connection..." -ForegroundColor Yellow

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Test the connection
Write-Host "🔌 Testing connection to MongoDB Atlas..." -ForegroundColor Yellow

$testScript = @"
const mongoose = require('mongoose');
const uri = '$atlasUri';

mongoose.connect(uri)
  .then(() => {
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('🌍 Database host:', mongoose.connection.host);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to connect to MongoDB Atlas:');
    console.error(error.message);
    process.exit(1);
  });
"@

$testScript | Out-File -FilePath "test-connection.js" -Encoding UTF8

try {
    node test-connection.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 MongoDB Atlas setup completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Next steps:" -ForegroundColor Cyan
        Write-Host "1. Start the backend server: npm run dev"
        Write-Host "2. Create a super admin: npm run create-superadmin"
        Write-Host "3. Test API endpoints"
        Write-Host ""
        Write-Host "🔍 Monitor your database at: https://cloud.mongodb.com" -ForegroundColor Cyan
    } else {
        throw "Connection test failed"
    }
} catch {
    Write-Host ""
    Write-Host "❌ Connection test failed. Please check:" -ForegroundColor Red
    Write-Host "1. Connection string is correct"
    Write-Host "2. Username and password are correct"
    Write-Host "3. IP address is whitelisted (use 0.0.0.0/0 for testing)"
    Write-Host "4. Network connectivity"
    Write-Host ""
    Write-Host "🔄 Restoring original .env file..." -ForegroundColor Yellow
    if (Test-Path ".env.backup") {
        Copy-Item ".env.backup" ".env"
        Write-Host "✅ Original .env restored" -ForegroundColor Green
    }
} finally {
    # Clean up test file
    if (Test-Path "test-connection.js") {
        Remove-Item "test-connection.js"
    }
}

Write-Host ""
Write-Host "💡 Tip: Your MongoDB connection string should look like:" -ForegroundColor Magenta
Write-Host "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mamacare?retryWrites=true&w=majority"
