@echo off
echo 🚀 Deploying CORS fixes to Render...

REM Check if we're in the backend directory
if not exist "server.js" (
    echo ❌ Please run this script from the backend directory
    exit /b 1
)

echo 📋 Changes being deployed:
echo    ✅ Fixed CORS origin handling for Vercel frontend
echo    ✅ Added specific Vercel domain to allowed origins
echo    ✅ Enhanced CORS headers middleware with proper status codes
echo    ✅ Updated production environment with correct CORS_ORIGINS
echo    ✅ Added CORS test script for Vercel domain

echo.
echo 📦 Committing changes...
git add .
git commit -m "fix: CORS configuration for Vercel frontend compatibility

- Added specific Vercel domain to allowed origins array
- Enhanced CORS origin function with proper domain checking  
- Updated CORS headers middleware with 204 status for preflight
- Fixed production environment CORS_ORIGINS configuration
- Added test script for Vercel CORS validation
- Improved CORS logging for debugging

Fixes CORS errors for: https://mama-care-2m7mq1hws-talent5s-projects.vercel.app"

echo.
echo 🔄 Pushing to repository...
git push origin master

echo.
echo ✅ Changes pushed! Render will automatically deploy the updates.
echo.
echo 📋 Next steps:
echo    1. Wait 2-3 minutes for Render to redeploy
echo    2. Test the frontend: https://mama-care-2m7mq1hws-talent5s-projects.vercel.app
echo    3. Check CORS with: node test-cors-vercel.js
echo    4. Monitor logs in Render dashboard for CORS debugging info
echo.
echo 🔍 Monitor deployment: https://dashboard.render.com/

pause
