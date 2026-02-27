# Setup Checklist

Use this checklist to get your Deen Learning app up and running!

## ☑️ Pre-Setup

- [ ] Node.js installed (v18 or higher)
- [ ] npm or yarn installed
- [ ] Internet connection active
- [ ] Google account for Firebase

## ☑️ Firebase Setup (10 minutes)

- [ ] Go to [Firebase Console](https://console.firebase.google.com/)
- [ ] Create new project (or select existing)
- [ ] Add web app to project
- [ ] Copy Firebase configuration
- [ ] Enable Email/Password Authentication
- [ ] Create Firestore Database (test mode)
- [ ] (Optional) Deploy security rules

## ☑️ Local Setup (5 minutes)

- [ ] Clone/download the repository
- [ ] Navigate to `mobile` directory: `cd mobile`
- [ ] Install dependencies: `npm install`
- [ ] Create `.env` file: `cp .env.example .env`
- [ ] Paste Firebase credentials into `.env`
- [ ] Save the `.env` file

## ☑️ First Run

- [ ] Start development server: `npm start`
- [ ] Wait for QR code to appear
- [ ] Choose run method:
  - [ ] iOS Simulator (Mac): Press `i`
  - [ ] Android Emulator: Press `a`
  - [ ] Physical device: Scan QR with Expo Go app

## ☑️ Test Authentication

- [ ] App loads successfully
- [ ] Landing screen displays
- [ ] Click "Sign Up"
- [ ] Enter test email (e.g., test@example.com)
- [ ] Enter password (min 6 characters)
- [ ] Sign up successful
- [ ] App navigates to tabs

## ☑️ Test About Screen

- [ ] "About" tab is active
- [ ] Content displays correctly
- [ ] Can scroll through content
- [ ] "Sign Out" button visible in header
- [ ] Click "Sign Out"
- [ ] Returns to landing screen

## ☑️ Test Contact Screen

- [ ] Sign back in
- [ ] Navigate to "Contact" tab
- [ ] Fill in name field
- [ ] Email auto-populated (or enter manually)
- [ ] Enter message
- [ ] Click "Send Message"
- [ ] Success message appears

## ☑️ Verify in Firebase

- [ ] Go to Firebase Console
- [ ] Check Authentication → Users
- [ ] Test user appears in list
- [ ] Check Firestore Database
- [ ] "contacts" collection exists
- [ ] Your message appears in collection

## ☑️ Development Environment

- [ ] Hot reload working (save file, app updates)
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] App runs smoothly

## 🎉 Success!

If all items are checked, your app is working perfectly!

## 🐛 Troubleshooting

If something doesn't work, try:

1. **Clear cache and restart:**
   ```bash
   npm start -- --clear
   ```

2. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Check .env file:**
   - Verify all Firebase credentials are correct
   - No extra spaces or quotes
   - File is named `.env` not `.env.txt`

4. **Firebase issues:**
   - Email/Password auth is enabled
   - Firestore database is created
   - Correct project selected in console

5. **Still stuck?**
   - Check QUICKSTART.md
   - Review firebase/SETUP.md
   - Look at console errors

## 📚 What's Next?

Once everything works:

- [ ] Read README.md for full documentation
- [ ] Explore the code structure
- [ ] Customize colors in `src/theme/colors.ts`
- [ ] Modify content in screen files
- [ ] Add your own features
- [ ] Deploy to app stores

---

Happy coding! 🚀

