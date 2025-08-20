@echo off
echo ===========================================
echo      MamaCare Backend - Pre-Deployment Test
echo ===========================================
echo.

echo 🧪 Testing backend before Render deployment...
echo.

cd /d "C:\Users\Takunda Mundwa\Desktop\MamaCare\backend"

echo 📋 Step 1: Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo 📋 Step 2: Testing MongoDB Atlas connection...
call node test-mongodb.js
if %ERRORLEVEL% neq 0 (
    echo ❌ Database connection failed
    pause
    exit /b 1
)

echo 📋 Step 3: Starting server for testing...
echo 🚀 Starting server on port 5000...
echo 📝 Test the following endpoints:
echo    - Health Check: http://localhost:5000/api/health
echo    - API Status: http://localhost:5000/api/auth/status
echo.
echo 🛑 Press Ctrl+C to stop the server when testing is complete
echo.
call npm start
