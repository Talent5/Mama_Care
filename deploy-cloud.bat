@echo off
echo ===========================================
echo    MamaCare Cloud Deployment Script
echo ===========================================
echo.

echo 🌍 Deploying MamaCare with MongoDB Atlas...
echo.

echo 📋 Step 1: Building admin dashboard...
cd admin-dashboard
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to build admin dashboard
    pause
    exit /b 1
)
cd ..

echo 📋 Step 2: Starting services with MongoDB Atlas...
docker-compose -f docker-compose.cloud.yml up -d --build

if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to start services
    pause
    exit /b 1
)

echo.
echo ✅ Deployment completed successfully!
echo.
echo 🚀 Services are running:
echo    - Backend API: http://localhost:5000
echo    - Admin Dashboard: http://localhost:80
echo    - Database: MongoDB Atlas (Cloud)
echo.
echo 📊 Check service status:
docker-compose -f docker-compose.cloud.yml ps
echo.
echo 📝 View logs:
echo    docker-compose -f docker-compose.cloud.yml logs -f
echo.
pause
