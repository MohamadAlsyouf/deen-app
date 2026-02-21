import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Header, Card, QuranFeatureCard, PillarsFeatureCard, AsmaUlHusnaFeatureCard, PrayerGuideFeatureCard, DuaFeatureCard, AboutFeatureCard, ContactFeatureCard } from '@/components';
import { colors, spacing, typography } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import type { TabParamList } from '@/navigation/TabNavigator';
import { WebHomeScreen } from './WebHomeScreen';

export const HomeScreen: React.FC = () => {
  // Use the dedicated web dashboard on web
  if (Platform.OS === 'web') {
    return <WebHomeScreen />;
  }

  // Mobile version
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList, 'Home'>>();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to sign out');
    }
  };

  const handleOpenQuran = () => {
    const parentNavigation = navigation.getParent();
    if (!parentNavigation) {
      return;
    }
    parentNavigation.navigate('QuranChapters' as never);
  };

  const handleOpenAsmaUlHusna = () => {
    const parentNavigation = navigation.getParent();
    if (!parentNavigation) {
      return;
    }
    parentNavigation.navigate('AsmaUlHusnaMenu' as never);
  };

  const handleOpenPillars = () => {
    const parentNavigation = navigation.getParent();
    if (!parentNavigation) {
      return;
    }
    parentNavigation.navigate('Pillars' as never);
  };

  const handleOpenPrayerGuide = () => {
    const parentNavigation = navigation.getParent();
    if (!parentNavigation) {
      return;
    }
    parentNavigation.navigate('PrayerGuide' as never);
  };

  const handleOpenDua = () => {
    const parentNavigation = navigation.getParent();
    if (!parentNavigation) {
      return;
    }
    parentNavigation.navigate('Dua' as never);
  };

  const handleOpenAbout = () => {
    navigation.navigate('About');
  };

  const handleOpenContact = () => {
    navigation.navigate('Contact');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Header
          title="Home"
          rightAction={{
            label: 'Sign Out',
            onPress: handleSignOut,
          }}
        />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <Card style={styles.welcomeCard}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>
            Choose a section to explore Quran content and other learning features.
          </Text>
        </Card>

        <QuranFeatureCard onPress={handleOpenQuran} />
        <PrayerGuideFeatureCard onPress={handleOpenPrayerGuide} />
        <PillarsFeatureCard onPress={handleOpenPillars} />
        <AsmaUlHusnaFeatureCard onPress={handleOpenAsmaUlHusna} />
        <DuaFeatureCard onPress={handleOpenDua} />
        <AboutFeatureCard onPress={handleOpenAbout} />
        <ContactFeatureCard onPress={handleOpenContact} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    backgroundColor: colors.background,
    paddingTop: 0,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  welcomeCard: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
});


