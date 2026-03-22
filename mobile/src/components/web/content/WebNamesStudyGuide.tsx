import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors, borderRadius } from '@/theme';
import { useAsmaStudyGuide } from '@/contexts/AsmaStudyGuideContext';
import { useWebHover } from '@/hooks/useWebHover';
import { asmaUlHusnaService } from '@/services/asmaUlHusnaService';

type WebNamesStudyGuideProps = {
  onBack: () => void;
  onNavigate: (screen: string, data?: any) => void;
};

const ActionButton: React.FC<{
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  primary?: boolean;
}> = ({ label, icon, onPress, primary = false }) => {
  const hover = useWebHover({
    hoverStyle: primary
      ? { transform: 'translateY(-2px)', boxShadow: '0 10px 28px rgba(27,67,50,0.22)' }
      : { transform: 'translateY(-2px)', boxShadow: '0 10px 24px rgba(0,0,0,0.08)' },
    transition: 'all 0.2s ease-out',
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[
        styles.actionButton,
        primary ? styles.actionButtonPrimary : styles.actionButtonSecondary,
        hover.style,
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={primary ? colors.surface : colors.primary}
      />
      <Text style={[styles.actionButtonText, primary && styles.actionButtonTextPrimary]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export const WebNamesStudyGuide: React.FC<WebNamesStudyGuideProps> = ({ onBack, onNavigate }) => {
  const { studyGuide, loading, hasGameHistory } = useAsmaStudyGuide();

  const dataQuery = useQuery({
    queryKey: ['asmaUlHusna'],
    queryFn: () => asmaUlHusnaService.getData(),
  });

  const backHover = useWebHover({
    hoverStyle: { backgroundColor: `${colors.primary}15` },
    transition: 'all 0.2s ease-out',
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

  const handleOpenQuiz = () => onNavigate('multiple-choice');
  const handleOpenMatching = () => onNavigate('matching');
  const handleOpenFlashcards = () => {
    onNavigate('flashcards', {
      nameNumbers: studyGuide.strugglingNameNumbers,
      title: 'Study Flashcards',
      backTo: 'study-guide',
    });
  };

  if (loading || dataQuery.isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading study guide...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          // @ts-ignore
          onMouseEnter={backHover.handlers.onMouseEnter}
          onMouseLeave={backHover.handlers.onMouseLeave}
          style={[styles.backButton, backHover.style]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Ionicons name="school-outline" size={18} color={colors.primary} />
          <Text style={styles.heroBadgeText}>Based on your game results</Text>
        </View>
        <Text style={styles.heroTitle}>Study Guide</Text>
        <Text style={styles.heroSubtitle}>
          This view keeps track of the names you miss in quiz and matching, then gives you a focused review deck built only from those names.
        </Text>
      </View>

      {!hasGameHistory ? (
        <View style={styles.stateCard}>
          <Ionicons name="analytics-outline" size={46} color={colors.text.tertiary} />
          <Text style={styles.stateTitle}>No study results yet</Text>
          <Text style={styles.stateText}>
            Play quiz or matching first, and this page will automatically show the names that need more attention.
          </Text>
          <View style={styles.actionsRow}>
            <ActionButton label="Start Quiz" icon="list-outline" onPress={handleOpenQuiz} primary />
            <ActionButton label="Start Matching" icon="git-compare-outline" onPress={handleOpenMatching} />
          </View>
        </View>
      ) : strugglingEntries.length === 0 ? (
        <View style={styles.stateCard}>
          <Ionicons name="checkmark-circle-outline" size={46} color={colors.success} />
          <Text style={styles.stateTitle}>You are all caught up</Text>
          <Text style={styles.stateText}>
            There are no names in your focus bucket right now. Keep practicing to stay sharp.
          </Text>
          <View style={styles.actionsRow}>
            <ActionButton label="Play Quiz Again" icon="list-outline" onPress={handleOpenQuiz} primary />
            <ActionButton label="Play Matching Again" icon="git-compare-outline" onPress={handleOpenMatching} />
          </View>
        </View>
      ) : (
        <>
          <View style={styles.summaryCard}>
            <View>
              <Text style={styles.summaryEyebrow}>Current focus</Text>
              <Text style={styles.summaryCount}>{strugglingEntries.length} names to review</Text>
            </View>
            <ActionButton label="Study These Names" icon="albums-outline" onPress={handleOpenFlashcards} primary />
          </View>

          <View style={styles.cardGrid}>
            {strugglingEntries.map(({ name, stat }) => (
              <View key={name.number} style={styles.nameCard}>
                <View style={styles.nameCardTop}>
                  <View style={styles.numberBadge}>
                    <Text style={styles.numberBadgeText}>#{name.number}</Text>
                  </View>
                  <View style={styles.chipsRow}>
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
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 40,
    paddingBottom: 80,
    // @ts-ignore
    maxWidth: 1100,
    marginHorizontal: 'auto',
    width: '100%',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  topBar: {
    marginBottom: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 32,
    marginBottom: 24,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 18,
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 17,
    lineHeight: 28,
    color: colors.text.secondary,
    maxWidth: 760,
  },
  stateCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 36,
    alignItems: 'center',
  },
  stateTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  stateText: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 620,
    marginBottom: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  actionButton: {
    minHeight: 52,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonSecondary: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  actionButtonTextPrimary: {
    color: colors.surface,
  },
  summaryCard: {
    backgroundColor: '#F0F7F4',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#D6E8DE',
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  summaryEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  summaryCount: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  cardGrid: {
    // @ts-ignore
    display: 'grid',
    // @ts-ignore
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 16,
  },
  nameCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
  },
  nameCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  numberBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  numberBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statChipText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  nameArabic: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  nameTransliteration: {
    fontSize: 21,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  nameTranslation: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  nameMeaning: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
