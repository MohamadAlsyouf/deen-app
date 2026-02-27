import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type GameMode = {
  id: string;
  title: string;
  subtitle: string;
  icon: IoniconName;
  route: string;
  color: string;
  bgColor: string;
};

const GAME_MODES: GameMode[] = [
  {
    id: 'flashcards',
    title: 'Flashcards',
    subtitle: 'Flip through cards to learn and review names one by one',
    icon: 'albums-outline',
    route: 'AsmaUlHusnaFlashcards',
    color: colors.primary,
    bgColor: '#E8F5E9',
  },
  {
    id: 'multiple-choice',
    title: 'Multiple Choice',
    subtitle: 'Pick the correct answer from four options to test recall',
    icon: 'list-outline',
    route: 'AsmaUlHusnaMultipleChoice',
    color: colors.info,
    bgColor: '#E1F5FE',
  },
  {
    id: 'matching',
    title: 'Matching',
    subtitle: 'Match Arabic names to their English meanings against the clock',
    icon: 'git-compare-outline',
    route: 'AsmaUlHusnaMatching',
    color: colors.accent,
    bgColor: '#FFF8E1',
  },
];

export const AsmaUlHusnaGamesScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleGamePress = (route: string) => {
    (navigation as any).navigate(route);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Header
          title="Memorization Games"
          titleNumberOfLines={1}
          leftAction={{ iconName: 'arrow-back', onPress: handleGoBack }}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <View style={styles.introBadge}>
            <Ionicons name="trophy-outline" size={20} color={colors.accent} />
            <Text style={styles.introBadgeText}>Challenge Yourself</Text>
          </View>
          <Text style={styles.introText}>
            Choose a game mode to test and strengthen your knowledge of the 99 Names of Allah.
          </Text>
        </View>

        {GAME_MODES.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={styles.gameCard}
            onPress={() => handleGamePress(mode.route)}
            activeOpacity={0.7}
          >
            <View style={[styles.gameIconContainer, { backgroundColor: mode.bgColor }]}>
              <Ionicons name={mode.icon} size={30} color={mode.color} />
            </View>
            <View style={styles.gameTextContainer}>
              <Text style={styles.gameTitle}>{mode.title}</Text>
              <Text style={styles.gameSubtitle}>{mode.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        ))}

        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={20} color={colors.accent} />
          <Text style={styles.tipText}>
            Tip: Start with flashcards to familiarize yourself, then test your knowledge with multiple choice and matching.
          </Text>
        </View>
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
    paddingBottom: spacing.xxl,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  introBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  introBadgeText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  introText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameIconContainer: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  gameTextContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  gameTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: 4,
  },
  gameSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#F0E6C8',
  },
  tipText: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
});
