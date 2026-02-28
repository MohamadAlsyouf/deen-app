import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from './useAuth';
import { UserProfile } from '@/types/user';

interface UseUserProfileResult {
  userProfile: UserProfile | null;
  loading: boolean;
  error: Error | null;
}

export const useUserProfile = (): UseUserProfileResult => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Set up real-time listener for user profile
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setUserProfile(snapshot.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching user profile:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  return { userProfile, loading, error };
};
