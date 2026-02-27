import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [hasStarted, setHasStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledNames, setShuffledNames] = useState<AsmaUlHusnaName[]>([]);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  const introFade = useRef(new Animated.Value(0)).current;
  const introIconScale = useRef(new Animated.Value(0.3)).current;
  const introIconSlide = useRef(new Animated.Value(-30)).current;
  const introTitleFade = useRef(new Animated.Value(0)).current;
  const introDescFade = useRef(new Animated.Value(0)).current;
  const introDiagramFade = useRef(new Animated.Value(0)).current;
  const introDiagramSlide = useRef(new Animated.Value(20)).current;
  const introButtonsFade = useRef(new Animated.Value(0)).current;
  const introExitSlide = useRef(new Animated.Value(0)).current;
  const gameFade = useRef(new Animated.Value(0)).current;
  const gameSlide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (hasStarted) return;
    Animated.timing(introFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.spring(introIconScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.spring(introIconSlide, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
    Animated.timing(introTitleFade, { toValue: 1, duration: 400, delay: 300, useNativeDriver: true }).start();
    Animated.timing(introDescFade, { toValue: 1, duration: 400, delay: 500, useNativeDriver: true }).start();
    Animated.parallel([
      Animated.timing(introDiagramFade, { toValue: 1, duration: 400, delay: 650, useNativeDriver: true }),
      Animated.timing(introDiagramSlide, { toValue: 0, duration: 400, delay: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Animated.timing(introButtonsFade, { toValue: 1, duration: 400, delay: 850, useNativeDriver: true }).start();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    gameFade.setValue(0);
    gameSlide.setValue(40);
    Animated.parallel([
      Animated.timing(gameFade, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }),
      Animated.timing(gameSlide, { toValue: 0, duration: 400, delay: 100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [hasStarted]);

  const handleStart = useCallback(() => {
    Animated.parallel([
      Animated.timing(introFade, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(introExitSlide, { toValue: -50, duration: 250, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(() => setHasStarted(true));
  }, []);

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

  if (!hasStarted) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.islamic.midnight, colors.primary, colors.primaryLight]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.headerContainer, { paddingTop: insets.top, backgroundColor: 'transparent' }]}>
          <Header
            title="Flashcards"
            leftAction={{ iconName: 'arrow-back', onPress: () => navigation.goBack() }}
            dark
          />
        </View>

        <Animated.View style={[styles.introContent, { opacity: introFade, transform: [{ translateY: introExitSlide }] }]}>
          <Animated.View style={{ transform: [{ translateY: introIconSlide }, { scale: introIconScale }], alignItems: 'center' }}>
            <View style={styles.introIconCircle}>
              <Ionicons name="albums" size={44} color={colors.islamic.gold} />
            </View>
          </Animated.View>

          <Animated.Text style={[styles.introTitle, { opacity: introTitleFade }]}>
            Flashcards
          </Animated.Text>
          <Animated.Text style={[styles.introDesc, { opacity: introDescFade }]}>
            Browse through all 99 Names of Allah with flip cards.{'\n'}
            See the Arabic name, then tap to reveal the English meaning.
          </Animated.Text>

          <Animated.View style={[styles.introDiagram, { opacity: introDiagramFade, transform: [{ translateY: introDiagramSlide }] }]}>
            <View style={styles.introMiniCard}>
              <Text style={styles.introMiniArabic}>ٱلرَّحْمَـٰنُ</Text>
              <Text style={styles.introMiniSub}>Tap to flip</Text>
            </View>
            <Ionicons name="repeat" size={24} color="rgba(255,255,255,0.5)" style={{ marginHorizontal: spacing.md }} />
            <View style={[styles.introMiniCard, styles.introMiniCardAlt]}>
              <Text style={styles.introMiniMeaning}>The Most{'\n'}Merciful</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.introButtons, { opacity: introButtonsFade }]}>
            <TouchableOpacity onPress={handleStart} activeOpacity={0.8} style={styles.introStartButton}>
              <LinearGradient
                colors={[colors.islamic.gold, colors.accentDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.introStartGradient}
              >
                <Ionicons name="play" size={20} color={colors.islamic.midnight} />
                <Text style={styles.introStartText}>Start</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={styles.introBackButton}>
              <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.8)" />
              <Text style={styles.introBackText}>Back to Games</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    );
  }

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

      <Animated.View style={[styles.content, { opacity: gameFade, transform: [{ translateY: gameSlide }] }]}>
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
      </Animated.View>
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

  introContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  introIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  introTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  introDesc: {
    ...typography.body,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  introDiagram: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  introMiniCard: {
    width: 100,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  introMiniCardAlt: {
    backgroundColor: 'rgba(212,163,115,0.15)',
    borderColor: 'rgba(212,163,115,0.3)',
  },
  introMiniArabic: {
    fontSize: 20,
    color: colors.text.white,
    fontWeight: '600',
    marginBottom: 4,
  },
  introMiniSub: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
  },
  introMiniMeaning: {
    ...typography.caption,
    color: colors.islamic.gold,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  introButtons: {
    width: '100%',
    alignItems: 'center',
  },
  introStartButton: {
    width: '100%',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  introStartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: spacing.sm,
  },
  introStartText: {
    ...typography.button,
    color: colors.islamic.midnight,
    fontWeight: '700',
  },
  introBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  introBackText: {
    ...typography.button,
    color: 'rgba(255,255,255,0.7)',
  },
});
