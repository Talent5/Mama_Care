@echo off
echo ================================
echo  MamaCare Deployment Cleanup
echo ================================
echo.

echo [1/8] Cleaning test files...
del /f /q "test-*.js" 2>nul
del /f /q "admin-dashboard\test-*.js" 2>nul
del /f /q "backend\test-*.js" 2>nul
del /f /q "MamaCare\test-*.js" 2>nul

echo [2/8] Cleaning development documentation...
del /f /q "CORS_COMPLETE_SETUP.md" 2>nul
del /f /q "DASHBOARD_FIX_GUIDE.md" 2>nul
del /f /q "LOCAL_DEVELOPMENT_GUIDE.md" 2>nul
del /f /q "MIGRATION_COMPLETE.md" 2>nul
del /f /q "MONGODB_ATLAS_IP_FIX.md" 2>nul
del /f /q "MONGODB_ATLAS_SETUP.md" 2>nul
del /f /q "GITHUB_SUCCESS.md" 2>nul
del /f /q "DEPLOYMENT_SUCCESS.md" 2>nul
del /f /q "MamaCare\APK_BUILD_TROUBLESHOOTING.md" 2>nul
del /f /q "MamaCare\BUILD_STATUS.md" 2>nul
del /f /q "MamaCare\BUILD_SUMMARY.md" 2>nul
del /f /q "MamaCare\JAVA_VERSION_FIX.md" 2>nul
del /f /q "MamaCare\LOCAL_BUILD_GUIDE.md" 2>nul
del /f /q "MamaCare\PRODUCTION_APK_GUIDE.md" 2>nul
del /f /q "backend\CORS_FIX_INSTRUCTIONS.md" 2>nul

echo [3/8] Cleaning development environment files...
del /f /q "admin-dashboard\.env.development" 2>nul
del /f /q "backend\.env.development" 2>nul

echo [4/8] Cleaning development scripts...
del /f /q "MamaCare\build-apk-local.bat" 2>nul
del /f /q "MamaCare\build-apk-local.ps1" 2>nul
del /f /q "MamaCare\verify-apk.bat" 2>nul
del /f /q "MamaCare\verify-production-build.bat" 2>nul
del /f /q "backend\deploy-cors-fix.bat" 2>nul
del /f /q "backend\deploy-cors-fix.sh" 2>nul
del /f /q "backend\setup-mongodb-atlas.bat" 2>nul
del /f /q "backend\setup-mongodb-atlas.ps1" 2>nul
del /f /q "backend\setup-mongodb-atlas.sh" 2>nul
del /f /q "backend\start-dev.bat" 2>nul
del /f /q "backend\switch-env.bat" 2>nul
del /f /q "backend\test-cors.bat" 2>nul

echo [5/8] Cleaning log files...
if exist "backend\logs" rmdir /s /q "backend\logs"
if exist "admin-dashboard\logs" rmdir /s /q "admin-dashboard\logs"
if exist "MamaCare\logs" rmdir /s /q "MamaCare\logs"
del /f /q "*.log" 2>nul
del /f /q "backend\*.log" 2>nul
del /f /q "admin-dashboard\*.log" 2>nul
del /f /q "MamaCare\*.log" 2>nul

echo [6/8] Cleaning cache and temporary files...
if exist "backend\uploads" rmdir /s /q "backend\uploads"
if exist ".tmp" rmdir /s /q ".tmp"
if exist "admin-dashboard\.cache" rmdir /s /q "admin-dashboard\.cache"
if exist "MamaCare\.expo" rmdir /s /q "MamaCare\.expo"
del /f /q "*.tmp" 2>nul
del /f /q "backend\*.tmp" 2>nul
del /f /q "admin-dashboard\*.tmp" 2>nul
del /f /q "MamaCare\*.tmp" 2>nul

echo [7/8] Cleaning Android build artifacts...
if exist "MamaCare\android\app\build" rmdir /s /q "MamaCare\android\app\build"
if exist "MamaCare\android\build" rmdir /s /q "MamaCare\android\build"
if exist "MamaCare\android\.gradle" rmdir /s /q "MamaCare\android\.gradle"

echo [8/8] Checking git status...
git status

echo.
echo ================================
echo  Cleanup Complete!
echo ================================
echo.
echo Ready for deployment. Next steps:
echo 1. Review remaining files with: git status
echo 2. Stage important changes: git add .
echo 3. Commit changes: git commit -m "Prepare for deployment"
echo 4. Push to repository: git push origin master
echo.
pause
