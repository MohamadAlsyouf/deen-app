import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

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

// Initialize Auth with persistence
// On web, use default persistence; on native, use AsyncStorage
import { getAuth } from "firebase/auth";

const auth = Platform.OS === "web"
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { app, auth, db, storage };
