@echo off
echo Building MamaCare APK for installation...
echo.
echo This will create an APK file that can be installed directly on Android devices.
echo.
echo Please make sure you have EAS CLI installed. If not, run:
echo npm install -g @expo/eas-cli
echo.
echo Building APK...
eas build --platform android --profile preview
echo.
echo Once the build is complete, you can download the APK from the EAS dashboard
echo or use the provided link to install it directly on Android devices.
pause
