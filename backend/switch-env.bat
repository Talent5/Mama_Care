@echo off
echo === MamaCare Backend Environment Manager ===
echo.

if "%1"=="dev" goto :dev
if "%1"=="prod" goto :prod
if "%1"=="production" goto :prod

:menu
echo Choose environment:
echo 1. Development (local development with mobile app support)
echo 2. Production (deploy to Render)
echo.
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" goto :dev
if "%choice%"=="2" goto :prod
echo Invalid choice. Please enter 1 or 2.
goto :menu

:dev
echo.
echo Switching to DEVELOPMENT environment...
if exist .env.development (
    copy .env.development .env >nul
    echo ✅ Copied .env.development to .env
    echo 📱 Development mode active:
    echo    - Mobile app development supported
    echo    - Local network access enabled
    echo    - Dashboard development servers allowed
    echo    - Less restrictive rate limiting
    echo.
    echo 🚀 Start development server with:
    echo    npm run dev
    echo    OR
    echo    nodemon server.js
) else (
    echo ❌ .env.development not found!
)
goto :end

:prod
echo.
echo Using PRODUCTION environment...
echo ✅ Production .env is ready
echo 🌐 Production mode:
echo    - Vercel frontend supported
echo    - Mobile app production builds supported
echo    - Strict CORS and rate limiting
echo.
echo 🚀 Deploy to production:
echo    git add .
echo    git commit -m "Deploy CORS fixes"
echo    git push origin main
goto :end

:end
echo.
pause
