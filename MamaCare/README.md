# 📱 MamaCare Zimbabwe

A multilingual maternal health app designed for Zimbabwe, supporting English, Shona, and Ndebele languages.

## 🎯 Features

### ✅ Completed Features

- **Language Selection**: Choose from English 🇬🇧, Shona 🇿🇼, or Ndebele 🇿🇼
- **Welcome Screen**: Introduction to the app with registration and login options
- **User Registration**: Full name, phone number, and password registration
- **User Login**: Phone number and password authentication
- **Dashboard**: User profile and quick actions
- **Secure Storage**: User credentials stored locally with AsyncStorage
- **Multilingual Support**: Full i18n support with react-i18next

### 🎨 Design System

- **Background**: `#e9f8e7` (Light green)
- **Headers/Text**: `#023337` (Dark teal)
- **Buttons**: `#4ea674` (Green)
- **Accent tags**: `#c0e6b9` (Light green)

## 🛠️ Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for screen transitions
- **AsyncStorage** for local data storage
- **react-i18next** for internationalization
- **NativeWind** ready for Tailwind CSS styling

## 📁 Project Structure

```
├── app/                        # Expo Router structure
│   ├── _layout.tsx            # Root layout with navigation
│   └── index.tsx              # Main app logic and screen routing
├── i18n/                       # Internationalization
│   ├── index.ts               # i18n configuration
│   └── locales/
│       ├── en.json            # English translations
│       ├── sn.json            # Shona translations
│       └── nd.json            # Ndebele translations
├── screens/                    # All screen components
│   ├── LanguageSelectionScreen.tsx
│   ├── WelcomeScreen.tsx
│   ├── RegisterScreen.tsx
│   ├── LoginScreen.tsx
│   └── DashboardScreen.tsx
├── utils/                      # Utility functions
│   └── authStorage.ts         # Authentication and storage utilities
└── types/                      # TypeScript type definitions
    └── navigation.ts          # Navigation type definitions
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI
- Expo Go app on your mobile device (for testing)

### Installation

1. **Clone and navigate to the project**:
   ```bash
   cd "c:\Users\Takunda Mundwa\Desktop\Mobile-app\MamaCare"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Run on device**:
   - Scan the QR code with Expo Go app (Android)
   - Scan the QR code with Camera app (iOS)

### Alternative Run Commands

```bash
npm run android    # Run on Android emulator
npm run ios        # Run on iOS simulator
npm run web        # Run in web browser
```

## 📱 App Flow

### First Time Users
1. **Language Selection** → Choose preferred language
2. **Welcome Screen** → Introduction to MamaCare
3. **Registration** → Create account with full name, phone, and password
4. **Dashboard** → Access to maternal health features

### Returning Users
1. **Welcome Screen** → Login option
2. **Login** → Enter phone number and password
3. **Dashboard** → Continue using the app

## 🔧 Development Features

### Authentication System
- Secure local storage of user credentials
- Simple password hashing for demo purposes
- Session management with login/logout
- User registration validation

### Internationalization
- Full support for 3 languages
- Language preference persistence
- Automatic language detection
- Easy to add more languages

### Data Management
- Local storage with AsyncStorage
- User profile management
- Clear data functionality for development

## 🧪 Testing Features

### Development Tools
- **Clear All Data**: Reset app to initial state
- **User Profile Display**: View stored user information
- **Language Switching**: Test different language translations

### Test User Creation
1. Go to Registration screen
2. Fill in test data:
   - Name: "Test User"
   - Phone: "+263771234567"
   - Password: "test123"
3. Register and test login

## 🔄 App State Management

The app manages different states:
- **Loading**: Initial app startup
- **Onboarding**: First-time language selection
- **Auth**: Login/Registration flow
- **Main**: Authenticated user dashboard

## 🎨 UI Components

### Screen Components
- **Language Selection**: Interactive language picker with flags
- **Welcome**: Branded introduction screen
- **Registration**: Form with validation and error handling
- **Login**: Secure authentication form
- **Dashboard**: User profile and quick actions

### Design Patterns
- Consistent color scheme throughout
- Accessible touch targets
- Loading states for async operations
- Form validation with error messages
- Safe area handling for different devices

## 🔐 Security Notes

⚠️ **Development Notice**: Current implementation uses simple hashing for passwords. In production, implement proper password hashing with libraries like bcrypt or scrypt.

## 🚧 Future Enhancements

### Priority Features
- Pregnancy tracking timeline
- Health appointment reminders
- Emergency contact integration
- Healthcare provider directory
- Educational content library

### Technical Improvements
- Proper password hashing
- Biometric authentication
- Offline sync capabilities
- Push notifications
- Data backup and restore

## 📋 Available Scripts

```bash
npm start          # Start Expo development server
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS device/simulator
npm run web        # Run in web browser
npm run lint       # Run ESLint for code quality
```

## 📄 License

This project is part of the MamaCare Zimbabwe maternal health initiative.

---

**Happy Coding! 🚀**

For questions or support, please refer to the project documentation or contact the development team.