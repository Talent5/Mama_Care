@echo off
echo ===========================================
echo    MamaCare Project Cleanup Script
echo ===========================================
echo.

echo 🧹 Cleaning up project for GitHub publication...
echo.

cd /d "C:\Users\Takunda Mundwa\Desktop\MamaCare"

echo 📋 Step 1: Removing node_modules directories...
if exist "backend\node_modules" rmdir /s /q "backend\node_modules"
if exist "admin-dashboard\node_modules" rmdir /s /q "admin-dashboard\node_modules"
if exist "MamaCare\node_modules" rmdir /s /q "MamaCare\node_modules"

echo 📋 Step 2: Removing build directories...
if exist "admin-dashboard\dist" rmdir /s /q "admin-dashboard\dist"
if exist "backend\uploads\*" del /q "backend\uploads\*"

echo 📋 Step 3: Removing log files...
if exist "backend\logs" rmdir /s /q "backend\logs"

echo 📋 Step 4: Removing temporary files...
del /q *.log 2>nul
del /q *\*.log 2>nul

echo 📋 Step 5: Checking .env files...
if exist "backend\.env" (
    echo ⚠️  WARNING: backend\.env file exists - review before publishing
)
if exist "admin-dashboard\.env" (
    echo ⚠️  WARNING: admin-dashboard\.env file exists - review before publishing
)

echo.
echo ✅ Project cleanup completed!
echo.
echo 📝 Next steps:
echo   1. Review .env files for sensitive data
echo   2. Initialize git repository
echo   3. Add and commit files
echo   4. Push to GitHub
echo.
pause
