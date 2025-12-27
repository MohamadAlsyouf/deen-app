import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/theme';
import type { QuranVerse, QuranWord } from '@/types/quran';

type QuranVerseCardProps = {
  verse: QuranVerse;
};

const getWordTransliterations = (words: QuranWord[] | undefined): string[] => {
  if (!words || words.length === 0) {
    return [];
  }

  return words
    .filter((word) => word.char_type_name === 'word')
    .map((word) => word.transliteration?.text)
    .filter((text): text is string => Boolean(text && text.trim()));
};

const stripHtmlTags = (value: string): string => {
  return value.replace(/<[^>]*>/g, ' ');
};

const stripSupFootnotes = (value: string): string => {
  return value.replace(/<sup[^>]*>.*?<\/sup>/gi, '');
};

const decodeHtmlEntities = (value: string): string => {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
};

const normalizeWhitespace = (value: string): string => {
  return value.replace(/\s+/g, ' ').trim();
};

const sanitizeTranslationText = (value: string): string => {
  const withoutSupFootnotes = stripSupFootnotes(value);
  const withoutTags = stripHtmlTags(withoutSupFootnotes);
  const decoded = decodeHtmlEntities(withoutTags);
  return normalizeWhitespace(decoded);
};

export const QuranVerseCard: React.FC<QuranVerseCardProps> = ({ verse }) => {
  const transliterationWords = getWordTransliterations(verse.words);
  const ayahTransliteration = transliterationWords.join(' ');
  const translationRaw = verse.translations?.[0]?.text;
  const translationText = translationRaw ? sanitizeTranslationText(translationRaw) : '';

  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{verse.verse_number}</Text>
        </View>
        <Text style={styles.verseKey}>{verse.verse_key}</Text>
      </View>

      <Text style={styles.arabic}>{verse.text_uthmani}</Text>

      {ayahTransliteration.length > 0 && (
        <Text style={styles.ayahTransliteration} selectable>
          {ayahTransliteration}
        </Text>
      )}

      {translationText.length > 0 && (
        <Text style={styles.translation} selectable>
          {translationText}
        </Text>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  badge: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  verseKey: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  arabic: {
    fontSize: 26,
    lineHeight: 42,
    color: colors.text.primary,
    textAlign: 'right',
  },
  ayahTransliteration: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
    lineHeight: 26,
  },
  translation: {
    ...typography.body,
    color: colors.primaryDark,
    marginTop: spacing.sm,
    lineHeight: 26,
  },
});


