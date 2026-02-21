import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type MenuOption = {
  title: string;
  subtitle: string;
  icon: IoniconName;
  route: string;
  accentColor: string;
  accentBg: string;
};

const MENU_OPTIONS: MenuOption[] = [
  {
    title: 'Browse & Listen',
    subtitle: 'View all 99 names with meanings, transliterations, and audio pronunciations',
    icon: 'headset-outline',
    route: 'AsmaUlHusnaList',
    accentColor: colors.primary,
    accentBg: '#E8F5E9',
  },
  {
    title: 'Memorization Games',
    subtitle: 'Test your knowledge with flashcards, matching, multiple choice, and more',
    icon: 'game-controller-outline',
    route: 'AsmaUlHusnaGames',
    accentColor: colors.accent,
    accentBg: '#FFF8E1',
  },
];

export const AsmaUlHusnaMenuScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleOptionPress = (route: string) => {
    (navigation as any).navigate(route);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Header
          title="99 Names of Allah"
          titleNumberOfLines={1}
          leftAction={{ iconName: 'arrow-back', onPress: handleGoBack }}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.introSection}>
          <Text style={styles.arabicTitle}>أسماء الله الحسنى</Text>
          <Text style={styles.introText}>
            Explore the beautiful names of Allah — listen to their pronunciation or challenge yourself with interactive games.
          </Text>
        </View>

        {MENU_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.route}
            style={styles.optionCard}
            onPress={() => handleOptionPress(option.route)}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIconContainer, { backgroundColor: option.accentBg }]}>
              <Ionicons name={option.icon} size={28} color={option.accentColor} />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        ))}
      </View>
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
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
  },
  arabicTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  introText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  optionTextContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  optionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: 4,
  },
  optionSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
