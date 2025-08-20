@echo off
echo Building MamaCare for Production...
echo.
echo Choose your build type:
echo 1. Android APK (for direct installation)
echo 2. Android AAB (for Google Play Store)
echo 3. iOS (for App Store or TestFlight)
echo 4. Both Android and iOS
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo Building Android APK...
    eas build --platform android --profile production-apk
) else if "%choice%"=="2" (
    echo Building Android AAB...
    eas build --platform android --profile production
) else if "%choice%"=="3" (
    echo Building iOS...
    eas build --platform ios --profile production
) else if "%choice%"=="4" (
    echo Building for both platforms...
    eas build --platform all --profile production
) else (
    echo Invalid choice. Please run the script again.
    pause
    exit /b 1
)

echo.
echo Build started! You can check the progress at:
echo https://expo.dev/accounts/boikeys5/projects/MamaCare/builds
echo.
echo Once complete, download links will be available in the EAS dashboard.
pause
