@echo off
echo Building MamaCare Production APK...
echo.
echo This will create an APK that connects to the production backend:
echo https://mama-care-g7y1.onrender.com/api
echo.

cd /d "%~dp0"

echo Checking EAS CLI status...
call npx eas whoami

echo.
echo Starting production APK build...
call npx eas build --platform android --profile production-apk

echo.
echo Build submitted! Check build status with:
echo npx eas build:list
echo.
echo Or visit: https://expo.dev/accounts/boikeys5/projects/MamaCare/builds

pause
