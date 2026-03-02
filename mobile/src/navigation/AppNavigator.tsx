import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import {
  LandingScreen,
  QuranChaptersScreen,
  QuranChapterScreen,
  AsmaUlHusnaMenuScreen,
  AsmaUlHusnaScreen,
  AsmaUlHusnaGamesScreen,
  AsmaUlHusnaFlashcardsScreen,
  AsmaUlHusnaMultipleChoiceScreen,
  AsmaUlHusnaMatchingScreen,
  PillarsScreen,
  PrayerGuideScreen,
  DuaScreen,
  SunnahScreen,
  ProfileScreen,
  BookmarksScreen,
  OnboardingSplashScreen,
  OnboardingUserTypeScreen,
  OnboardingFeaturesScreen,
  OnboardingSignUpScreen,
  WelcomeScreen,
  SignInScreen,
} from '@/screens';
import { TabNavigator } from './TabNavigator';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/theme';
import { UserType, FeatureKey } from '@/types/user';
import { hasPendingWelcome } from '@/utils/pendingWelcome';

export type RootStackParamList = {
  // Unauthenticated - Web
  Landing: undefined;
  // Unauthenticated - Native onboarding
  OnboardingSplash: undefined;
  OnboardingUserType: undefined;
  OnboardingFeatures: {
    userType: UserType;
  };
  OnboardingSignUp: {
    userType: UserType;
    focusFeatures: FeatureKey[];
  };
  SignIn: undefined;
  Welcome: {
    displayName: string;
    isNewUser: boolean;
  } | undefined;
  // Authenticated
  Main: undefined;
  QuranChapters: undefined;
  QuranChapter: {
    chapterId: number;
    chapterName: string;
    chapterArabicName?: string;
    scrollToVerse?: number;
  };
  AsmaUlHusnaMenu: undefined;
  AsmaUlHusnaList: undefined;
  AsmaUlHusnaGames: undefined;
  AsmaUlHusnaFlashcards: undefined;
  AsmaUlHusnaMultipleChoice: undefined;
  AsmaUlHusnaMatching: undefined;
  Pillars: undefined;
  PrayerGuide: undefined;
  Dua: undefined;
  Sunnah: undefined;
  Profile: undefined;
  Bookmarks: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const isNative = Platform.OS !== 'web';

const WelcomeScreenDef = (
  <Stack.Screen
    name="Welcome"
    component={WelcomeScreen}
    options={{
      ...TransitionPresets.FadeFromBottomAndroid,
      gestureEnabled: false,
    }}
  />
);

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();
  const welcomeFirstRef = useRef<boolean | null>(null);

  if (user && welcomeFirstRef.current === null) {
    welcomeFirstRef.current = hasPendingWelcome();
  }
  if (!user) {
    welcomeFirstRef.current = null;
  }
  const showWelcomeFirst = welcomeFirstRef.current === true;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { flex: 1 },
          ...TransitionPresets.SlideFromRightIOS,
        }}
      >
        {user ? (
          // Authenticated screens
          <>
            {showWelcomeFirst && WelcomeScreenDef}
            <Stack.Screen name="Main" component={TabNavigator} />
            {!showWelcomeFirst && WelcomeScreenDef}
            <Stack.Screen name="QuranChapters" component={QuranChaptersScreen} />
            <Stack.Screen name="QuranChapter" component={QuranChapterScreen} />
            <Stack.Screen name="AsmaUlHusnaMenu" component={AsmaUlHusnaMenuScreen} />
            <Stack.Screen name="AsmaUlHusnaList" component={AsmaUlHusnaScreen} />
            <Stack.Screen name="AsmaUlHusnaGames" component={AsmaUlHusnaGamesScreen} />
            <Stack.Screen name="AsmaUlHusnaFlashcards" component={AsmaUlHusnaFlashcardsScreen} />
            <Stack.Screen name="AsmaUlHusnaMultipleChoice" component={AsmaUlHusnaMultipleChoiceScreen} />
            <Stack.Screen name="AsmaUlHusnaMatching" component={AsmaUlHusnaMatchingScreen} />
            <Stack.Screen name="Pillars" component={PillarsScreen} />
            <Stack.Screen name="PrayerGuide" component={PrayerGuideScreen} />
            <Stack.Screen name="Dua" component={DuaScreen} />
            <Stack.Screen name="Sunnah" component={SunnahScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
          </>
        ) : (
          // Unauthenticated screens - Platform specific
          <>
            {isNative ? (
              // Native: Show onboarding flow
              <>
                <Stack.Screen
                  name="OnboardingSplash"
                  component={OnboardingSplashScreen}
                  options={{
                    ...TransitionPresets.FadeFromBottomAndroid,
                  }}
                />
                <Stack.Screen
                  name="OnboardingUserType"
                  component={OnboardingUserTypeScreen}
                  options={{
                    ...TransitionPresets.SlideFromRightIOS,
                  }}
                />
                <Stack.Screen
                  name="OnboardingFeatures"
                  component={OnboardingFeaturesScreen}
                  options={{
                    ...TransitionPresets.SlideFromRightIOS,
                  }}
                />
                <Stack.Screen
                  name="OnboardingSignUp"
                  component={OnboardingSignUpScreen}
                  options={{
                    ...TransitionPresets.SlideFromRightIOS,
                  }}
                />
                <Stack.Screen
                  name="SignIn"
                  component={SignInScreen}
                  options={{
                    ...TransitionPresets.SlideFromRightIOS,
                  }}
                />
                {WelcomeScreenDef}
              </>
            ) : (
              // Web: Show original landing screen
              <Stack.Screen name="Landing" component={LandingScreen} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
