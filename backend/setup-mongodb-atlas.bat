@echo off
echo.
echo 🏥 MamaCare MongoDB Atlas Setup
echo ================================
echo.

echo 📋 Prerequisites Checklist:
echo ✓ MongoDB Atlas account created
echo ✓ Database cluster created (free M0 tier is fine)
echo ✓ Database user created with read/write permissions
echo ✓ Network access configured (0.0.0.0/0 for development)
echo ✓ Connection string obtained from Atlas dashboard
echo.

echo 🔗 Steps to get your connection string:
echo 1. Login to MongoDB Atlas (https://cloud.mongodb.com)
echo 2. Go to your cluster and click 'Connect'
echo 3. Choose 'Connect your application'
echo 4. Select 'Node.js' driver
echo 5. Copy the connection string
echo.

set /p "ATLAS_URI=📝 Enter your MongoDB Atlas connection string: "

if "%ATLAS_URI%"=="" (
    echo ❌ Error: Connection string cannot be empty
    pause
    exit /b 1
)

:: Backup current .env file
if exist ".env" (
    copy ".env" ".env.backup" >nul
    echo ✅ Backed up current .env to .env.backup
)

echo 🔄 Updating .env file with MongoDB Atlas configuration...

:: Create new .env with Atlas configuration
(
echo # Environment Variables
echo NODE_ENV=development
echo PORT=5000
echo.
echo # MongoDB Atlas Configuration (Cloud^)
echo MONGODB_URI=%ATLAS_URI%
echo.
echo # JWT Configuration
echo JWT_SECRET=mamacare_super_secret_jwt_key_2025_zimbabwe_healthcare
echo JWT_EXPIRE=7d
echo.
echo # File Upload Configuration
echo MAX_FILE_SIZE=10485760
echo UPLOAD_PATH=uploads/
echo.
echo # Email Configuration (for notifications^)
echo EMAIL_HOST=smtp.gmail.com
echo EMAIL_PORT=587
echo EMAIL_USER=your_email@gmail.com
echo EMAIL_PASS=your_email_password
echo.
echo # Admin Configuration
echo ADMIN_EMAIL=admin@mamacare.com
echo ADMIN_PASSWORD=ChangeThisPassword123!
echo.
echo # CORS Configuration
echo CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:19006
echo.
echo # Rate Limiting
echo RATE_LIMIT_WINDOW=15
echo RATE_LIMIT_MAX=100
echo.
echo # Logging
echo LOG_LEVEL=info
echo LOG_FILE=logs/app.log
) > .env

echo ✅ Environment configuration updated!
echo.

echo 🧪 Testing MongoDB Atlas connection...

:: Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
)

:: Test the connection
echo 🔌 Testing connection to MongoDB Atlas...
call node test-mongodb.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo 🎉 MongoDB Atlas setup completed successfully!
    echo.
    echo 📋 Next steps:
    echo 1. Start the backend server: npm run dev
    echo 2. Create a super admin: npm run create-superadmin
    echo 3. Test API endpoints
    echo.
    echo 🔍 Monitor your database at: https://cloud.mongodb.com
) else (
    echo.
    echo ❌ Connection test failed. Please check:
    echo 1. Connection string is correct
    echo 2. Username and password are correct
    echo 3. IP address is whitelisted (use 0.0.0.0/0 for testing)
    echo 4. Network connectivity
    echo.
    echo 🔄 Restoring original .env file...
    if exist ".env.backup" (
        copy ".env.backup" ".env" >nul
        echo ✅ Original .env restored
    )
)

echo.
echo 💡 Tip: Your MongoDB connection string should look like:
echo mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mamacare?retryWrites=true^&w=majority
echo.
pause
