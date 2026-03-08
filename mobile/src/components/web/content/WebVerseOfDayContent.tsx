import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors, borderRadius } from '@/theme';
import { useWebHover } from '@/hooks/useWebHover';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { getLocalDayKey } from '@/services/streakService';
import { verseOfDayService } from '@/services/verseOfDayService';

type WebVerseOfDayContentProps = {
  onBack: () => void;
  onViewInQuran: (params: {
    chapterId: number;
    chapterName: string;
    chapterArabicName: string;
    scrollToVerse: number;
  }) => void;
};

export const WebVerseOfDayContent: React.FC<WebVerseOfDayContentProps> = ({
  onBack,
  onViewInQuran,
}) => {
  const dayKey = getLocalDayKey();
  const { isVerseBookmarked, toggleVerseBookmark } = useBookmarks();
  const verseQuery = useQuery({
    queryKey: ['verseOfDay', dayKey],
    queryFn: () => verseOfDayService.getVerseOfDay(dayKey),
  });

  const backHover = useWebHover({
    hoverStyle: { transform: 'translateX(-2px)', backgroundColor: `${colors.primary}10` },
    transition: 'all 0.2s ease-out',
  });

  const ctaHover = useWebHover({
    hoverStyle: { transform: 'translateY(-2px)', boxShadow: '0 18px 40px rgba(27, 67, 50, 0.22)' },
    transition: 'all 0.25s ease-out',
  });

  const bookmarkHover = useWebHover({
    hoverStyle: { transform: 'translateY(-2px)', boxShadow: '0 18px 40px rgba(212, 163, 115, 0.18)' },
    transition: 'all 0.25s ease-out',
  });

  const isBookmarked = verseQuery.data ? isVerseBookmarked(verseQuery.data.verseKey) : false;

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.85}
        // @ts-ignore
        onMouseEnter={backHover.handlers.onMouseEnter}
        onMouseLeave={backHover.handlers.onMouseLeave}
        style={[styles.backButton, backHover.style]}
      >
        <Ionicons name="arrow-back" size={18} color={colors.primary} />
        <Text style={styles.backButtonText}>Back to Dashboard</Text>
      </TouchableOpacity>

      {verseQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.statusText}>Preparing today's verse...</Text>
        </View>
      ) : verseQuery.isError || !verseQuery.data ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={44} color={colors.error} />
          <Text style={styles.errorTitle}>Unable to load today's verse</Text>
          <Text style={styles.errorText}>Please try again in a moment.</Text>
        </View>
      ) : (
        <>
          <View style={styles.heroLayout}>
            <LinearGradient
              colors={[colors.gradient.start, colors.gradient.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <Text style={styles.heroEyebrow}>Verse of the Day</Text>
              <Text style={styles.heroReference}>{verseQuery.data.verseKey}</Text>
              <Text style={styles.heroChapter}>{verseQuery.data.chapterName}</Text>
              {verseQuery.data.chapterArabicName ? (
                <Text style={styles.heroChapterArabic}>{verseQuery.data.chapterArabicName}</Text>
              ) : null}
            </LinearGradient>

            <View style={styles.previewPanel}>
              <Text style={styles.previewLabel}>Today's selected ayah</Text>
              <Text style={styles.previewArabic} numberOfLines={5}>
                {verseQuery.data.arabicText}
              </Text>
            </View>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailArabic}>{verseQuery.data.arabicText}</Text>

            {verseQuery.data.transliteration ? (
              <>
                <Text style={styles.sectionLabel}>Transliteration</Text>
                <Text style={styles.transliterationText}>{verseQuery.data.transliteration}</Text>
              </>
            ) : null}

            {verseQuery.data.translation ? (
              <>
                <Text style={styles.sectionLabel}>Translation</Text>
                <Text style={styles.translationText}>{verseQuery.data.translation}</Text>
              </>
            ) : null}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() =>
                toggleVerseBookmark({
                  verseKey: verseQuery.data.verseKey,
                  chapterId: verseQuery.data.chapterId,
                  chapterName: verseQuery.data.chapterName,
                  chapterArabicName: verseQuery.data.chapterArabicName,
                  verseNumber: verseQuery.data.verseNumber,
                  arabicText: verseQuery.data.arabicText,
                  translationPreview: verseQuery.data.translation.slice(0, 120),
                })
              }
              activeOpacity={0.9}
              // @ts-ignore
              onMouseEnter={bookmarkHover.handlers.onMouseEnter}
              onMouseLeave={bookmarkHover.handlers.onMouseLeave}
              style={[
                styles.secondaryButton,
                isBookmarked && styles.secondaryButtonActive,
                bookmarkHover.style,
              ]}
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

            <TouchableOpacity
              onPress={() =>
                onViewInQuran({
                  chapterId: verseQuery.data.chapterId,
                  chapterName: verseQuery.data.chapterName,
                  chapterArabicName: verseQuery.data.chapterArabicName,
                  scrollToVerse: verseQuery.data.verseNumber,
                })
              }
              activeOpacity={0.9}
              // @ts-ignore
              onMouseEnter={ctaHover.handlers.onMouseEnter}
              onMouseLeave={ctaHover.handlers.onMouseLeave}
              style={[styles.ctaButton, ctaHover.style]}
            >
              <Ionicons name="book-outline" size={18} color={colors.text.white} />
              <Text style={styles.ctaButtonText}>View in Quran</Text>
            </TouchableOpacity>
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
    paddingBottom: 72,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: borderRadius.round,
    marginBottom: 24,
    // @ts-ignore
    cursor: 'pointer',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  centerState: {
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  statusText: {
    marginTop: 14,
    fontSize: 15,
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 6,
    fontSize: 30,
    fontWeight: '600',
    color: colors.error,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  errorText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  heroLayout: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  heroCard: {
    flex: 1,
    minHeight: 220,
    borderRadius: 28,
    padding: 28,
    justifyContent: 'center',
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.74)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  heroReference: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.86)',
    marginBottom: 6,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  heroChapter: {
    fontSize: 36,
    fontWeight: '600',
    color: colors.text.white,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  heroChapterArabic: {
    fontSize: 34,
    color: colors.accent,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  previewPanel: {
    flex: 1,
    minHeight: 220,
    borderRadius: 28,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 28,
    justifyContent: 'center',
    // @ts-ignore
    boxShadow: '0 14px 32px rgba(0, 0, 0, 0.05)',
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  previewArabic: {
    fontSize: 30,
    lineHeight: 50,
    textAlign: 'right',
    color: colors.text.primary,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
    direction: 'rtl',
  },
  detailCard: {
    backgroundColor: colors.background,
    borderRadius: 28,
    padding: 32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    // @ts-ignore
    boxShadow: '0 18px 42px rgba(0, 0, 0, 0.05)',
  },
  detailArabic: {
    fontSize: 38,
    lineHeight: 68,
    textAlign: 'right',
    color: colors.text.primary,
    marginBottom: 28,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
    direction: 'rtl',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  transliterationText: {
    fontSize: 18,
    lineHeight: 30,
    color: colors.primaryDark,
    fontStyle: 'italic',
    marginBottom: 24,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  translationText: {
    fontSize: 18,
    lineHeight: 32,
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  ctaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minWidth: 220,
    minHeight: 56,
    paddingHorizontal: 24,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary,
    // @ts-ignore
    boxShadow: '0 12px 30px rgba(27, 67, 50, 0.18)',
    // @ts-ignore
    cursor: 'pointer',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'stretch',
  },
  secondaryButton: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: 24,
    borderRadius: borderRadius.round,
    backgroundColor: `${colors.primary}08`,
    borderWidth: 1,
    borderColor: `${colors.primary}24`,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    // @ts-ignore
    cursor: 'pointer',
  },
  secondaryButtonActive: {
    backgroundColor: 'rgba(212, 163, 115, 0.16)',
    borderColor: 'rgba(212, 163, 115, 0.34)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  secondaryButtonTextActive: {
    color: colors.accentDark,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.white,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
});
