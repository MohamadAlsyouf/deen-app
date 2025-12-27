import React from 'react';
import { Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Header, Card, QuranFeatureCard, AboutFeatureCard, ContactFeatureCard } from '@/components';
import { colors, spacing, typography } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import type { TabParamList } from '@/navigation/TabNavigator';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList, 'Home'>>();
  const { signOut } = useAuth();

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

  const handleOpenAbout = () => {
    navigation.navigate('About');
  };

  const handleOpenContact = () => {
    navigation.navigate('Contact');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Home"
        rightAction={{
          label: 'Sign Out',
          onPress: handleSignOut,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.welcomeCard}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>
            Choose a section to explore Quran content and other learning features.
          </Text>
        </Card>

        <QuranFeatureCard onPress={handleOpenQuran} />
        <AboutFeatureCard onPress={handleOpenAbout} />
        <ContactFeatureCard onPress={handleOpenContact} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
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


