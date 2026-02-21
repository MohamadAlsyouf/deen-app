# Deen App

A beautiful, cross-platform mobile and web application for exploring and learning about Islamic knowledge -- built with React Native, Expo, and Firebase.

---

## Overview

Deen App provides Muslims with easy access to essential Islamic resources in a clean, modern interface. Whether on mobile or web, users can read the Quran, learn duas, explore the 99 Names of Allah, understand the Pillars of Islam, and more.

## Features

- **Quran Reader** -- Browse chapters, read verses with Arabic text, and listen to audio recitations
- **Dua Collection** -- Curated supplications for daily life
- **99 Names of Allah** -- Explore Asma Ul Husna with meanings and details
- **Pillars of Islam** -- Learn about the five foundational pillars
- **Prayer Guide** -- Step-by-step guidance for performing salah
- **Authentication** -- Secure sign-in/sign-up with Firebase
- **Contact Form** -- Reach out directly through the app
- **Cross-Platform** -- Runs on iOS, Android, and Web

## Tech Stack

| Layer            | Technology                             |
| ---------------- | -------------------------------------- |
| Framework        | React Native + Expo (SDK 54)           |
| Language         | TypeScript                             |
| Navigation       | React Navigation (Stack + Bottom Tabs) |
| State Management | TanStack Query v5                      |
| Backend          | Firebase (Auth, Firestore, Functions)  |
| Styling          | Custom theme system with gradients     |
| Web Support      | react-native-web                       |

## Project Structure

```
deen-app/
├── mobile/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── web/            # Web-specific layout & content
│   │   │   ├── quran/          # Quran reader components
│   │   │   ├── pillars/        # Pillars of Islam components
│   │   │   ├── featureCards/   # Home screen feature cards
│   │   │   └── asmaUlHusna/   # 99 Names components
│   │   ├── screens/            # App screens
│   │   ├── navigation/         # Stack & tab navigators
│   │   ├── services/           # Firebase API services
│   │   ├── hooks/              # Custom hooks & auth provider
│   │   ├── contexts/           # React contexts (audio player)
│   │   ├── types/              # TypeScript type definitions
│   │   ├── config/             # Firebase configuration
│   │   ├── theme/              # Colors, spacing, typography
│   │   └── App.tsx             # Root component
│   └── package.json
├── functions/                  # Firebase Cloud Functions
├── firebase/                   # Firestore security rules
└── README.md
```

## Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn
- Expo CLI
- Firebase project with Auth & Firestore enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/deen-app.git
cd deen-app/mobile

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

Add your Firebase credentials to `.env`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### Running the App

```bash
# Start dev server
npm start

# Platform-specific
npm run ios       # iOS Simulator
npm run android   # Android Emulator
npm run web       # Web Browser
```

### Deploying Cloud Functions

```bash
cd functions
npm install
npm run deploy
```

## Scripts

| Command             | Description                         |
| ------------------- | ----------------------------------- |
| `npm start`         | Start Expo dev server (cache clear) |
| `npm run ios`       | Run on iOS simulator                |
| `npm run android`   | Run on Android emulator             |
| `npm run web`       | Run in web browser                  |
| `npm run build:web` | Build for web deployment            |
| `npm run typecheck` | Run TypeScript type checking        |

## License

This project is licensed under the MIT License.

---

Built with ❤️ for the Muslim community.
