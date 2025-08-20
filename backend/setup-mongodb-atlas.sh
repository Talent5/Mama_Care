#!/bin/bash

# MongoDB Atlas Setup Script for MamaCare
# This script helps you configure MongoDB Atlas for your MamaCare project

echo "🏥 MamaCare MongoDB Atlas Setup"
echo "================================"
echo ""

echo "📋 Prerequisites Checklist:"
echo "✓ MongoDB Atlas account created"
echo "✓ Database cluster created (free M0 tier is fine)"
echo "✓ Database user created with read/write permissions"
echo "✓ Network access configured (0.0.0.0/0 for development)"
echo "✓ Connection string obtained from Atlas dashboard"
echo ""

echo "🔗 Steps to get your connection string:"
echo "1. Login to MongoDB Atlas (https://cloud.mongodb.com)"
echo "2. Go to your cluster and click 'Connect'"
echo "3. Choose 'Connect your application'"
echo "4. Select 'Node.js' driver"
echo "5. Copy the connection string"
echo ""

read -p "📝 Enter your MongoDB Atlas connection string: " ATLAS_URI

if [ -z "$ATLAS_URI" ]; then
    echo "❌ Error: Connection string cannot be empty"
    exit 1
fi

# Backup current .env file
if [ -f ".env" ]; then
    cp .env .env.backup
    echo "✅ Backed up current .env to .env.backup"
fi

# Update .env file with Atlas URI
echo "🔄 Updating .env file with MongoDB Atlas configuration..."

# Create new .env with Atlas configuration
cat > .env << EOF
# Environment Variables
NODE_ENV=development
PORT=5000

# MongoDB Atlas Configuration (Cloud)
MONGODB_URI=$ATLAS_URI

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
EOF

echo "✅ Environment configuration updated!"
echo ""

echo "🧪 Testing MongoDB Atlas connection..."
echo "Starting the server to test connection..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Test the connection
echo "🔌 Testing connection to MongoDB Atlas..."
node -e "
const mongoose = require('mongoose');
const uri = '$ATLAS_URI';

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
"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 MongoDB Atlas setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Start the backend server: npm run dev"
    echo "2. Create a super admin: npm run create-superadmin"
    echo "3. Test API endpoints"
    echo ""
    echo "🔍 Monitor your database at: https://cloud.mongodb.com"
else
    echo ""
    echo "❌ Connection test failed. Please check:"
    echo "1. Connection string is correct"
    echo "2. Username and password are correct"
    echo "3. IP address is whitelisted (use 0.0.0.0/0 for testing)"
    echo "4. Network connectivity"
    echo ""
    echo "🔄 Restoring original .env file..."
    if [ -f ".env.backup" ]; then
        cp .env.backup .env
        echo "✅ Original .env restored"
    fi
fi
