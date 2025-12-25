# Firebase Configuration

This directory contains Firebase configuration files.

## Firestore Security Rules

The `firestore.rules` file contains security rules for Firestore database.

### Current Rules

- **Contacts Collection**: 
  - Authenticated users can create new contact submissions
  - Reading is disabled for regular users (only admins can view via Firebase Console)
  - All other operations are denied

### Deploying Rules

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in your project:
```bash
firebase init
```

4. Deploy the rules:
```bash
firebase deploy --only firestore:rules
```

## Firestore Data Structure

### Contacts Collection

Each document in the `contacts` collection has the following structure:

```typescript
{
  name: string;
  email: string;
  message: string;
  timestamp: Date;
  userId?: string;  // Firebase Auth user ID (optional)
}
```

## Viewing Contact Submissions

To view contact form submissions:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Firestore Database
4. Navigate to the `contacts` collection
5. View all submitted messages

## Additional Collections

You can add more collections as your app grows:

- `lessons` - Islamic lessons and content
- `users` - User profiles and preferences
- `progress` - User learning progress
- etc.

Remember to update the security rules when adding new collections!

