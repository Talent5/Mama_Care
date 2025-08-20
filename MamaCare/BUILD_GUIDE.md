# MamaCare App - Build Guide

This guide will help you create installable files for your MamaCare app.

## Prerequisites

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

## Build Options

### Option 1: Quick APK Build (Recommended for Testing)

**Using the batch file:**
```bash
build-apk.bat
```

**Using npm:**
```bash
npm run build:apk
```

This creates an APK file that can be directly installed on any Android device.

### Option 2: Production Builds

**Using the interactive batch file:**
```bash
build-installer.bat
```

**Using npm scripts:**

- **Android APK (Direct Installation):**
  ```bash
  npm run build:apk-production
  ```

- **Android AAB (Google Play Store):**
  ```bash
  npm run build:aab
  ```

- **iOS (App Store/TestFlight):**
  ```bash
  npm run build:ios
  ```

- **Both Platforms:**
  ```bash
  npm run build:all
  ```

## After Building

1. **Check Build Status:**
   ```bash
   npm run build:status
   ```

2. **Download Your App:**
   - Visit: https://expo.dev/accounts/boikeys5/projects/MamaCare/builds
   - Download the generated APK/IPA file
   - Share the download link with testers

## Installation Instructions

### Android APK
1. Download the APK file
2. Enable "Install from Unknown Sources" in Android settings
3. Tap the APK file to install

### iOS IPA
1. Use TestFlight for distribution, or
2. Install via Xcode for development devices

## File Types Explained

- **APK**: Android package file - can be installed directly on Android devices
- **AAB**: Android App Bundle - for Google Play Store submission
- **IPA**: iOS package file - for App Store or TestFlight distribution

## Troubleshooting

If you encounter issues:

1. **Clear EAS cache:**
   ```bash
   eas build --clear-cache
   ```

2. **Check build logs** in the EAS dashboard for detailed error information

3. **Verify your app.json configuration** is correct

## Notes

- APK builds are great for testing and sharing with beta users
- AAB builds are required for Google Play Store
- iOS builds require an Apple Developer account for distribution
- All builds are stored in the EAS dashboard for 30 days
