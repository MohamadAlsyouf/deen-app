import React, { useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { authService } from '@/services/authService';
import { User, AuthContextType } from '@/types/user';
import { AuthContext } from '@/hooks/useAuth';

interface AuthProviderProps {
  children: ReactNode;
}

const mapFirebaseUser = (firebaseUser: FirebaseUser): User => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  displayName: firebaseUser.displayName,
  photoURL: firebaseUser.photoURL,
  createdAt: firebaseUser.metadata.creationTime || null,
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      setUser(firebaseUser ? mapFirebaseUser(firebaseUser) : null);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    await authService.signIn(email, password);
  };

  const signUp = async (email: string, password: string, displayName?: string): Promise<void> => {
    await authService.signUp(email, password, displayName);
    const firebaseUser = auth.currentUser;
    if (firebaseUser) setUser(mapFirebaseUser(firebaseUser));
  };

  const signOut = async (): Promise<void> => {
    await authService.signOut();
  };

  const updateProfile = async (data: { displayName?: string; photoURL?: string }): Promise<void> => {
    await authService.updateProfile(data);
    const firebaseUser = auth.currentUser;
    if (firebaseUser) setUser(mapFirebaseUser(firebaseUser));
  };

  const deleteAccount = async (password: string): Promise<void> => {
    await authService.deleteAccount(password);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

