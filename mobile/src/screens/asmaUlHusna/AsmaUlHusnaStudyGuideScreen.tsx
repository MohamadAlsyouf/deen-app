import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components';
import { useAsmaStudyGuide } from '@/contexts/AsmaStudyGuideContext';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { asmaUlHusnaService } from '@/services/asmaUlHusnaService';

export const AsmaUlHusnaStudyGuideScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { studyGuide, loading, hasGameHistory } = useAsmaStudyGuide();

  const dataQuery = useQuery({
    queryKey: ['asmaUlHusna'],
    queryFn: () => asmaUlHusnaService.getData(),
  });

  const strugglingEntries = useMemo(() => {
    const names = dataQuery.data?.names ?? [];
    const nameMap = new Map(names.map((name) => [name.number, name]));

    return studyGuide.strugglingNameNumbers
      .map((nameNumber) => {
        const name = nameMap.get(nameNumber);
        const stat = studyGuide.statsByName[String(nameNumber)];
        if (!name || !stat) {
          return null;
        }
        return { name, stat };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  }, [dataQuery.data?.names, studyGuide.statsByName, studyGuide.strugglingNameNumbers]);

  const handleOpenFlashcards = () => {
    (navigation as any).navigate('AsmaUlHusnaFlashcards', {
      nameNumbers: studyGuide.strugglingNameNumbers,
      title: 'Study Flashcards',
    });
  };

  const handleOpenQuiz = () => {
    (navigation as any).navigate('AsmaUlHusnaMultipleChoice');
  };

  const handleOpenMatching = () => {
    (navigation as any).navigate('AsmaUlHusnaMatching');
  };

  if (loading || dataQuery.isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <Header
            title="Study Guide"
            titleNumberOfLines={1}
            leftAction={{ iconName: 'arrow-back', onPress: () => navigation.goBack() }}
          />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Header
          title="Study Guide"
          titleNumberOfLines={1}
          leftAction={{ iconName: 'arrow-back', onPress: () => navigation.goBack() }}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Ionicons name="school-outline" size={18} color={colors.primary} />
            <Text style={styles.heroBadgeText}>Based on your game results</Text>
          </View>
          <Text style={styles.heroTitle}>Focus your review where it matters most.</Text>
          <Text style={styles.heroSubtitle}>
            We track which names you miss in quiz and matching, then build a smaller set of flashcards so you can strengthen the ones you are still learning.
          </Text>
        </View>

        {!hasGameHistory ? (
          <View style={styles.stateCard}>
            <Ionicons name="analytics-outline" size={42} color={colors.text.tertiary} />
            <Text style={styles.stateTitle}>No study results yet</Text>
            <Text style={styles.stateText}>
              Play quiz or matching first, and this screen will automatically collect the names you need to focus on.
            </Text>
            <View style={styles.actionColumn}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleOpenQuiz} activeOpacity={0.8}>
                <Ionicons name="list-outline" size={18} color={colors.surface} />
                <Text style={styles.primaryButtonText}>Start Quiz</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleOpenMatching} activeOpacity={0.8}>
                <Ionicons name="git-compare-outline" size={18} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>Start Matching</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : strugglingEntries.length === 0 ? (
          <View style={styles.stateCard}>
            <Ionicons name="checkmark-circle-outline" size={42} color={colors.success} />
            <Text style={styles.stateTitle}>You are all caught up</Text>
            <Text style={styles.stateText}>
              You do not have any names in your focus bucket right now. Keep practicing to maintain your recall.
            </Text>
            <View style={styles.actionColumn}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleOpenQuiz} activeOpacity={0.8}>
                <Ionicons name="list-outline" size={18} color={colors.surface} />
                <Text style={styles.primaryButtonText}>Play Quiz Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleOpenMatching} activeOpacity={0.8}>
                <Ionicons name="git-compare-outline" size={18} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>Play Matching Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <View>
                <Text style={styles.summaryEyebrow}>Current focus</Text>
                <Text style={styles.summaryCount}>{strugglingEntries.length} names to review</Text>
              </View>
              <TouchableOpacity style={styles.studyButton} onPress={handleOpenFlashcards} activeOpacity={0.8}>
                <Ionicons name="albums-outline" size={18} color={colors.surface} />
                <Text style={styles.studyButtonText}>Study These Names</Text>
              </TouchableOpacity>
            </View>

            {strugglingEntries.map(({ name, stat }) => (
              <View key={name.number} style={styles.nameCard}>
                <View style={styles.nameCardTop}>
                  <View style={styles.nameNumberBadge}>
                    <Text style={styles.nameNumberText}>#{name.number}</Text>
                  </View>
                  <View style={styles.nameStatsRow}>
                    <View style={styles.statChip}>
                      <Ionicons name="close-outline" size={14} color={colors.error} />
                      <Text style={styles.statChipText}>{stat.wrongCount} misses</Text>
                    </View>
                    <View style={styles.statChip}>
                      <Ionicons name="checkmark-outline" size={14} color={colors.success} />
                      <Text style={styles.statChipText}>{stat.correctCount} correct</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.nameArabic}>{name.name}</Text>
                <Text style={styles.nameTransliteration}>{name.transliteration}</Text>
                <Text style={styles.nameTranslation}>{name.translation}</Text>
                <Text style={styles.nameMeaning}>{name.meaning}</Text>
              </View>
            ))}
          </>
        )}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#E8F5E9',
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  heroBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  heroTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  stateCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },
  stateTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  stateText: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actionColumn: {
    width: '100%',
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    minHeight: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryButtonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colors.background,
    minHeight: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#F0F7F4',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#D6E8DE',
    gap: spacing.md,
  },
  summaryEyebrow: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  summaryCount: {
    ...typography.h3,
    color: colors.primary,
  },
  studyButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  studyButtonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '700',
  },
  nameCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  nameCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  nameNumberBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  nameNumberText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  nameStatsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statChipText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  nameArabic: {
    fontSize: 34,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  nameTransliteration: {
    ...typography.h4,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  nameTranslation: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  nameMeaning: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
