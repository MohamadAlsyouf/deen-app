# Firebase Setup Guide

Complete guide to setting up Firebase for the Deen Learning app.

## Prerequisites

- A Google account
- Access to Firebase Console

## Step-by-Step Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `deen-learning-app` (or your preferred name)
4. Click **Continue**
5. Disable Google Analytics (optional, can enable later)
6. Click **Create project**
7. Wait for project to be created
8. Click **Continue**

### 2. Register Web App

1. On the project overview page, click the **Web icon** `</>`
2. Enter app nickname: `Deen Learning Mobile`
3. **Don't** check "Also set up Firebase Hosting"
4. Click **Register app**
5. You'll see your Firebase configuration - **COPY IT!**

Example configuration:
```javascript
{
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "deen-learning-app.firebaseapp.com",
  projectId: "deen-learning-app",
  storageBucket: "deen-learning-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
}
```

### 3. Enable Authentication

1. In the left sidebar, click **Authentication**
2. Click **Get Started**
3. Under **Sign-in method** tab, click **Email/Password**
4. Toggle **Enable** to ON
5. Click **Save**

### 4. Create Firestore Database

1. In the left sidebar, click **Firestore Database**
2. Click **Create database**
3. Select **Start in test mode** (for development)
   - Test mode allows read/write access for 30 days
   - We'll deploy security rules later
4. Choose a Cloud Firestore location:
   - Select the one closest to your users
   - Example: `us-central` or `europe-west`
5. Click **Enable**
6. Wait for database to be created

### 5. Deploy Security Rules

Install Firebase CLI:
```bash
npm install -g firebase-tools
```

Login to Firebase:
```bash
firebase login
```

Initialize Firebase in your project:
```bash
cd deen-app
firebase init
```

Select:
- **Firestore**: Configure security rules and indexes files
- Use an existing project
- Select your project
- Accept default file names
- Don't overwrite if files exist

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

### 6. Update Mobile App Configuration

1. Navigate to `mobile` directory
2. Create `.env` file:
```bash
cd mobile
touch .env
```

3. Add your Firebase config to `.env`:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## Verification

### Test Authentication
1. Run your app: `npm start`
2. Try creating an account
3. Go to Firebase Console → Authentication → Users
4. You should see the new user listed

### Test Firestore
1. Fill out the contact form in your app
2. Submit the form
3. Go to Firebase Console → Firestore Database
4. You should see a `contacts` collection with your submission

## Security Rules Explained

The default rules in `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to create contact submissions
    match /contacts/{contactId} {
      allow create: if request.auth != null;
      allow read: if false;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

This means:
- Only authenticated users can submit contact forms
- Users cannot read contact submissions (only admins via Console)
- All other operations are denied by default

## Optional: Enable Additional Features

### Enable Google Sign-In
1. Authentication → Sign-in method
2. Click **Google**
3. Toggle Enable
4. Add support email
5. Save

### Enable Email Verification
In your auth settings, you can require email verification for new accounts.

### Enable Cloud Functions
If you want to add backend logic (e.g., sending emails when contact form is submitted):

```bash
firebase init functions
```

## Monitoring & Analytics

### Enable Analytics (Optional)
1. Project Settings → Integrations
2. Click **Google Analytics**
3. Follow setup wizard

### View Usage
- Authentication → Users: See all registered users
- Firestore Database → Usage: Monitor read/write operations
- Project Settings → Usage and billing: Overall project usage

## Production Checklist

Before deploying to production:

- [ ] Update Firestore rules to production mode
- [ ] Enable email verification
- [ ] Set up password reset emails
- [ ] Configure custom email templates
- [ ] Set up backup and recovery
- [ ] Monitor authentication usage
- [ ] Set up alerts for unusual activity
- [ ] Review security rules
- [ ] Enable billing alerts

## Troubleshooting

**"Permission denied" errors**
- Check your Firestore security rules
- Ensure user is authenticated
- Verify the collection path is correct

**Authentication not working**
- Verify API key in `.env`
- Check if Email/Password is enabled in Firebase Console
- Clear app cache and restart

**Firestore not updating**
- Check browser console for errors
- Verify internet connection
- Check Firebase Console → Firestore → Usage for errors

## Support

For more information:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

---

Need help? Check the main README.md or open an issue on GitHub.

