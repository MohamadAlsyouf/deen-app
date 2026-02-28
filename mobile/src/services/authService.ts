import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  UserCredential,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, storage, db } from '@/config/firebase';
import { UserProfile, UserType, FeatureKey } from '@/types/user';

export interface CreateUserDocumentData {
  email: string;
  displayName: string;
  userType: UserType;
  focusFeatures: FeatureKey[];
  notificationsEnabled: boolean;
}

export const authService = {
  signUp: async (email: string, password: string, displayName?: string): Promise<UserCredential> => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && credential.user) {
      await firebaseUpdateProfile(credential.user, { displayName });
    }
    return credential;
  },

  signIn: async (email: string, password: string): Promise<UserCredential> => {
    return await signInWithEmailAndPassword(auth, email, password);
  },

  signOut: async (): Promise<void> => {
    return await firebaseSignOut(auth);
  },

  updateProfile: async (data: { displayName?: string; photoURL?: string }): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    await firebaseUpdateProfile(user, data);
  },

  uploadProfilePhoto: async (uri: string): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `profilePhotos/${user.uid}`);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    await firebaseUpdateProfile(user, { photoURL: downloadURL });
    return downloadURL;
  },

  deleteAccount: async (password: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('No authenticated user');

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    await deleteUser(user);
  },

  createUserDocument: async (uid: string, data: CreateUserDocumentData): Promise<void> => {
    const userRef = doc(db, 'users', uid);
    const userDoc: Omit<UserProfile, 'createdAt'> & { createdAt: any } = {
      uid,
      email: data.email,
      displayName: data.displayName,
      userType: data.userType,
      focusFeatures: data.focusFeatures,
      notificationsEnabled: data.notificationsEnabled,
      onboardingCompleted: true,
      createdAt: serverTimestamp(),
    };
    await setDoc(userRef, userDoc);
  },

  getUserDocument: async (uid: string): Promise<UserProfile | null> => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  },
};
