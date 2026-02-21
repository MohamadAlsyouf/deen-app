import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
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
} from '@/screens';
import { TabNavigator } from './TabNavigator';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/theme';

export type RootStackParamList = {
  Landing: undefined;
  Main: undefined;
  QuranChapters: undefined;
  QuranChapter: {
    chapterId: number;
    chapterName: string;
    chapterArabicName?: string;
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
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

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
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
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
          </>
        ) : (
          <Stack.Screen name="Landing" component={LandingScreen} />
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

