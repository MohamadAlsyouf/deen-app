import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/theme';
import type { QuranVerse, QuranWord } from '@/types/quran';

type HighlightStatus = 'none' | 'current' | 'completed';

type QuranVerseCardProps = {
  verse: QuranVerse;
  highlightStatus?: HighlightStatus;
  highlightedWordPosition?: number | null;
};

type ArabicWord = {
  text: string;
  position: number;
  isWord: boolean;
};

const getArabicWords = (words: QuranWord[] | undefined): ArabicWord[] => {
  if (!words || words.length === 0) {
    return [];
  }

  return words.map((word) => ({
    text: word.text_uthmani,
    position: word.position,
    isWord: word.char_type_name === 'word',
  }));
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

export const QuranVerseCard: React.FC<QuranVerseCardProps> = ({
  verse,
  highlightStatus = 'none',
  highlightedWordPosition = null,
}) => {
  const arabicWords = useMemo(() => getArabicWords(verse.words), [verse.words]);
  const transliterationWords = getWordTransliterations(verse.words);
  const ayahTransliteration = transliterationWords.join(' ');
  const translationRaw = verse.translations?.[0]?.text;
  const translationText = translationRaw ? sanitizeTranslationText(translationRaw) : '';

  const isVerseHighlighted = highlightStatus === 'current' || highlightStatus === 'completed';

  const renderArabicText = () => {
    // If no words data or no highlighting needed, render plain text
    if (arabicWords.length === 0 || highlightStatus === 'none') {
      return <Text style={styles.arabic}>{verse.text_uthmani}</Text>;
    }

    // When verse is completed, all words are green
    if (highlightStatus === 'completed') {
      return (
        <Text style={styles.arabic}>
          {arabicWords.map((word, index) => (
            <Text key={index} style={styles.highlightedWord}>
              {word.text}
              {index < arabicWords.length - 1 ? ' ' : ''}
            </Text>
          ))}
        </Text>
      );
    }

    // Current verse - highlight words up to and including the current position
    return (
      <Text style={styles.arabic}>
        {arabicWords.map((word, index) => {
          const shouldHighlight =
            word.isWord &&
            highlightedWordPosition !== null &&
            word.position <= highlightedWordPosition;

          return (
            <Text
              key={index}
              style={shouldHighlight ? styles.highlightedWord : styles.normalWord}
            >
              {word.text}
              {index < arabicWords.length - 1 ? ' ' : ''}
            </Text>
          );
        })}
      </Text>
    );
  };

  return (
    <Card
      style={[
        styles.card,
        isVerseHighlighted && styles.highlightedCard,
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.badge, isVerseHighlighted && styles.highlightedBadge]}>
          <Text style={[styles.badgeText, isVerseHighlighted && styles.highlightedBadgeText]}>
            {verse.verse_number}
          </Text>
        </View>
        <Text style={styles.verseKey}>{verse.verse_key}</Text>
      </View>

      {renderArabicText()}

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
  highlightedCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
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
  highlightedBadge: {
    backgroundColor: colors.primary,
  },
  badgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  highlightedBadgeText: {
    color: colors.text.white,
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
    writingDirection: 'rtl',
  },
  normalWord: {
    color: colors.text.primary,
  },
  highlightedWord: {
    color: colors.primary,
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
