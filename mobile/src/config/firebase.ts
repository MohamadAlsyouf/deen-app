import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
// Replace these values with your own Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDpugDumJxCfvaLi2kmJAPchtMZehjcdvs",
  authDomain: "deen-app-753e6.firebaseapp.com",
  projectId: "deen-app-753e6",
  storageBucket: "deen-app-753e6.firebasestorage.app",
  messagingSenderId: "123731011888",
  appId: "1:123731011888:web:6e771ea139e4c65377c0f5",
  measurementId: "G-R3DX2J14ZL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth (persistence is handled automatically in React Native)
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { app, auth, db, storage };
