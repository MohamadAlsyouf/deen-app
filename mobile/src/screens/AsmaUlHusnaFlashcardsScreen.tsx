import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Header } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { asmaUlHusnaService } from '@/services/asmaUlHusnaService';
import type { AsmaUlHusnaName } from '@/types/asmaUlHusna';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const AUDIO_BASE_URL = 'https://islamicapi.com';

export const AsmaUlHusnaFlashcardsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledNames, setShuffledNames] = useState<AsmaUlHusnaName[]>([]);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  const dataQuery = useQuery({
    queryKey: ['asmaUlHusna'],
    queryFn: () => asmaUlHusnaService.getData(),
  });

  const names = isShuffled ? shuffledNames : (dataQuery.data?.names ?? []);
  const currentName = names[currentIndex];
  const total = names.length;

  const flipCard = useCallback(() => {
    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  }, [isFlipped, flipAnim]);

  const resetFlip = useCallback(() => {
    flipAnim.setValue(0);
    setIsFlipped(false);
  }, [flipAnim]);

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
      resetFlip();
    }
  }, [currentIndex, total, resetFlip]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetFlip();
    }
  }, [currentIndex, resetFlip]);

  const toggleShuffle = useCallback(() => {
    if (!isShuffled && dataQuery.data?.names) {
      const shuffled = [...dataQuery.data.names].sort(() => Math.random() - 0.5);
      setShuffledNames(shuffled);
    }
    setIsShuffled(!isShuffled);
    setCurrentIndex(0);
    resetFlip();
  }, [isShuffled, dataQuery.data?.names, resetFlip]);

  const playAudio = useCallback(async () => {
    if (!currentName?.audio) return;
    const uri = `${AUDIO_BASE_URL}${currentName.audio}`;
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
      );
      soundRef.current = sound;
    } catch {
      // Audio unavailable — ignore silently
    }
  }, [currentName?.audio]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  if (dataQuery.isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <Header
            title="Flashcards"
            leftAction={{ iconName: 'arrow-back', onPress: () => navigation.goBack() }}
          />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!currentName) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Header
          title="Flashcards"
          leftAction={{ iconName: 'arrow-back', onPress: () => navigation.goBack() }}
        />
      </View>

      <View style={styles.content}>
        {/* Progress */}
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{currentIndex + 1} of {total}</Text>
          <TouchableOpacity onPress={toggleShuffle} style={styles.shuffleButton} activeOpacity={0.7}>
            <Ionicons name="shuffle" size={18} color={isShuffled ? colors.primary : colors.text.tertiary} />
            <Text style={[styles.shuffleText, isShuffled && styles.shuffleTextActive]}>
              {isShuffled ? 'Shuffled' : 'Shuffle'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((currentIndex + 1) / total) * 100}%` }]} />
        </View>

        {/* Card */}
        <Pressable onPress={flipCard} style={styles.cardTouchable}>
          {/* Front side — Arabic name */}
          <Animated.View
            pointerEvents={isFlipped ? 'none' : 'auto'}
            style={[
              styles.card,
              styles.cardFront,
              { transform: [{ perspective: 1000 }, { rotateY: frontInterpolate }] },
            ]}
          >
            <Text style={styles.cardNumber}>#{currentName.number}</Text>
            <Text style={styles.cardArabic}>{currentName.name}</Text>
            <Text style={styles.cardTransliteration}>{currentName.transliteration}</Text>
            <TouchableOpacity onPress={playAudio} style={styles.audioButton} activeOpacity={0.7}>
              <Ionicons name="volume-high" size={22} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.tapHint}>Tap to reveal meaning</Text>
          </Animated.View>

          {/* Back side — meaning */}
          <Animated.View
            pointerEvents={isFlipped ? 'auto' : 'none'}
            style={[
              styles.card,
              styles.cardBack,
              { transform: [{ perspective: 1000 }, { rotateY: backInterpolate }] },
            ]}
          >
            <Text style={styles.cardNumber}>#{currentName.number}</Text>
            <Text style={styles.cardTranslation}>{currentName.translation}</Text>
            <View style={styles.meaningDivider} />
            <Text style={styles.cardMeaning}>{currentName.meaning}</Text>
            <Text style={styles.tapHint}>Tap to flip back</Text>
          </Animated.View>
        </Pressable>

        {/* Navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            onPress={goPrev}
            disabled={currentIndex === 0}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={currentIndex === 0 ? colors.text.disabled : colors.primary} />
            <Text style={[styles.navButtonText, currentIndex === 0 && styles.navButtonTextDisabled]}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, currentIndex === total - 1 && styles.navButtonDisabled]}
            onPress={goNext}
            disabled={currentIndex === total - 1}
            activeOpacity={0.7}
          >
            <Text style={[styles.navButtonText, currentIndex === total - 1 && styles.navButtonTextDisabled]}>Next</Text>
            <Ionicons name="chevron-forward" size={24} color={currentIndex === total - 1 ? colors.text.disabled : colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shuffleText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  shuffleTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  cardTouchable: {
    flex: 1,
    maxHeight: 420,
    alignSelf: 'center',
    width: CARD_WIDTH,
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardFront: {
    backgroundColor: colors.surface,
  },
  cardBack: {
    backgroundColor: '#F0F7F4',
  },
  cardNumber: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontWeight: '700',
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
  },
  cardArabic: {
    fontSize: 48,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  cardTransliteration: {
    ...typography.h4,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  audioButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  cardTranslation: {
    ...typography.h3,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  meaningDivider: {
    width: 40,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
    marginBottom: spacing.md,
    opacity: 0.3,
  },
  cardMeaning: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
  },
  tapHint: {
    ...typography.caption,
    color: colors.text.disabled,
    position: 'absolute',
    bottom: spacing.lg,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    ...typography.button,
    color: colors.primary,
  },
  navButtonTextDisabled: {
    color: colors.text.disabled,
  },
});
