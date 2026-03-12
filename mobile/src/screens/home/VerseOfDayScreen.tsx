import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { colors, spacing, typography, borderRadius } from '@/theme';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { getLocalDayKey } from '@/services/streakService';
import { verseOfDayService } from '@/services/verseOfDayService';

type NavigationProp = StackNavigationProp<RootStackParamList, 'VerseOfDay'>;

export const VerseOfDayScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dayKey = getLocalDayKey();
  const { isVerseBookmarked, toggleVerseBookmark } = useBookmarks();
  const insets = useSafeAreaInsets();

  const verseQuery = useQuery({
    queryKey: ['verseOfDay', dayKey],
    queryFn: () => verseOfDayService.getVerseOfDay(dayKey),
  });

  const verse = verseQuery.data;
  const isBookmarked = verse ? isVerseBookmarked(verse.verseKey) : false;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Header
          title="Verse of the Day"
          leftAction={{ iconName: 'arrow-back', onPress: () => navigation.goBack() }}
        />

        {verseQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.statusText}>Preparing today's verse...</Text>
          </View>
        ) : verseQuery.isError || !verse ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={42} color={colors.error} />
            <Text style={styles.errorTitle}>Unable to load today's verse</Text>
            <Text style={styles.errorText}>Please try again in a moment.</Text>
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <LinearGradient
                colors={[colors.gradient.start, colors.gradient.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>Today&apos;s Reflection</Text>
                </View>
                <Text style={styles.heroReference}>{verse.verseKey}</Text>
                <Text style={styles.heroChapter}>{verse.chapterName}</Text>
                {verse.chapterArabicName ? (
                  <Text style={styles.heroChapterArabic}>{verse.chapterArabicName}</Text>
                ) : null}
              </LinearGradient>

              <View style={styles.verseCard}>
                <Text style={styles.arabicText}>{verse.arabicText}</Text>

                {verse.transliteration ? (
                  <>
                    <Text style={styles.sectionLabel}>Transliteration</Text>
                    <Text style={styles.transliterationText}>{verse.transliteration}</Text>
                  </>
                ) : null}

                {verse.translation ? (
                  <>
                    <Text style={styles.sectionLabel}>Translation</Text>
                    <Text style={styles.translationText}>{verse.translation}</Text>
                  </>
                ) : null}
              </View>
            </ScrollView>

            <View style={[styles.actionOverlay, { bottom: Math.max(insets.bottom, spacing.sm) + spacing.sm }]}>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('QuranChapter', {
                      chapterId: verse.chapterId,
                      chapterName: verse.chapterName,
                      chapterArabicName: verse.chapterArabicName,
                      scrollToVerse: verse.verseNumber,
                    })
                  }
                  activeOpacity={0.85}
                  style={styles.ctaButton}
                >
                  <Ionicons name="book-outline" size={18} color={colors.text.white} />
                  <Text style={styles.ctaText}>View in Quran</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    toggleVerseBookmark({
                      verseKey: verse.verseKey,
                      chapterId: verse.chapterId,
                      chapterName: verse.chapterName,
                      chapterArabicName: verse.chapterArabicName,
                      verseNumber: verse.verseNumber,
                      arabicText: verse.arabicText,
                      translationPreview: verse.translation.slice(0, 120),
                    })
                  }
                  activeOpacity={0.85}
                  style={[styles.secondaryButton, isBookmarked && styles.secondaryButtonActive]}
                >
                  <Ionicons
                    name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={18}
                    color={isBookmarked ? colors.accentDark : colors.primary}
                  />
                  <Text style={[styles.secondaryButtonText, isBookmarked && styles.secondaryButtonTextActive]}>
                    Bookmark Verse
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2 + spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  statusText: {
    marginTop: spacing.md,
    fontSize: 15,
    color: colors.text.secondary,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  errorText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  heroCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginBottom: spacing.lg,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.white,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroReference: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroChapter: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.white,
    marginBottom: spacing.xs,
  },
  heroChapterArabic: {
    fontSize: 28,
    color: colors.accent,
    textAlign: 'right',
  },
  verseCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  arabicText: {
    fontSize: 32,
    lineHeight: 56,
    color: colors.text.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  transliterationText: {
    ...typography.body,
    color: colors.primaryDark,
    fontStyle: 'italic',
    lineHeight: 26,
    marginBottom: spacing.lg,
  },
  translationText: {
    ...typography.body,
    fontSize: 17,
    lineHeight: 29,
    color: colors.text.secondary,
  },
  actionOverlay: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
  },
  actionRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ctaButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.white,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: `${colors.primary}24`,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  secondaryButtonActive: {
    backgroundColor: 'rgba(255, 248, 238, 0.98)',
    borderColor: 'rgba(212, 163, 115, 0.34)',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  secondaryButtonTextActive: {
    color: colors.accentDark,
  },
});
