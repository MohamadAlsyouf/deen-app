# Quick Start Guide - Deen Learning App

Get your Deen Learning app up and running in minutes!

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
cd mobile
npm install
```

### Step 2: Set Up Firebase

1. Go to https://console.firebase.google.com/
2. Click "Add project" or select existing project
3. Follow the setup wizard
4. Once created, click the **web icon** (</>) to add a web app
5. Copy the Firebase configuration

### Step 3: Configure Environment Variables

1. In the `mobile` directory, create a `.env` file:
```bash
cd mobile
touch .env
```

2. Add your Firebase credentials to `.env`:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-app-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Step 4: Enable Firebase Authentication

1. In Firebase Console, click **Authentication** in the left sidebar
2. Click **Get Started**
3. Click **Email/Password** under Sign-in method
4. Toggle **Enable** and click Save

### Step 5: Create Firestore Database

1. In Firebase Console, click **Firestore Database**
2. Click **Create Database**
3. Choose **Start in test mode** (or production mode if you prefer)
4. Select a location
5. Click **Enable**

### Step 6: Run the App! 🎉

```bash
cd mobile
npm start
```

Then:
- Press `i` for iOS Simulator (Mac only)
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on your phone

## 📱 Testing the App

1. **Landing Screen**: 
   - Try signing up with a test email
   - Sign in with the same credentials

2. **About Screen**: 
   - Read about the platform
   - Try the Sign Out button

3. **Contact Screen**: 
   - Fill out the contact form
   - Submit and check Firebase Console for the submission

## 🔍 Viewing Submissions in Firebase

1. Go to Firebase Console
2. Click **Firestore Database**
3. Look for the `contacts` collection
4. See all submitted messages

## ⚡ Common Commands

```bash
# Start development server
npm start

# Start with cache clear
npm start -- --clear

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

## 🐛 Troubleshooting

**"Unable to resolve module"**
```bash
cd mobile
rm -rf node_modules
npm install
npm start -- --clear
```

**Firebase connection issues**
- Double-check your `.env` file
- Make sure Firebase Authentication is enabled
- Verify Firestore is created

**Expo Go not connecting**
- Make sure your phone and computer are on the same WiFi
- Try scanning the QR code again

## 🎨 Customization

Want to customize the app?

- **Colors**: Edit `mobile/src/theme/colors.ts`
- **Spacing**: Edit `mobile/src/theme/spacing.ts`
- **Typography**: Edit `mobile/src/theme/typography.ts`
- **Content**: Edit screen files in `mobile/src/screens/`

## 📚 Next Steps

- Add more screens and features
- Implement lesson content
- Add user profiles
- Create a learning progress tracker
- Add push notifications

Happy coding! 🚀

