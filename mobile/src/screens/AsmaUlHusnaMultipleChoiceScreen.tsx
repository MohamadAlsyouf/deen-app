import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { asmaUlHusnaService } from '@/services/asmaUlHusnaService';
import type { AsmaUlHusnaName } from '@/types/asmaUlHusna';

type QuestionMode = 'arabic-to-english' | 'english-to-arabic';

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateQuestions(names: AsmaUlHusnaName[], count: number) {
  const shuffled = shuffleArray(names);
  const selected = shuffled.slice(0, count);
  const remaining = shuffled.slice(count);

  return selected.map((correct, i) => {
    const mode: QuestionMode = i % 2 === 0 ? 'arabic-to-english' : 'english-to-arabic';
    const distractors = shuffleArray(
      [...remaining, ...selected.filter((n) => n.number !== correct.number)]
    ).slice(0, 3);
    const options = shuffleArray([correct, ...distractors]);
    return { correct, options, mode };
  });
}

const TOTAL_QUESTIONS = 10;
const AUDIO_BASE_URL = 'https://islamicapi.com';

const CORRECT_MESSAGES = [
  'Correct!',
  'Great job!',
  'Well done!',
  'Excellent!',
  'Spot on!',
  'Mashallah!',
];

function getRandomCorrectMessage() {
  return CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)];
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  colors.islamic.gold, colors.accentLight, '#FFD700', colors.secondary,
  colors.secondaryLight, '#FF8C42', '#87CEEB', '#DDA0DD',
];

type ParticleConfig = {
  startX: number;
  color: string;
  width: number;
  height: number;
  delay: number;
  duration: number;
  driftX: number;
  rotations: number;
};

function createParticleConfigs(count: number): ParticleConfig[] {
  return Array.from({ length: count }, () => ({
    startX: Math.random() * SCREEN_WIDTH,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    width: 4 + Math.random() * 10,
    height: Math.random() > 0.5 ? 4 + Math.random() * 6 : 8 + Math.random() * 12,
    delay: Math.random() * 1500,
    duration: 2500 + Math.random() * 2500,
    driftX: (Math.random() - 0.5) * 200,
    rotations: 2 + Math.random() * 6,
  }));
}

function getScoreGradient(pct: number): [string, string] {
  if (pct >= 90) return [colors.islamic.gold, colors.accentLight];
  if (pct >= 70) return [colors.primary, colors.secondary];
  if (pct >= 50) return [colors.info, '#7C4DFF'];
  return ['#9C27B0', '#E91E63'];
}

function getBackgroundGradient(pct: number): [string, string, string] {
  if (pct >= 90) return ['#FFF8E1', '#FFFDE7', colors.background];
  if (pct >= 70) return ['#E8F5E9', '#F1F8E9', colors.background];
  if (pct >= 50) return ['#E3F2FD', '#E8EAF6', colors.background];
  return ['#F3E5F5', '#EDE7F6', colors.background];
}

function getResultsConfig(pct: number) {
  if (pct === 100) return { title: 'Perfect Score!', icon: 'trophy' as const, iconColor: colors.islamic.gold };
  if (pct >= 90) return { title: 'Outstanding!', icon: 'star' as const, iconColor: colors.islamic.gold };
  if (pct >= 70) return { title: 'Great Job!', icon: 'ribbon' as const, iconColor: colors.primary };
  if (pct >= 50) return { title: 'Good Effort!', icon: 'thumbs-up' as const, iconColor: colors.info };
  return { title: 'Keep Learning!', icon: 'book' as const, iconColor: '#9C27B0' };
}

const ConfettiOverlay: React.FC = React.memo(() => {
  const configs = useRef(createParticleConfigs(50)).current;
  const anims = useRef(configs.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel(
      anims.map((a, i) =>
        Animated.timing(a, {
          toValue: 1,
          duration: configs[i].duration,
          delay: configs[i].delay,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {configs.map((cfg, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: cfg.startX,
            top: -20,
            width: cfg.width,
            height: cfg.height,
            borderRadius: Math.min(cfg.width, cfg.height) / 2,
            backgroundColor: cfg.color,
            opacity: anims[i].interpolate({
              inputRange: [0, 0.05, 0.7, 1],
              outputRange: [0, 1, 0.8, 0],
            }),
            transform: [
              {
                translateY: anims[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, SCREEN_HEIGHT + 40],
                }),
              },
              {
                translateX: anims[i].interpolate({
                  inputRange: [0, 0.3, 0.7, 1],
                  outputRange: [0, cfg.driftX * 0.4, cfg.driftX, cfg.driftX * 0.6],
                }),
              },
              {
                rotate: anims[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', `${cfg.rotations * 360}deg`],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
});

export const AsmaUlHusnaMultipleChoiceScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [quizKey, setQuizKey] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [displayPercent, setDisplayPercent] = useState(0);

  const resultsFade = useRef(new Animated.Value(0)).current;
  const scoreSlide = useRef(new Animated.Value(-60)).current;
  const scoreScale = useRef(new Animated.Value(0.3)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;
  const statsFade = useRef(new Animated.Value(0)).current;
  const statsSlide = useRef(new Animated.Value(30)).current;
  const buttonsFade = useRef(new Animated.Value(0)).current;
  const percentCounter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isFinished) return;

    const pct = Math.round((score / TOTAL_QUESTIONS) * 100);

    resultsFade.setValue(0);
    scoreSlide.setValue(-60);
    scoreScale.setValue(0.3);
    titleFade.setValue(0);
    subtitleFade.setValue(0);
    statsFade.setValue(0);
    statsSlide.setValue(30);
    buttonsFade.setValue(0);
    percentCounter.setValue(0);
    setDisplayPercent(0);

    Animated.timing(resultsFade, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(scoreSlide, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.spring(scoreScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(scoreScale, { toValue: 1.08, duration: 200, useNativeDriver: true }),
        Animated.timing(scoreScale, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
    ]).start();

    const listener = percentCounter.addListener(({ value }) => {
      setDisplayPercent(Math.round(value));
    });
    Animated.timing(percentCounter, {
      toValue: pct, duration: 1000, delay: 500,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();

    Animated.timing(titleFade, { toValue: 1, duration: 400, delay: 700, useNativeDriver: true }).start();
    Animated.timing(subtitleFade, { toValue: 1, duration: 400, delay: 900, useNativeDriver: true }).start();
    Animated.parallel([
      Animated.timing(statsFade, { toValue: 1, duration: 400, delay: 1100, useNativeDriver: true }),
      Animated.timing(statsSlide, { toValue: 0, duration: 400, delay: 1100, useNativeDriver: true }),
    ]).start();
    Animated.timing(buttonsFade, { toValue: 1, duration: 400, delay: 1300, useNativeDriver: true }).start();

    return () => percentCounter.removeListener(listener);
  }, [isFinished, score]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  const handlePlayAudio = useCallback(async (name: AsmaUlHusnaName) => {
    try {
      if (playingAudioId === name.number && soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setPlayingAudioId(null);
        return;
      }

      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      if (!name.audio) return;

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: `${AUDIO_BASE_URL}${name.audio}` },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setPlayingAudioId(name.number);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingAudioId(null);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlayingAudioId(null);
    }
  }, [playingAudioId]);

  const dataQuery = useQuery({
    queryKey: ['asmaUlHusna'],
    queryFn: () => asmaUlHusnaService.getData(),
  });

  const names = dataQuery.data?.names ?? [];

  const questions = useMemo(() => {
    if (names.length < 4) return [];
    return generateQuestions(names, TOTAL_QUESTIONS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [names, quizKey]);

  const currentQuestion = questions[questionIndex];

  const handleSelect = useCallback((index: number) => {
    if (isSubmitted) return;
    setSelectedIndex(index);
  }, [isSubmitted]);

  const handleSubmit = useCallback(() => {
    if (selectedIndex === null || !currentQuestion || isSubmitted) return;
    setIsSubmitted(true);
    const isCorrect = currentQuestion.options[selectedIndex].number === currentQuestion.correct.number;
    if (isCorrect) {
      setScore((s) => s + 1);
      setFeedbackMessage(getRandomCorrectMessage());
    } else {
      setFeedbackMessage('');
    }
  }, [selectedIndex, currentQuestion, isSubmitted]);

  const stopAudio = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.stopAsync();
      soundRef.current.unloadAsync();
      soundRef.current = null;
      setPlayingAudioId(null);
    }
  }, []);

  const handleNext = useCallback(() => {
    stopAudio();
    if (questionIndex < TOTAL_QUESTIONS - 1) {
      setQuestionIndex((i) => i + 1);
      setSelectedIndex(null);
      setIsSubmitted(false);
      setFeedbackMessage('');
    } else {
      setIsFinished(true);
    }
  }, [questionIndex, stopAudio]);

  const handleRestart = useCallback(() => {
    stopAudio();
    setQuestionIndex(0);
    setSelectedIndex(null);
    setIsSubmitted(false);
    setScore(0);
    setIsFinished(false);
    setFeedbackMessage('');
  }, [stopAudio]);

  const handleNewQuiz = useCallback(() => {
    stopAudio();
    setQuestionIndex(0);
    setSelectedIndex(null);
    setIsSubmitted(false);
    setScore(0);
    setIsFinished(false);
    setFeedbackMessage('');
    setQuizKey((k) => k + 1);
  }, [stopAudio]);

  const wasCorrect = isSubmitted && selectedIndex !== null && currentQuestion
    && currentQuestion.options[selectedIndex].number === currentQuestion.correct.number;

  const getOptionStyle = (index: number) => {
    if (!isSubmitted) {
      return index === selectedIndex ? styles.optionSelected : styles.optionDefault;
    }
    const isCorrectOption = currentQuestion.options[index].number === currentQuestion.correct.number;
    if (isCorrectOption) return styles.optionCorrect;
    if (index === selectedIndex) return styles.optionWrong;
    return styles.optionDimmed;
  };

  const getOptionTextStyle = (index: number) => {
    if (!isSubmitted) {
      return index === selectedIndex ? styles.optionTextSelected : styles.optionTextDefault;
    }
    const isCorrectOption = currentQuestion.options[index].number === currentQuestion.correct.number;
    if (isCorrectOption) return styles.optionTextCorrect;
    if (index === selectedIndex) return styles.optionTextWrong;
    return styles.optionTextDimmed;
  };

  if (dataQuery.isLoading || names.length < 4) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <Header
            title="Multiple Choice"
            leftAction={{ iconName: 'arrow-back', onPress: () => navigation.goBack() }}
          />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / TOTAL_QUESTIONS) * 100);
    const showConfetti = percentage >= 90;
    const { title: tierTitle, icon: tierIcon, iconColor: tierIconColor } = getResultsConfig(percentage);
    const bgGradient = getBackgroundGradient(percentage);
    const ringGradient = getScoreGradient(percentage);

    return (
      <View style={styles.container}>
        <LinearGradient colors={bgGradient} style={StyleSheet.absoluteFill} />
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <Header
            title="Results"
            leftAction={{ iconName: 'arrow-back', onPress: () => navigation.goBack() }}
          />
        </View>

        <Animated.ScrollView
          style={{ flex: 1, opacity: resultsFade }}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              transform: [{ translateY: scoreSlide }, { scale: scoreScale }],
              marginBottom: spacing.lg,
            }}
          >
            <LinearGradient
              colors={ringGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scoreRing}
            >
              <View style={styles.scoreInner}>
                <Text style={[styles.scorePercentLarge, { color: ringGradient[0] }]}>
                  {displayPercent}%
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View style={{ opacity: titleFade, alignItems: 'center', marginBottom: spacing.sm }}>
            <View style={[styles.tierIconBadge, { backgroundColor: tierIconColor + '20' }]}>
              <Ionicons name={tierIcon} size={28} color={tierIconColor} />
            </View>
            <Text style={styles.resultsTitleLarge}>{tierTitle}</Text>
          </Animated.View>

          <Animated.Text style={[styles.resultsSubtitleText, { opacity: subtitleFade }]}>
            You answered {score} out of {TOTAL_QUESTIONS} questions correctly
          </Animated.Text>

          <Animated.View
            style={[
              styles.statsRow,
              { opacity: statsFade, transform: [{ translateY: statsSlide }] },
            ]}
          >
            <View style={[styles.statCard, { borderTopColor: colors.success }]}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: colors.error }]}>
              <Ionicons name="close-circle" size={22} color={colors.error} />
              <Text style={styles.statValue}>{TOTAL_QUESTIONS - score}</Text>
              <Text style={styles.statLabel}>Incorrect</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: colors.info }]}>
              <Ionicons name="analytics" size={22} color={colors.info} />
              <Text style={styles.statValue}>{percentage}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: buttonsFade, width: '100%', alignItems: 'center' }}>
            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={handleNewQuiz}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.playAgainGradient}
              >
                <Ionicons name="shuffle" size={20} color={colors.text.white} />
                <Text style={styles.playAgainText}>New Quiz</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={handleRestart}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={18} color={colors.primary} />
              <Text style={styles.reviewButtonText}>Replay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Text style={styles.backButtonText}>Back to Games</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.ScrollView>

        {showConfetti && <ConfettiOverlay />}
      </View>
    );
  }

  if (!currentQuestion) return null;

  const prompt = currentQuestion.mode === 'arabic-to-english'
    ? currentQuestion.correct.name
    : currentQuestion.correct.translation;

  const promptLabel = currentQuestion.mode === 'arabic-to-english'
    ? 'What does this name mean?'
    : 'Which Arabic name matches this meaning?';

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Header
          title="Multiple Choice"
          leftAction={{ iconName: 'arrow-back', onPress: () => navigation.goBack() }}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress */}
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>Question {questionIndex + 1} of {TOTAL_QUESTIONS}</Text>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((questionIndex + 1) / TOTAL_QUESTIONS) * 100}%` }]} />
        </View>

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>{promptLabel}</Text>
          <Text style={[
            styles.questionPrompt,
            currentQuestion.mode === 'arabic-to-english' && styles.questionArabic,
          ]}>
            {prompt}
          </Text>
          {currentQuestion.mode === 'arabic-to-english' && (
            <Text style={styles.questionTransliteration}>{currentQuestion.correct.transliteration}</Text>
          )}
          {currentQuestion.mode === 'arabic-to-english' && currentQuestion.correct.audio && (
            <TouchableOpacity
              style={styles.audioButton}
              onPress={() => handlePlayAudio(currentQuestion.correct)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={playingAudioId === currentQuestion.correct.number ? 'stop-circle' : 'volume-high'}
                size={22}
                color={playingAudioId === currentQuestion.correct.number ? colors.accent : colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Options */}
        {currentQuestion.options.map((option, index) => {
          const display = currentQuestion.mode === 'arabic-to-english'
            ? option.translation
            : `${option.name}  —  ${option.transliteration}`;

          const isCorrectOption = option.number === currentQuestion.correct.number;
          const isSelectedWrong = isSubmitted && index === selectedIndex && !isCorrectOption;
          const showOptionAudio = currentQuestion.mode === 'english-to-arabic' && option.audio;

          return (
            <View key={option.number} style={styles.optionRow}>
              <TouchableOpacity
                style={[
                  styles.option,
                  getOptionStyle(index),
                  isSubmitted && !wasCorrect && isCorrectOption && styles.optionCorrectHighlight,
                ]}
                onPress={() => handleSelect(index)}
                activeOpacity={isSubmitted ? 1 : 0.7}
                disabled={isSubmitted}
              >
                <Text style={[styles.optionText, getOptionTextStyle(index)]}>{display}</Text>
                {isSubmitted && isCorrectOption && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                )}
                {isSelectedWrong && (
                  <Ionicons name="close-circle" size={22} color={colors.error} />
                )}
                {showOptionAudio && (
                  <TouchableOpacity
                    style={styles.optionAudioButton}
                    onPress={(e) => { e.stopPropagation(); handlePlayAudio(option); }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={playingAudioId === option.number ? 'stop-circle' : 'volume-high'}
                      size={18}
                      color={playingAudioId === option.number ? colors.accent : colors.primary}
                    />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              {isSubmitted && !wasCorrect && isCorrectOption && (
                <View style={styles.correctAnswerRow}>
                  <Ionicons name="return-up-back" size={16} color={colors.success} />
                  <Text style={styles.correctAnswerLabel}>Correct answer</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Feedback message for correct answers */}
        {isSubmitted && wasCorrect && (
          <View style={styles.feedbackCorrect}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.feedbackCorrectText}>{feedbackMessage}</Text>
          </View>
        )}

        {/* Feedback message for wrong answers */}
        {isSubmitted && !wasCorrect && (
          <View style={styles.feedbackWrong}>
            <Ionicons name="close-circle" size={20} color={colors.error} />
            <Text style={styles.feedbackWrongText}>Not quite — review the correct answer above.</Text>
          </View>
        )}

        {/* Submit / Next button */}
        {!isSubmitted && selectedIndex !== null && (
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.8}>
            <Text style={styles.submitButtonText}>Submit Answer</Text>
          </TouchableOpacity>
        )}
        {isSubmitted && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.nextButtonText}>
              {questionIndex < TOTAL_QUESTIONS - 1 ? 'Next Question' : 'See Results'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={colors.text.white} />
          </TouchableOpacity>
        )}
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
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
  scoreText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
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
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  questionLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  questionPrompt: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  questionArabic: {
    fontSize: 40,
    color: colors.primary,
    lineHeight: 56,
  },
  questionTransliteration: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  audioButton: {
    marginTop: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRow: {
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1.5,
  },
  optionAudioButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  optionDefault: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  optionSelected: {
    backgroundColor: '#E8EDF6',
    borderColor: colors.info,
  },
  optionCorrect: {
    backgroundColor: '#E8F5E9',
    borderColor: colors.success,
  },
  optionCorrectHighlight: {
    borderWidth: 2,
  },
  optionWrong: {
    backgroundColor: '#FFEBEE',
    borderColor: colors.error,
  },
  optionDimmed: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    opacity: 0.5,
  },
  optionText: {
    ...typography.body,
    flex: 1,
    marginRight: spacing.sm,
  },
  optionTextDefault: {
    color: colors.text.primary,
  },
  optionTextSelected: {
    color: colors.info,
    fontWeight: '600',
  },
  optionTextCorrect: {
    color: colors.success,
    fontWeight: '600',
  },
  optionTextWrong: {
    color: colors.error,
    fontWeight: '600',
  },
  optionTextDimmed: {
    color: colors.text.tertiary,
  },
  correctAnswerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: spacing.sm,
    gap: 4,
  },
  correctAnswerLabel: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  feedbackCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.success,
  },
  feedbackCorrectText: {
    ...typography.body,
    color: colors.success,
    fontWeight: '600',
  },
  feedbackWrong: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error,
  },
  feedbackWrongText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '500',
    flex: 1,
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.info,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.text.white,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  nextButtonText: {
    ...typography.button,
    color: colors.text.white,
  },
  resultsContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  scoreRing: {
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreInner: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorePercentLarge: {
    fontSize: 44,
    fontWeight: '800',
    textAlign: 'center',
  },
  tierIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  resultsTitleLarge: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  resultsSubtitleText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderTopWidth: 3,
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  playAgainButton: {
    width: '100%',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  playAgainGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  playAgainText: {
    ...typography.button,
    color: colors.text.white,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  reviewButtonText: {
    ...typography.button,
    color: colors.primary,
  },
  backButton: {
    paddingVertical: spacing.md,
  },
  backButtonText: {
    ...typography.button,
    color: colors.primary,
  },
});
