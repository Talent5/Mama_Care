@echo off
echo Building MamaCare for Production...
echo.

:: Set production environment
set NODE_ENV=production

echo [1/4] Building Admin Dashboard...
cd admin-dashboard
call npm ci --production=false
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Error: Admin Dashboard build failed
    exit /b 1
)
cd ..

echo [2/4] Installing Backend Dependencies...
cd backend
call npm ci --production
if %ERRORLEVEL% neq 0 (
    echo Error: Backend dependencies installation failed
    exit /b 1
)
cd ..

echo [3/4] Building Mobile App for Production...
cd MamaCare
call npm ci --production=false
echo Mobile app prepared for production build. Run 'eas build --profile production' to build for stores.
cd ..

echo [4/4] Creating Production Package...
if not exist "production-build" mkdir production-build
robocopy admin-dashboard\dist production-build\admin-dashboard /E /XD node_modules
robocopy backend production-build\backend /E /XD node_modules uploads logs
robocopy MamaCare production-build\mobile-app /E /XD node_modules .expo

echo.
echo Production build completed successfully!
echo.
echo Next steps:
echo 1. Configure environment variables in production-build\backend\.env
echo 2. Deploy backend to your server
echo 3. Deploy admin-dashboard to your web hosting
echo 4. Build mobile app with: cd MamaCare ^&^& eas build --profile production
echo.
