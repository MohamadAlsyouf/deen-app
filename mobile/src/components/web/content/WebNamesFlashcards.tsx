/**
 * WebNamesFlashcards - 3D flip card game for web with CSS animations
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useQuery } from '@tanstack/react-query';
import { colors, borderRadius } from '@/theme';
import { useWebHover } from '@/hooks/useWebHover';
import { asmaUlHusnaService } from '@/services/asmaUlHusnaService';
import type { AsmaUlHusnaName } from '@/types/asmaUlHusna';

const AUDIO_BASE_URL = 'https://islamicapi.com';

type WebNamesFlashcardsProps = {
  onBack: () => void;
};

export const WebNamesFlashcards: React.FC<WebNamesFlashcardsProps> = ({ onBack }) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledNames, setShuffledNames] = useState<AsmaUlHusnaName[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const dataQuery = useQuery({
    queryKey: ['asmaUlHusna'],
    queryFn: () => asmaUlHusnaService.getData(),
  });

  const names = isShuffled ? shuffledNames : (dataQuery.data?.names ?? []);
  const currentName = names[currentIndex];
  const total = names.length;
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  const flipCard = useCallback(() => {
    setIsFlipped((f) => !f);
  }, []);

  const resetFlip = useCallback(() => {
    setIsFlipped(false);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
      resetFlip();
    }
  }, [currentIndex, total, resetFlip]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetFlip();
    }
  }, [currentIndex, resetFlip]);

  const handleShuffle = useCallback(() => {
    if (!isShuffled && dataQuery.data?.names) {
      const shuffled = [...dataQuery.data.names].sort(() => Math.random() - 0.5);
      setShuffledNames(shuffled);
    }
    setIsShuffled(!isShuffled);
    setCurrentIndex(0);
    resetFlip();
  }, [isShuffled, dataQuery.data?.names, resetFlip]);

  const handlePlayAudio = useCallback(async () => {
    if (!currentName?.audio) return;
    const uri = `${AUDIO_BASE_URL}${currentName.audio}`;
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      setIsPlayingAudio(true);
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingAudio(false);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch {
      setIsPlayingAudio(false);
    }
  }, [currentName?.audio]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        flipCard();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [handlePrev, handleNext, flipCard]);

  const backHover = useWebHover({
    hoverStyle: { backgroundColor: `${colors.primary}15` },
    transition: 'all 0.2s ease-out',
  });

  const prevHover = useWebHover({
    hoverStyle: { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(0,0,0,0.1)' },
    transition: 'all 0.2s ease-out',
  });

  const nextHover = useWebHover({
    hoverStyle: { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(27,67,50,0.3)' },
    transition: 'all 0.2s ease-out',
  });

  const audioHover = useWebHover({
    hoverStyle: { transform: 'scale(1.1)', backgroundColor: `${colors.primary}20` },
    transition: 'all 0.2s ease-out',
  });

  const shuffleHover = useWebHover({
    hoverStyle: { backgroundColor: `${colors.primary}12` },
    transition: 'all 0.2s ease-out',
  });

  if (dataQuery.isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading flashcards...</Text>
        </View>
      </View>
    );
  }

  if (!hasStarted) {
    return (
      <View style={styles.introScreen}>
        <LinearGradient
          colors={[colors.islamic.midnight, colors.primary, colors.primaryLight]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.introContent}>
          <View style={styles.introIconCircle}>
            <Ionicons name="albums-outline" size={44} color={colors.islamic.gold} />
          </View>
          <Text style={styles.introTitle}>Flashcards</Text>
          <Text style={styles.introDesc}>
            Flip through the 99 Names of Allah one by one, listen to pronunciation,
            and review each meaning at your own pace.
          </Text>

          <View style={styles.introCardPreview}>
            <View style={styles.introCardFront}>
              <Text style={styles.introCardArabic}>ٱلرَّحْمَٰنُ</Text>
              <Text style={styles.introCardTransliteration}>Ar-Rahman</Text>
            </View>
            <View style={styles.introFlipHint}>
              <Ionicons name="sync-outline" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.introFlipText}>Flip to reveal the meaning</Text>
            </View>
          </View>

          <View style={styles.introButtons}>
            <TouchableOpacity onPress={() => setHasStarted(true)} activeOpacity={0.85} style={styles.introStartButton}>
              <LinearGradient
                colors={[colors.islamic.gold, colors.accentDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.introStartGradient}
              >
                <Ionicons name="play" size={20} color={colors.islamic.midnight} />
                <Text style={styles.introStartText}>Start Flashcards</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={onBack} activeOpacity={0.8} style={styles.textButton}>
              <Text style={styles.introBackText}>Back to Games</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!currentName) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
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
        <Text style={styles.headerTitle}>Flashcards</Text>
        <TouchableOpacity
          onPress={handleShuffle}
          activeOpacity={0.7}
          // @ts-ignore
          onMouseEnter={shuffleHover.handlers.onMouseEnter}
          onMouseLeave={shuffleHover.handlers.onMouseLeave}
          style={[styles.shuffleButton, shuffleHover.style]}
        >
          <Ionicons name="shuffle" size={18} color={isShuffled ? colors.primary : colors.text.tertiary} />
          <Text style={[styles.shuffleText, isShuffled && styles.shuffleTextActive]}>
            {isShuffled ? 'Shuffled' : 'Shuffle'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <Text style={styles.progressLabel}>{currentIndex + 1} of {total}</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
                // @ts-ignore
                transition: 'width 0.3s ease-out',
              },
            ]}
          />
        </View>
      </View>

      {/* Card Area */}
      <View style={styles.cardArea}>
        <TouchableOpacity
          onPress={flipCard}
          activeOpacity={1}
          style={styles.cardPerspective}
        >
          <View
            style={[
              styles.cardInner,
              {
                // @ts-ignore
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              },
            ]}
          >
            {/* Front */}
            <View style={[styles.cardFace, styles.cardFront]}>
              <Text style={styles.cardNumber}>#{currentName.number}</Text>
              <Text style={styles.cardArabic}>{currentName.name}</Text>
              <Text style={styles.cardTransliteration}>{currentName.transliteration}</Text>
              <TouchableOpacity
                onPress={(e: any) => {
                  e.stopPropagation();
                  handlePlayAudio();
                }}
                activeOpacity={0.7}
                // @ts-ignore
                onMouseEnter={audioHover.handlers.onMouseEnter}
                onMouseLeave={audioHover.handlers.onMouseLeave}
                style={[styles.audioButton, audioHover.style]}
              >
                {isPlayingAudio ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="volume-high" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
              <Text style={styles.tapHint}>Click to reveal meaning</Text>
            </View>

            {/* Back */}
            <View style={[styles.cardFace, styles.cardBack]}>
              <Text style={styles.cardNumber}>#{currentName.number}</Text>
              <Text style={styles.backTranslation}>{currentName.translation}</Text>
              <View style={styles.meaningDivider} />
              <Text style={styles.backMeaning}>{currentName.meaning}</Text>
              <Text style={styles.backArabicSmall}>{currentName.name}</Text>
              <Text style={styles.tapHint}>Click to flip back</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity
          onPress={handlePrev}
          disabled={currentIndex === 0}
          activeOpacity={0.7}
          // @ts-ignore
          onMouseEnter={prevHover.handlers.onMouseEnter}
          onMouseLeave={prevHover.handlers.onMouseLeave}
          style={[
            styles.navButton,
            styles.navButtonOutline,
            currentIndex === 0 && styles.navButtonDisabled,
            prevHover.style,
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={currentIndex === 0 ? colors.text.disabled : colors.primary} />
          <Text style={[styles.navButtonText, currentIndex === 0 && styles.navButtonTextDisabled]}>Previous</Text>
        </TouchableOpacity>

        <Text style={styles.keyHint}>Use arrow keys or spacebar</Text>

        <TouchableOpacity
          onPress={handleNext}
          disabled={currentIndex === total - 1}
          activeOpacity={0.7}
          // @ts-ignore
          onMouseEnter={nextHover.handlers.onMouseEnter}
          onMouseLeave={nextHover.handlers.onMouseLeave}
          style={[
            styles.navButton,
            styles.navButtonPrimary,
            currentIndex === total - 1 && styles.navButtonDisabled,
            nextHover.style,
          ]}
        >
          <Text style={[styles.navButtonTextWhite, currentIndex === total - 1 && styles.navButtonTextDisabled]}>Next</Text>
          <Ionicons name="chevron-forward" size={20} color={currentIndex === total - 1 ? colors.text.disabled : '#fff'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    padding: 36,
  },
  introScreen: {
    flex: 1,
    width: '100%',
    minHeight: 720,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  introContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  introIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  introTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text.white,
    textAlign: 'center',
    marginBottom: 12,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  introDesc: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
    maxWidth: 560,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  introCardPreview: {
    alignItems: 'center',
    marginBottom: 28,
  },
  introCardFront: {
    width: 280,
    minHeight: 180,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginBottom: 12,
  },
  introCardArabic: {
    fontSize: 40,
    color: colors.text.white,
    marginBottom: 10,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  introCardTransliteration: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  introFlipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  introFlipText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  introButtons: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  introStartButton: {
    width: '100%',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: 12,
    // @ts-ignore
    cursor: 'pointer',
  },
  introStartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  introStartText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.islamic.midnight,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  introBackText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  textButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    // @ts-ignore
    cursor: 'pointer',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  loadingText: {
    fontSize: 15,
    color: colors.text.secondary,
    marginTop: 16,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    // @ts-ignore
    cursor: 'pointer',
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    // @ts-ignore
    cursor: 'pointer',
  },
  shuffleText: {
    fontSize: 13,
    color: colors.text.tertiary,
    fontWeight: '500',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  shuffleTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 32,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    minHeight: 380,
  },
  cardPerspective: {
    width: '100%',
    maxWidth: 620,
    height: 380,
    // @ts-ignore
    perspective: '1200px',
    cursor: 'pointer',
  },
  cardInner: {
    width: '100%',
    height: '100%',
    position: 'relative',
    // @ts-ignore
    transformStyle: 'preserve-3d',
  },
  cardFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    backfaceVisibility: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  },
  cardFront: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardBack: {
    backgroundColor: '#F0F7F4',
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    // @ts-ignore
    transform: 'rotateY(180deg)',
  },
  cardNumber: {
    position: 'absolute',
    top: 20,
    left: 24,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.tertiary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  cardArabic: {
    fontSize: 56,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  cardTransliteration: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: 24,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  audioButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    // @ts-ignore
    cursor: 'pointer',
  },
  backTranslation: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  meaningDivider: {
    width: 48,
    height: 2,
    backgroundColor: `${colors.primary}30`,
    borderRadius: 1,
    marginBottom: 16,
  },
  backMeaning: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 16,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  backArabicSmall: {
    fontSize: 24,
    color: `${colors.primary}60`,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  tapHint: {
    position: 'absolute',
    bottom: 16,
    fontSize: 12,
    color: colors.text.disabled,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
    // @ts-ignore
    cursor: 'pointer',
  },
  navButtonOutline: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  navButtonPrimary: {
    backgroundColor: colors.primary,
  },
  navButtonDisabled: {
    opacity: 0.4,
    // @ts-ignore
    cursor: 'default',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  navButtonTextWhite: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  navButtonTextDisabled: {
    color: colors.text.disabled,
  },
  keyHint: {
    fontSize: 12,
    color: colors.text.disabled,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
});
