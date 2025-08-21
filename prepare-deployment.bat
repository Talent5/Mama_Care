@echo off
echo ================================
echo  MamaCare Deployment Preparation
echo ================================
echo.

echo [1/5] Pulling latest changes...
git pull origin master

echo.
echo [2/5] Running cleanup script...
call cleanup-for-deployment.bat

echo.
echo [3/5] Removing debug console.log statements...
node remove-debug-logs.js

echo.
echo [4/5] Validating production environment files...
if not exist "backend\.env.production" (
    echo ❌ Missing backend/.env.production
    echo Please create production environment file for backend
    pause
    exit /b 1
)

if not exist "MamaCare\.env.production" (
    echo ❌ Missing MamaCare/.env.production  
    echo Please create production environment file for mobile app
    pause
    exit /b 1
)

if not exist "admin-dashboard\.env.production" (
    echo ⚠️  Missing admin-dashboard/.env.production
    echo Creating basic production env file...
    echo VITE_API_BASE_URL=https://your-backend-url.com/api > admin-dashboard\.env.production
)

echo.
echo [5/5] Staging important files for commit...
git add backend/.env.production
git add MamaCare/.env.production  
git add MamaCare/app.json
git add MamaCare/eas.json
git add MamaCare/package.json
git add MamaCare/package-lock.json
git add admin-dashboard/.env.production

echo.
echo ================================
echo  Deployment Preparation Complete!
echo ================================
echo.
echo Next steps:
echo 1. Review staged changes: git status
echo 2. Commit changes: git commit -m "Prepare for production deployment"
echo 3. Push to repository: git push origin master
echo 4. Deploy backend to your hosting service
echo 5. Build and deploy admin dashboard
echo 6. Build mobile app with: cd MamaCare && eas build --profile production
echo.
pause
