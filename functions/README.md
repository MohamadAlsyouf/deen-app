# Firebase Cloud Functions

This directory contains Firebase Cloud Functions that act as secure proxies for external APIs.

## Functions

### `getAsmaUlHusna`

Proxies requests to the Islamic API for the 99 Names of Allah. The API key is stored securely on the server and never exposed to clients.

## Setup & Deployment

### Prerequisites

1. Install Firebase CLI globally:

```bash
npm install -g firebase-tools
```

2. Login to Firebase:

```bash
firebase login
```

### Set the API Key (One-time setup)

**Important**: You need to set the Islamic API key as a secret in Firebase:

```bash
firebase functions:secrets:set ISLAMIC_API_KEY
```

When prompted, enter your API key...

### Deploy Functions

From the project root directory:

```bash
firebase deploy --only functions
```

Or from the functions directory:

```bash
npm run deploy
```

### Verify Deployment

After deployment, your function will be available at:

```
https://us-central1-deen-app-753e6.cloudfunctions.net/getAsmaUlHusna
```

Test it by visiting:

```
https://us-central1-deen-app-753e6.cloudfunctions.net/getAsmaUlHusna?language=en
```

## Local Development

To test functions locally:

```bash
npm run serve
```

This starts the Firebase emulator. Note: You'll need to set the `ISLAMIC_API_KEY` environment variable locally for testing.

## Logs

View function logs:

```bash
npm run logs
```

Or in Firebase Console: https://console.firebase.google.com/project/deen-app-753e6/functions/logs
