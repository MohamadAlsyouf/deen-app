import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
import type { QuranChapter } from '@/types/quran';

type QuranChapterCardProps = {
  chapter: QuranChapter;
  onPress: (chapter: QuranChapter) => void;
};

export const QuranChapterCard: React.FC<QuranChapterCardProps> = ({ chapter, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, tension: 100, friction: 8 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={() => onPress(chapter)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.card}
      >
        <View style={styles.accent} />

        <View style={styles.body}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{chapter.id}</Text>
          </View>

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {chapter.name_simple}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>
                {chapter.translated_name?.name || 'Chapter'}
              </Text>
              <View style={styles.dot} />
              <Text style={styles.meta}>{chapter.verses_count} ayahs</Text>
            </View>
          </View>

          <View style={styles.right}>
            <Text style={styles.arabic} numberOfLines={1}>
              {chapter.name_arabic}
            </Text>
          </View>
        </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  accent: {
    width: 4,
    backgroundColor: colors.primaryLight,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: `${colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.text.disabled,
    marginHorizontal: 6,
  },
  right: {
    marginLeft: spacing.sm,
    alignItems: 'flex-end',
  },
  arabic: {
    fontSize: 20,
    color: colors.primary,
  },
});
