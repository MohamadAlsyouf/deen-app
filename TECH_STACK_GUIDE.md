# Tech Stack Guide - Deen Learning App

## 📚 Overview

This guide provides a comprehensive explanation of all technologies, frameworks, and tools used in the Deen Learning mobile application, and how they work together to create a modern, scalable React Native app.

---

## 🎯 Core Technologies

### 1. **React Native** (v0.81.5)

**What it is:**
React Native is a JavaScript framework for building native mobile applications for iOS and Android using React. It allows you to write code once and deploy to multiple platforms.

**Key Features Used:**
- **Cross-platform development**: Single codebase for iOS and Android
- **Native components**: Uses native UI components (View, Text, ScrollView, etc.)
- **Hot Reloading**: Instant code updates during development
- **Performance**: Near-native performance through JavaScript bridge
- **Flexbox Layout**: CSS-like styling system for responsive layouts

**How it works in this app:**
```typescript
// Example: Using React Native components
<View style={styles.container}>
  <Text>Welcome to Deen Learning</Text>
  <ScrollView>
    {/* Scrollable content */}
  </ScrollView>
</View>
```

**Important React Native Concepts:**
- **Components**: Reusable UI building blocks (Button, Input, Card, Header)
- **Props**: Data passed from parent to child components
- **State**: Component-level data that can change
- **StyleSheet**: Optimized styling system (better than inline styles)
- **Platform-specific code**: Can use `Platform.OS === 'ios'` for platform differences

---

### 2. **Expo** (~54.0.27)

**What it is:**
Expo is a framework and platform built around React Native that simplifies development, testing, and deployment.

**Key Features Used:**
- **Managed workflow**: No need to configure native code manually
- **Expo CLI**: Easy development server (`expo start`)
- **Expo SDK**: Pre-built native modules (LinearGradient, StatusBar, etc.)
- **Over-the-air updates**: Can push updates without app store approval
- **Development builds**: Test on real devices via QR code

**Expo Modules in this app:**
- `expo-linear-gradient`: Beautiful gradient backgrounds
- `expo-status-bar`: Status bar styling
- `@expo/vector-icons`: Icon library (Ionicons)

**Configuration (`app.json`):**
```json
{
  "expo": {
    "name": "Deen Learning",
    "slug": "deen-learning",
    "version": "1.0.0",
    "orientation": "portrait",
    "newArchEnabled": true  // New React Native architecture
  }
}
```

**Benefits:**
- Faster development setup
- No Xcode/Android Studio required for basic development
- Easy device testing via Expo Go app
- Built-in asset management

---

### 3. **TypeScript** (~5.9.2)

**What it is:**
TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds static type checking to catch errors before runtime.

**Key Features Used:**
- **Type safety**: Prevents bugs by catching type errors during development
- **IntelliSense**: Better autocomplete and IDE support
- **Interfaces**: Define contracts for objects and functions
- **Strict mode**: Enabled for maximum type safety

**Example from the app:**
```typescript
// Type definitions
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Typed function
const signIn = async (email: string, password: string): Promise<void> => {
  await authService.signIn(email, password);
};
```

**Benefits:**
- Catches errors before runtime
- Better code documentation
- Improved refactoring safety
- Enhanced developer experience

**Configuration (`tsconfig.json`):**
- Path aliases (`@/*` → `src/*`)
- Strict mode enabled
- Expo base configuration

---

## 🧭 Navigation System

### 4. **React Navigation** (v7.x)

**What it is:**
The most popular navigation library for React Native apps. Provides routing and navigation between screens.

**Packages Used:**
- `@react-navigation/native`: Core navigation library
- `@react-navigation/stack`: Stack navigator (push/pop screens)
- `@react-navigation/bottom-tabs`: Bottom tab navigator
- `react-native-screens`: Native screen components for better performance
- `react-native-safe-area-context`: Handles safe areas (notches, status bars)

**Navigation Structure:**

```
AppNavigator (Stack Navigator)
├── Landing Screen (Unauthenticated)
└── Main (Authenticated)
    ├── TabNavigator (Bottom Tabs)
    │   ├── Home Tab
    │   ├── About Tab
    │   └── Contact Tab
    ├── QuranChapters Screen
    └── QuranChapter Screen
```

**How it works:**
```typescript
// Stack Navigator - for hierarchical navigation
<Stack.Navigator>
  {user ? (
    <Stack.Screen name="Main" component={TabNavigator} />
  ) : (
    <Stack.Screen name="Landing" component={LandingScreen} />
  )}
</Stack.Navigator>

// Tab Navigator - for bottom tabs
<Tab.Navigator>
  <Tab.Screen name="Home" component={HomeScreen} />
  <Tab.Screen name="About" component={AboutScreen} />
  <Tab.Screen name="Contact" component={ContactScreen} />
</Tab.Navigator>
```

**Key Features:**
- **Type-safe navigation**: TypeScript support for route params
- **Deep linking**: Navigate to specific screens via URLs
- **Navigation state**: Tracks navigation history
- **Screen options**: Customize headers, animations, etc.
- **Safe areas**: Automatically handles device notches and status bars

---

## 🔥 Backend & Database

### 5. **Firebase** (v12.6.0)

**What it is:**
Google's Backend-as-a-Service (BaaS) platform providing authentication, database, storage, and more without managing servers.

#### 5.1 **Firebase Authentication**

**What it does:**
Handles user authentication (sign up, sign in, sign out) securely.

**Features Used:**
- **Email/Password authentication**: Traditional email-based auth
- **Auth state persistence**: Users stay logged in across app restarts
- **Auth state listener**: Real-time updates when auth state changes
- **Secure token management**: Firebase handles JWT tokens automatically

**How it works:**
```typescript
// Initialize Firebase Auth
import { getAuth } from 'firebase/auth';
const auth = getAuth(app);

// Sign up
await createUserWithEmailAndPassword(auth, email, password);

// Sign in
await signInWithEmailAndPassword(auth, email, password);

// Listen to auth state changes
onAuthStateChanged(auth, (user) => {
  // User logged in or out
});
```

**Integration in app:**
- `authService.ts`: Wraps Firebase auth methods
- `AuthProvider.tsx`: Manages auth state globally
- `useAuth` hook: Provides auth state to components

#### 5.2 **Cloud Firestore**

**What it is:**
NoSQL document database that stores data in collections and documents.

**Features Used:**
- **Collections**: Group related documents (e.g., `contacts`)
- **Documents**: Individual records with fields
- **Real-time updates**: Can listen to data changes
- **Security rules**: Control who can read/write data
- **Offline support**: Works offline and syncs when online

**Database Structure:**
```
contacts/
  └── {documentId}/
      ├── name: string
      ├── email: string
      ├── message: string
      ├── timestamp: Date
      └── userId: string
```

**How it works:**
```typescript
// Initialize Firestore
import { getFirestore } from 'firebase/firestore';
const db = getFirestore(app);

// Add document
import { collection, addDoc } from 'firebase/firestore';
await addDoc(collection(db, 'contacts'), {
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Hello!',
  timestamp: new Date(),
});
```

**Security Rules (`firestore.rules`):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /contacts/{contactId} {
      allow create: if request.auth != null;
      allow read, update, delete: if false; // Admin only
    }
  }
}
```

**Benefits:**
- No server management required
- Automatic scaling
- Real-time synchronization
- Offline-first architecture
- Built-in security

---

## 📊 State Management

### 6. **TanStack Query (React Query)** (v5.90.12)

**What it is:**
Powerful data synchronization library for React/React Native that manages server state, caching, and data fetching.

**Key Features:**
- **Automatic caching**: Stores fetched data in memory
- **Background refetching**: Keeps data fresh automatically
- **Loading/error states**: Built-in state management
- **Mutations**: Handle create/update/delete operations
- **Optimistic updates**: Update UI before server confirms

**How it works:**
```typescript
// Setup QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Use in components
const { data, isLoading, error } = useQuery({
  queryKey: ['quranChapters'],
  queryFn: quranService.getChapters,
});

// Mutations (for POST/PUT/DELETE)
const mutation = useMutation({
  mutationFn: contactService.submitContactForm,
  onSuccess: () => {
    // Handle success
  },
});
```

**Used in app:**
- Contact form submission (mutation)
- Quran chapters fetching (query)
- Automatic error handling and retries
- Loading state management

**Benefits:**
- Reduces boilerplate code
- Automatic caching and refetching
- Better error handling
- Optimistic updates support
- DevTools for debugging

---

### 7. **React Context API**

**What it is:**
Built-in React feature for sharing state across components without prop drilling.

**How it's used:**
- **AuthProvider**: Provides authentication state globally
- **AuthContext**: Context object for auth state
- **useAuth hook**: Custom hook to access auth context

**Implementation:**
```typescript
// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  // Listen to Firebase auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? transformUser(firebaseUser) : null);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

**Benefits:**
- Global state without prop drilling
- Simple API for shared state
- No external dependencies needed
- Type-safe with TypeScript

---

## 🎨 UI & Styling

### 8. **Design System (Custom Theme)**

**What it is:**
Centralized design tokens for consistent styling across the app.

**Components:**
- **Colors** (`theme/colors.ts`): Color palette (primary, secondary, gradients)
- **Typography** (`theme/typography.ts`): Font sizes and weights
- **Spacing** (`theme/spacing.ts`): Consistent spacing scale
- **Border Radius**: Rounded corners
- **Shadows**: Elevation effects

**Example:**
```typescript
// Colors
export const colors = {
  primary: '#2E7D32',      // Green
  secondary: '#00897B',    // Teal
  background: '#FFFFFF',
  error: '#D32F2F',
  // ...
};

// Typography
export const typography = {
  h1: { fontSize: 32, fontWeight: 'bold' },
  h2: { fontSize: 28, fontWeight: 'bold' },
  body: { fontSize: 16, fontWeight: 'normal' },
  // ...
};

// Usage
<Text style={typography.h1}>Title</Text>
<View style={{ padding: spacing.lg }}>
```

**Benefits:**
- Consistent design language
- Easy theme updates
- Type-safe styling
- Reusable across components

---

### 9. **Expo Linear Gradient**

**What it is:**
Expo module for creating beautiful gradient backgrounds.

**Usage:**
```typescript
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={[colors.gradient.start, colors.gradient.end]}
  style={styles.gradient}
>
  {/* Content */}
</LinearGradient>
```

**Used in:**
- Landing screen background
- Creates visual appeal

---

## 🛠️ Development Tools

### 10. **Babel Module Resolver**

**What it is:**
Babel plugin that enables path aliases for cleaner imports.

**Configuration (`babel.config.js`):**
```javascript
plugins: [
  [
    'module-resolver',
    {
      root: ['./src'],
      alias: {
        '@': './src',
      },
    },
  ],
],
```

**Benefits:**
```typescript
// Instead of this:
import { Button } from '../../../components/Button';

// You can write this:
import { Button } from '@/components';
```

---

### 11. **AsyncStorage**

**What it is:**
React Native's key-value storage system for persisting data locally.

**Used for:**
- Firebase auth persistence (handled automatically)
- Could be used for app preferences, cache, etc.

**How it works:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store data
await AsyncStorage.setItem('key', 'value');

// Retrieve data
const value = await AsyncStorage.getItem('key');
```

---

## 🔄 How Everything Works Together

### Application Flow

```
1. App Starts (App.tsx)
   │
   ├─→ SafeAreaProvider (handles device safe areas)
   │
   ├─→ QueryClientProvider (TanStack Query setup)
   │   └─→ Manages server state, caching, mutations
   │
   ├─→ AuthProvider (Context API)
   │   └─→ Listens to Firebase auth state
   │       └─→ Provides user, signIn, signUp, signOut
   │
   └─→ AppNavigator (React Navigation)
       │
       ├─→ Checks auth state from AuthProvider
       │
       ├─→ If NOT authenticated:
       │   └─→ Shows LandingScreen
       │       └─→ User can sign in/up
       │           └─→ Firebase Auth handles authentication
       │               └─→ AuthProvider updates state
       │                   └─→ AppNavigator re-renders
       │
       └─→ If authenticated:
           └─→ Shows TabNavigator
               ├─→ Home Tab (HomeScreen)
               ├─→ About Tab (AboutScreen)
               └─→ Contact Tab (ContactScreen)
                   └─→ Uses TanStack Query mutation
                       └─→ Submits to Firestore
```

### Data Flow Example: Contact Form

```
1. User fills contact form (ContactScreen)
   │
2. User clicks "Send Message"
   │
3. TanStack Query mutation triggers
   │
4. contactService.submitContactForm() called
   │
5. Firebase Firestore addDoc() executed
   │
6. Data saved to 'contacts' collection
   │
7. Mutation onSuccess callback fires
   │
8. Success alert shown to user
   │
9. Form cleared
```

### Authentication Flow

```
1. User opens app
   │
2. AuthProvider initializes
   │
3. onAuthStateChanged listener starts
   │
4. Checks Firebase auth state
   │
   ├─→ User logged in?
   │   └─→ Set user state
   │       └─→ AppNavigator shows authenticated screens
   │
   └─→ User not logged in?
       └─→ Set user to null
           └─→ AppNavigator shows LandingScreen
```

---

## 📦 Key Dependencies Summary

| Package | Purpose | Version |
|---------|---------|---------|
| `react` & `react-native` | Core framework | 19.1.0 / 0.81.5 |
| `expo` | Development platform | ~54.0.27 |
| `typescript` | Type safety | ~5.9.2 |
| `@react-navigation/*` | Navigation | v7.x |
| `firebase` | Backend services | ^12.6.0 |
| `@tanstack/react-query` | State management | ^5.90.12 |
| `expo-linear-gradient` | UI gradients | ^15.0.8 |
| `@react-native-async-storage/async-storage` | Local storage | ^2.2.0 |

---

## 🎯 React Native Best Practices Used

1. **Component Composition**: Reusable components (Button, Input, Card)
2. **Type Safety**: TypeScript throughout
3. **Separation of Concerns**: Services, hooks, components separated
4. **Performance**: StyleSheet for optimized styling
5. **Error Handling**: Try-catch blocks and error states
6. **Loading States**: Activity indicators during async operations
7. **Form Validation**: Client-side validation before submission
8. **Safe Areas**: Proper handling of device notches/status bars
9. **Accessibility**: Proper touch targets and hit slop
10. **Code Organization**: Clear folder structure and path aliases

---

## 🚀 Development Workflow

1. **Start Development Server**: `npm start` or `expo start`
2. **Hot Reloading**: Code changes reflect immediately
3. **Type Checking**: TypeScript catches errors in real-time
4. **Navigation**: React Navigation handles routing
5. **State Updates**: Context API and TanStack Query manage state
6. **Backend**: Firebase handles auth and database operations
7. **Testing**: Test on iOS simulator, Android emulator, or real devices

---

## 📱 Platform-Specific Features

### iOS
- Safe area handling for notches
- Native navigation gestures
- Status bar styling

### Android
- Edge-to-edge display support
- Adaptive icons
- Back button handling

### Web (via Expo Web)
- Responsive layouts
- Web-optimized components

---

## 🔐 Security Features

1. **Firebase Security Rules**: Control database access
2. **Authentication**: Secure email/password auth
3. **Type Safety**: TypeScript prevents type-related bugs
4. **Input Validation**: Client-side form validation
5. **Error Handling**: Prevents crashes from unexpected errors

---

## 📈 Scalability Considerations

1. **Modular Architecture**: Easy to add new features
2. **Reusable Components**: DRY principle
3. **Type Safety**: Easier refactoring and maintenance
4. **State Management**: TanStack Query handles complex data flows
5. **Firebase Scaling**: Automatic backend scaling
6. **Code Organization**: Clear structure for team collaboration

---

## 🎓 Learning Resources

- **React Native**: https://reactnative.dev/docs/getting-started
- **Expo**: https://docs.expo.dev/
- **React Navigation**: https://reactnavigation.org/docs/getting-started
- **Firebase**: https://firebase.google.com/docs
- **TanStack Query**: https://tanstack.com/query/latest
- **TypeScript**: https://www.typescriptlang.org/docs/

---

## ✅ Summary

This app uses a modern, production-ready tech stack:

- **React Native + Expo** for cross-platform mobile development
- **TypeScript** for type safety and better DX
- **React Navigation** for seamless navigation
- **Firebase** for authentication and database (no backend needed)
- **TanStack Query** for efficient state management
- **Context API** for global auth state
- **Custom theme system** for consistent design

All technologies work together seamlessly to create a scalable, maintainable mobile application with excellent developer and user experience.

