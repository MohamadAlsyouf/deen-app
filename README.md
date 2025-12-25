# Deen Learning App

A modern React Native mobile application for learning about Deen (Islamic knowledge), built with Expo, TypeScript, TanStack Query, and Firebase.

## Features

- 🔐 **Authentication**: Email/password authentication with Firebase
- 📱 **Modern UI**: Clean, simple, and intuitive user interface
- 📚 **About Section**: Learn about the Deen Learning platform and its mission
- 💬 **Contact Form**: Easy communication with form validation
- 🎨 **Beautiful Design**: Modern gradient backgrounds and smooth animations
- 🔄 **State Management**: TanStack Query for efficient data fetching and caching
- 📂 **Clean Architecture**: Well-organized file structure following best practices

## Tech Stack

- **Frontend**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State Management**: TanStack Query (React Query)
- **Backend**: Firebase (Authentication + Firestore)
- **Storage**: AsyncStorage for auth persistence
- **UI**: Custom components with gradient backgrounds

## Project Structure

```
deen-app/
├── mobile/                           # React Native app
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Header.tsx
│   │   ├── screens/                 # Screen components
│   │   │   ├── LandingScreen.tsx
│   │   │   ├── AboutScreen.tsx
│   │   │   └── ContactScreen.tsx
│   │   ├── navigation/              # Navigation setup
│   │   │   ├── AppNavigator.tsx
│   │   │   └── TabNavigator.tsx
│   │   ├── services/                # API services
│   │   │   ├── authService.ts
│   │   │   └── contactService.ts
│   │   ├── hooks/                   # Custom hooks
│   │   │   ├── useAuth.ts
│   │   │   └── AuthProvider.tsx
│   │   ├── types/                   # TypeScript types
│   │   │   ├── user.ts
│   │   │   └── contact.ts
│   │   ├── config/                  # Configuration
│   │   │   └── firebase.ts
│   │   ├── theme/                   # Theme constants
│   │   │   ├── colors.ts
│   │   │   ├── spacing.ts
│   │   │   ├── typography.ts
│   │   │   └── index.ts
│   │   └── App.tsx                  # Root component
│   ├── assets/                      # Images, fonts
│   ├── app.json                     # Expo config
│   ├── package.json
│   ├── tsconfig.json
│   └── babel.config.js
├── firebase/                        # Firebase config
│   └── firestore.rules             # Firestore security rules
└── README.md
```

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Studio for Android Emulator
- Expo Go app on your physical device (optional)

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password authentication
4. Create a Firestore Database:
   - Go to Firestore Database
   - Create database in test mode (or production mode)
5. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Click on the web icon (</>) to create a web app
   - Copy the Firebase configuration

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd deen-app
```

2. Navigate to the mobile directory:
```bash
cd mobile
```

3. Install dependencies:
```bash
npm install
```

4. Create environment file:
```bash
cp .env.example .env
```

5. Update `.env` with your Firebase credentials:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key-here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

6. (Optional) Deploy Firestore security rules:
```bash
firebase deploy --only firestore:rules
```

## Running the App

### Start the development server:
```bash
npm start
```

### Run on specific platforms:

**iOS Simulator** (Mac only):
```bash
npm run ios
```

**Android Emulator**:
```bash
npm run android
```

**Web Browser**:
```bash
npm run web
```

**Physical Device**:
1. Install the Expo Go app from App Store or Google Play
2. Scan the QR code shown in the terminal
3. The app will open in Expo Go

## Features Walkthrough

### Landing Screen
- Beautiful gradient background
- Email/password authentication
- Toggle between Sign In and Sign Up modes
- Form validation
- Loading states

### About Screen
- Information about the Deen Learning platform
- Mission statement and vision
- Key features and values
- Sign out functionality

### Contact Screen
- Contact form with validation
- Name, email, and message fields
- Form submission to Firebase Firestore
- Success/error feedback
- Uses TanStack Query for state management

## Key Technologies Explained

### React Navigation
Handles navigation between screens with Stack Navigator (for auth flow) and Bottom Tab Navigator (for main app tabs).

### TanStack Query
Manages server state, caching, and mutations. Used for contact form submission with automatic error handling and loading states.

### Firebase Authentication
Provides secure user authentication with email/password. Auth state persists using AsyncStorage.

### Firebase Firestore
NoSQL database for storing contact form submissions with real-time capabilities.

## Development Tips

- **Hot Reload**: Changes to the code will automatically reload the app
- **Debugging**: Shake your device or press `Cmd+D` (iOS) / `Cmd+M` (Android) to open the developer menu
- **Clear Cache**: If you encounter issues, try `expo start -c` to clear the cache

## Building for Production

### iOS:
```bash
expo build:ios
```

### Android:
```bash
expo build:android
```

## Troubleshooting

**Issue**: Firebase not connecting
- Verify your `.env` file has the correct credentials
- Make sure you've enabled Email/Password authentication in Firebase Console

**Issue**: Metro bundler errors
- Clear cache: `expo start -c`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

**Issue**: Android emulator not starting
- Make sure Android Studio is installed
- Check that ANDROID_HOME environment variable is set

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For questions or support, please use the Contact form in the app or open an issue on GitHub.

---

Built with ❤️ for the Muslim community
