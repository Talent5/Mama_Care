#!/bin/bash

# MamaCare Platform Setup Script
# This script sets up the complete MamaCare platform

echo "🏥 MamaCare Platform Setup"
echo "=========================="
echo

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
echo "✅ Node.js version: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm version: $NPM_VERSION"

# Check MongoDB (optional - can use cloud)
if command -v mongod &> /dev/null; then
    echo "✅ MongoDB is installed locally"
else
    echo "⚠️  MongoDB not found locally. You can use MongoDB Atlas (cloud)"
fi

echo

# Setup Backend
echo "🔧 Setting up Backend..."
cd backend

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Setup environment variables
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "📝 Please edit backend/.env file with your MongoDB connection string"
fi

cd ..

# Setup Admin Dashboard
echo "🖥️  Setting up Admin Dashboard..."
cd admin-dashboard

# Install dashboard dependencies
echo "📦 Installing admin dashboard dependencies..."
npm install

cd ..

# Setup Mobile App
echo "📱 Setting up Mobile App..."
cd mobile-app

# Install mobile app dependencies
echo "📦 Installing mobile app dependencies..."
npm install

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "⚠️  Expo CLI not found. Installing globally..."
    npm install -g @expo/cli
fi

cd ..

echo
echo "✅ Setup completed successfully!"
echo
echo "🚀 Quick Start Commands:"
echo "========================"
echo
echo "1. Start Backend (Terminal 1):"
echo "   cd backend"
echo "   npm run dev"
echo
echo "2. Start Admin Dashboard (Terminal 2):"
echo "   cd admin-dashboard" 
echo "   npm run dev"
echo
echo "3. Start Mobile App (Terminal 3):"
echo "   cd mobile-app"
echo "   npm start"
echo
echo "📚 Important Notes:"
echo "==================="
echo "• Update backend/.env with your MongoDB connection string"
echo "• Backend runs on http://localhost:5000"
echo "• Admin Dashboard runs on http://localhost:5173"
echo "• Mobile app uses Expo - scan QR code with Expo Go app"
echo "• Default admin credentials will be created on first backend run"
echo
echo "📖 For detailed documentation, see README.md files in each directory"
echo
echo "🎉 Happy coding with MamaCare!"
