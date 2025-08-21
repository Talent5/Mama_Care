@echo off
echo 🚀 Setting up MamaCare for Local Development...
echo.

REM Check if we're in the backend directory
if not exist "server.js" (
    echo ❌ Please run this script from the backend directory
    exit /b 1
)

echo 📋 Step 1: Setting up development environment...
if exist .env.development (
    copy .env.development .env
    echo ✅ Development environment activated
) else (
    echo ❌ .env.development file not found
    exit /b 1
)
echo.

echo 📋 Step 2: Checking Node.js and npm...
node --version
npm --version
echo.

echo 📋 Step 3: Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)
echo.

echo 📋 Step 4: Starting backend server...
echo ✅ Backend will start on http://localhost:5000
echo ✅ CORS enabled for:
echo    - http://localhost:5173 (Vite dev server)
echo    - http://localhost:3000 (React dev server)  
echo    - http://localhost:8081 (Expo dev server)
echo    - Local network IPs for mobile development
echo.

echo 🧪 To test CORS setup, run: node test-local-cors.js
echo.

echo Starting server in 3 seconds...
timeout /t 3 /nobreak > nul

npm run dev
