import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/theme';
import type { QuranChapter } from '@/types/quran';

type QuranChapterCardProps = {
  chapter: QuranChapter;
  onPress: (chapter: QuranChapter) => void;
};

export const QuranChapterCard: React.FC<QuranChapterCardProps> = ({ chapter, onPress }) => {
  const handlePress = () => {
    onPress(chapter);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{chapter.id}</Text>
          </View>

          <View style={styles.textWrap}>
            <Text style={styles.name} numberOfLines={1}>
              {chapter.name_simple}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {chapter.translated_name?.name || 'Chapter'} • {chapter.verses_count} verses
            </Text>
          </View>

          <View style={styles.right}>
            <Text style={styles.arabic} numberOfLines={1}>
              {chapter.name_arabic}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  badgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  textWrap: {
    flex: 1,
  },
  name: {
    ...typography.h4,
    color: colors.text.primary,
  },
  meta: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
  },
  arabic: {
    fontSize: 18,
    color: colors.primary,
    marginBottom: 2,
  },
});


