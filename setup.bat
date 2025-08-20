@echo off
REM MamaCare Platform Setup Script for Windows
REM This script sets up the complete MamaCare platform

echo 🏥 MamaCare Platform Setup
echo ==========================
echo.

REM Check prerequisites
echo 📋 Checking prerequisites...

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v18 or higher.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%

REM Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm version: %NPM_VERSION%

echo.

REM Setup Backend
echo 🔧 Setting up Backend...
cd backend

REM Install backend dependencies
echo 📦 Installing backend dependencies...
call npm install

REM Setup environment variables
if not exist .env (
    echo ⚙️  Creating .env file...
    copy .env.example .env
    echo 📝 Please edit backend\.env file with your MongoDB connection string
)

cd ..

REM Setup Admin Dashboard
echo 🖥️  Setting up Admin Dashboard...
cd admin-dashboard

REM Install dashboard dependencies
echo 📦 Installing admin dashboard dependencies...
call npm install

cd ..

REM Setup Mobile App
echo 📱 Setting up Mobile App...
cd mobile-app

REM Install mobile app dependencies
echo 📦 Installing mobile app dependencies...
call npm install

REM Check if Expo CLI is installed
expo --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Expo CLI not found. Installing globally...
    call npm install -g @expo/cli
)

cd ..

echo.
echo ✅ Setup completed successfully!
echo.
echo 🚀 Quick Start Commands:
echo ========================
echo.
echo 1. Start Backend (Terminal 1):
echo    cd backend
echo    npm run dev
echo.
echo 2. Start Admin Dashboard (Terminal 2):
echo    cd admin-dashboard
echo    npm run dev
echo.
echo 3. Start Mobile App (Terminal 3):
echo    cd mobile-app
echo    npm start
echo.
echo 📚 Important Notes:
echo ===================
echo • Update backend\.env with your MongoDB connection string
echo • Backend runs on http://localhost:5000
echo • Admin Dashboard runs on http://localhost:5173
echo • Mobile app uses Expo - scan QR code with Expo Go app
echo • Default admin credentials will be created on first backend run
echo.
echo 📖 For detailed documentation, see README.md files in each directory
echo.
echo 🎉 Happy coding with MamaCare!
echo.
pause
