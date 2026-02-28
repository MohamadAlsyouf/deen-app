export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string | null;
}

export type UserType = 'muslim' | 'revert' | 'learner';

export type FeatureKey = 'quran' | 'prayer' | 'pillars' | 'names' | 'dua' | 'sunnah';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  userType: UserType;
  focusFeatures: FeatureKey[];
  notificationsEnabled: boolean;
  onboardingCompleted: boolean;
  createdAt: any; // Firestore Timestamp
}

export interface OnboardingData {
  userType: UserType | null;
  focusFeatures: FeatureKey[];
  notificationsEnabled: boolean;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}
