import React, { useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/theme';
import type { QuranChapter } from '@/types/quran';

type QuranChapterCardProps = {
  chapter: QuranChapter;
  onPress: (chapter: QuranChapter) => void;
  progress?: number; // 0-100 percentage
};

// Position thresholds for when each element starts and ends being covered
// start: when progress bar starts touching the element (partial coverage)
// end: when progress bar fully covers the element (full coverage)
const THRESHOLDS = {
  badge: { start: 5, end: 18 },
  info: { start: 18, end: 65 },
  arabic: { start: 65, end: 88 },
  chevron: { start: 88, end: 98 },
};

type CoverageState = 'none' | 'partial' | 'full';

const getCoverageState = (progress: number, start: number, end: number): CoverageState => {
  if (progress < start) return 'none';
  if (progress >= end) return 'full';
  return 'partial';
};

export const QuranChapterCard: React.FC<QuranChapterCardProps> = ({
  chapter,
  onPress,
  progress = 0,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const clampedProgress = Math.min(100, Math.max(0, progress));

  // Determine coverage state for each element
  const badgeCoverage = getCoverageState(clampedProgress, THRESHOLDS.badge.start, THRESHOLDS.badge.end);
  const infoCoverage = getCoverageState(clampedProgress, THRESHOLDS.info.start, THRESHOLDS.info.end);
  const arabicCoverage = getCoverageState(clampedProgress, THRESHOLDS.arabic.start, THRESHOLDS.arabic.end);
  const chevronCoverage = getCoverageState(clampedProgress, THRESHOLDS.chevron.start, THRESHOLDS.chevron.end);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, tension: 100, friction: 8 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }).start();
  };

  const dynamicStyles = useMemo(
    () => ({
      // Badge styles
      badge: {
        backgroundColor:
          badgeCoverage === 'full'
            ? 'rgba(255,255,255,0.2)'
            : `${colors.primary}15`,
      },
      badgeText: {
        color: badgeCoverage === 'full' ? colors.text.white : colors.primary,
      },
      // Info section styles (name)
      nameContainer: {
        backgroundColor: infoCoverage === 'partial' ? colors.background : 'transparent',
        borderRadius: infoCoverage === 'partial' ? 4 : 0,
        paddingHorizontal: infoCoverage === 'partial' ? 4 : 0,
        marginHorizontal: infoCoverage === 'partial' ? -4 : 0,
        alignSelf: 'flex-start' as const,
      },
      name: {
        color: infoCoverage === 'full' ? colors.text.white : colors.text.primary,
      },
      // Meta row container
      metaContainer: {
        backgroundColor: infoCoverage === 'partial' ? colors.background : 'transparent',
        borderRadius: infoCoverage === 'partial' ? 4 : 0,
        paddingHorizontal: infoCoverage === 'partial' ? 4 : 0,
        marginHorizontal: infoCoverage === 'partial' ? -4 : 0,
        alignSelf: 'flex-start' as const,
      },
      meta: {
        color: infoCoverage === 'full' ? 'rgba(255,255,255,0.85)' : colors.text.tertiary,
      },
      dot: {
        backgroundColor: infoCoverage === 'full'
          ? 'rgba(255,255,255,0.5)'
          : colors.text.disabled,
      },
      // Arabic section styles
      arabicContainer: {
        backgroundColor: arabicCoverage === 'partial' ? colors.background : 'transparent',
        borderRadius: arabicCoverage === 'partial' ? 4 : 0,
        paddingHorizontal: arabicCoverage === 'partial' ? 6 : 0,
        paddingVertical: arabicCoverage === 'partial' ? 2 : 0,
      },
      arabic: {
        color: arabicCoverage === 'full' ? colors.text.white : colors.primary,
      },
    }),
    [badgeCoverage, infoCoverage, arabicCoverage]
  );

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={() => onPress(chapter)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.card}
      >
        {/* Progress fill background */}
        {clampedProgress > 0 && (
          <View
            style={[
              styles.progressFill,
              clampedProgress >= 100
                ? styles.progressFillComplete
                : { width: `${clampedProgress}%` },
            ]}
          />
        )}

        <View style={[styles.badge, dynamicStyles.badge]}>
          <Text style={[styles.badgeText, dynamicStyles.badgeText]}>{chapter.id}</Text>
        </View>

        <View style={styles.info}>
          <View style={dynamicStyles.nameContainer}>
            <Text style={[styles.name, dynamicStyles.name]} numberOfLines={1}>
              {chapter.name_simple}
            </Text>
          </View>
          <View style={[styles.metaRow, dynamicStyles.metaContainer]}>
            <Text style={[styles.meta, dynamicStyles.meta]}>
              {chapter.translated_name?.name || 'Chapter'}
            </Text>
            <View style={[styles.dot, dynamicStyles.dot]} />
            <Text style={[styles.meta, dynamicStyles.meta]}>{chapter.verses_count} ayahs</Text>
          </View>
        </View>

        <View style={[styles.right, dynamicStyles.arabicContainer]}>
          <Text style={[styles.arabic, dynamicStyles.arabic]} numberOfLines={1}>
            {chapter.name_arabic}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={chevronCoverage === 'full' ? colors.text.white : colors.text.tertiary}
          style={styles.chevron}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm + 2,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
    zIndex: 0,
  },
  progressFillComplete: {
    right: 0,
    borderRadius: borderRadius.lg,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
    zIndex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    fontSize: 12,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 6,
  },
  right: {
    marginRight: spacing.sm,
    zIndex: 1,
  },
  arabic: {
    fontSize: 20,
  },
  chevron: {
    zIndex: 1,
  },
});
