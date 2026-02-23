/**
 * WebNamesMultipleChoice - Quiz game with CSS confetti and animated results
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
import { colors } from '@/theme';
import { useWebHover } from '@/hooks/useWebHover';
import { asmaUlHusnaService } from '@/services/asmaUlHusnaService';
import type { AsmaUlHusnaName } from '@/types/asmaUlHusna';

type QuestionMode = 'arabic-to-english' | 'english-to-arabic';

const TOTAL_QUESTIONS = 10;

const CORRECT_MESSAGES = [
  'Correct!',
  'Great job!',
  'Well done!',
  'Excellent!',
  'Spot on!',
  'Mashallah!',
];

const CONFETTI_COLORS = [
  colors.islamic.gold, colors.accentLight, '#FFD700', colors.secondary,
  colors.secondaryLight, '#FF8C42', '#87CEEB', '#DDA0DD',
];

const shuffleArray = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const generateQuestions = (names: AsmaUlHusnaName[], count: number) => {
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
};

const getRandomCorrectMessage = () =>
  CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)];

const getResultsConfig = (pct: number) => {
  if (pct === 100) return { title: 'Perfect Score!', icon: 'trophy' as const, iconColor: colors.islamic.gold };
  if (pct >= 90) return { title: 'Outstanding!', icon: 'star' as const, iconColor: colors.islamic.gold };
  if (pct >= 70) return { title: 'Great Job!', icon: 'ribbon' as const, iconColor: colors.primary };
  if (pct >= 50) return { title: 'Good Effort!', icon: 'thumbs-up' as const, iconColor: colors.info };
  return { title: 'Keep Learning!', icon: 'book' as const, iconColor: '#9C27B0' };
};

const getScoreGradient = (pct: number): [string, string] => {
  if (pct >= 90) return [colors.islamic.gold, colors.accentLight];
  if (pct >= 70) return [colors.primary, colors.secondary];
  if (pct >= 50) return [colors.info, '#7C4DFF'];
  return ['#9C27B0', '#E91E63'];
};

const injectConfettiStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('confetti-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'confetti-keyframes';
  style.textContent = `
    @keyframes confetti-fall {
      0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
      5% { opacity: 1; }
      70% { opacity: 0.8; }
      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }
    @keyframes confetti-drift {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(30px); }
      75% { transform: translateX(-30px); }
    }
    @keyframes score-pop {
      0% { transform: scale(0.3); opacity: 0; }
      60% { transform: scale(1.1); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes score-bounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    @keyframes stat-slide-up {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes counter-pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.08); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
};

const ConfettiOverlay: React.FC = React.memo(() => {
  const particles = useRef(
    Array.from({ length: 50 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      width: 4 + Math.random() * 10,
      height: Math.random() > 0.5 ? 4 + Math.random() * 6 : 8 + Math.random() * 12,
      delay: Math.random() * 1.5,
      duration: 2.5 + Math.random() * 2.5,
      key: i,
    }))
  ).current;

  useEffect(() => {
    injectConfettiStyles();
  }, []);

  return (
    <View style={confettiStyles.overlay} pointerEvents="none">
      {particles.map((p) => (
        <View
          key={p.key}
          style={{
            position: 'absolute',
            left: p.left as any,
            top: -20,
            width: p.width,
            height: p.height,
            borderRadius: Math.min(p.width, p.height) / 2,
            backgroundColor: p.color,
            // @ts-ignore
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards, confetti-drift ${p.duration * 0.7}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </View>
  );
});

const confettiStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 999,
  },
});

type WebNamesMultipleChoiceProps = {
  onBack: () => void;
};

const OptionButton: React.FC<{
  text: string;
  index: number;
  isSelected: boolean;
  isSubmitted: boolean;
  isCorrectOption: boolean;
  wasCorrect: boolean;
  onPress: () => void;
  disabled: boolean;
}> = ({ text, index, isSelected, isSubmitted, isCorrectOption, wasCorrect, onPress, disabled }) => {
  const hover = useWebHover({
    hoverStyle: disabled ? {} : {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
    },
    transition: 'all 0.2s ease-out',
  });

  const getStyle = () => {
    if (!isSubmitted) {
      return isSelected ? styles.optionSelected : styles.optionDefault;
    }
    if (isCorrectOption) return styles.optionCorrect;
    if (isSelected) return styles.optionWrong;
    return styles.optionDimmed;
  };

  const getTextStyle = () => {
    if (!isSubmitted) {
      return isSelected ? styles.optionTextSelected : styles.optionTextDefault;
    }
    if (isCorrectOption) return styles.optionTextCorrect;
    if (isSelected) return styles.optionTextWrong;
    return styles.optionTextDimmed;
  };

  return (
    <View style={{ marginBottom: 10 }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={isSubmitted ? 1 : 0.7}
        disabled={disabled}
        // @ts-ignore
        onMouseEnter={hover.handlers.onMouseEnter}
        onMouseLeave={hover.handlers.onMouseLeave}
        style={[
          styles.option,
          getStyle(),
          !isSubmitted && hover.style,
          isSubmitted && !wasCorrect && isCorrectOption && { borderWidth: 2 },
          {
            // @ts-ignore
            animation: `fadeInUp 0.3s ease-out ${0.05 * index}s forwards`,
            opacity: 0,
          },
        ]}
      >
        <Text style={[styles.optionText, getTextStyle()]}>{text}</Text>
        {isSubmitted && isCorrectOption && (
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
        )}
        {isSubmitted && isSelected && !isCorrectOption && (
          <Ionicons name="close-circle" size={22} color={colors.error} />
        )}
      </TouchableOpacity>
      {isSubmitted && !wasCorrect && isCorrectOption && (
        <View style={styles.correctAnswerRow}>
          <Ionicons name="return-up-back" size={14} color={colors.success} />
          <Text style={styles.correctAnswerLabel}>Correct answer</Text>
        </View>
      )}
    </View>
  );
};

export const WebNamesMultipleChoice: React.FC<WebNamesMultipleChoiceProps> = ({ onBack }) => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [quizKey, setQuizKey] = useState(0);
  const [displayPercent, setDisplayPercent] = useState(0);

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

  useEffect(() => {
    if (!isFinished) return;
    const target = Math.round((score / TOTAL_QUESTIONS) * 100);
    let current = 0;
    const step = Math.max(1, Math.floor(target / 30));
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      setDisplayPercent(current);
      if (current >= target) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [isFinished, score]);

  useEffect(() => {
    injectConfettiStyles();
  }, []);

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

  const handleNext = useCallback(() => {
    if (questionIndex < TOTAL_QUESTIONS - 1) {
      setQuestionIndex((i) => i + 1);
      setSelectedIndex(null);
      setIsSubmitted(false);
      setFeedbackMessage('');
    } else {
      setIsFinished(true);
    }
  }, [questionIndex]);

  const handleRestart = useCallback(() => {
    setQuestionIndex(0);
    setSelectedIndex(null);
    setIsSubmitted(false);
    setScore(0);
    setIsFinished(false);
    setFeedbackMessage('');
    setDisplayPercent(0);
  }, []);

  const handleNewQuiz = useCallback(() => {
    handleRestart();
    setQuizKey((k) => k + 1);
  }, [handleRestart]);

  const wasCorrect = isSubmitted && selectedIndex !== null && currentQuestion
    && currentQuestion.options[selectedIndex].number === currentQuestion.correct.number;

  const backHover = useWebHover({
    hoverStyle: { backgroundColor: `${colors.primary}15` },
    transition: 'all 0.2s ease-out',
  });

  const submitHover = useWebHover({
    hoverStyle: { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(2,136,209,0.3)' },
    transition: 'all 0.2s ease-out',
  });

  const nextHover = useWebHover({
    hoverStyle: { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(27,67,50,0.3)' },
    transition: 'all 0.2s ease-out',
  });

  const newQuizHover = useWebHover({
    hoverStyle: { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(27,67,50,0.3)' },
    transition: 'all 0.2s ease-out',
  });

  const reviewHover = useWebHover({
    hoverStyle: { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(0,0,0,0.08)' },
    transition: 'all 0.2s ease-out',
  });

  if (dataQuery.isLoading || names.length < 4) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Preparing quiz...</Text>
        </View>
      </View>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / TOTAL_QUESTIONS) * 100);
    const showConfetti = percentage >= 90;
    const { title: tierTitle, icon: tierIcon, iconColor: tierIconColor } = getResultsConfig(percentage);
    const ringGradient = getScoreGradient(percentage);

    return (
      <View style={styles.container}>
        {showConfetti && <ConfettiOverlay />}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Score Ring */}
          <View
            style={[
              styles.scoreRingOuter,
              {
                // @ts-ignore
                animation: 'score-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s forwards',
                opacity: 0,
              },
            ]}
          >
            <LinearGradient
              colors={ringGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scoreRing}
            >
              <View style={styles.scoreInner}>
                <Text
                  style={[
                    styles.scorePercent,
                    { color: ringGradient[0] },
                    // @ts-ignore
                    displayPercent >= percentage && { animation: 'counter-pulse 0.3s ease-out' },
                  ]}
                >
                  {displayPercent}%
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Tier Badge */}
          <View
            style={[
              styles.tierBadge,
              {
                // @ts-ignore
                animation: 'fadeInUp 0.5s ease-out 0.6s forwards',
                opacity: 0,
              },
            ]}
          >
            <View style={[styles.tierIconCircle, { backgroundColor: tierIconColor + '20' }]}>
              <Ionicons name={tierIcon} size={32} color={tierIconColor} />
            </View>
            <Text style={styles.tierTitle}>{tierTitle}</Text>
            <Text style={styles.tierSubtitle}>
              You answered {score} out of {TOTAL_QUESTIONS} questions correctly
            </Text>
          </View>

          {/* Stats */}
          <View
            style={[
              styles.statsRow,
              {
                // @ts-ignore
                animation: 'stat-slide-up 0.4s ease-out 0.9s forwards',
                opacity: 0,
              },
            ]}
          >
            <View style={[styles.statCard, { borderTopColor: colors.success }]}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: colors.error }]}>
              <Ionicons name="close-circle" size={24} color={colors.error} />
              <Text style={styles.statValue}>{TOTAL_QUESTIONS - score}</Text>
              <Text style={styles.statLabel}>Incorrect</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: colors.info }]}>
              <Ionicons name="analytics" size={24} color={colors.info} />
              <Text style={styles.statValue}>{percentage}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>

          {/* Buttons */}
          <View
            style={[
              styles.resultsButtons,
              {
                // @ts-ignore
                animation: 'stat-slide-up 0.4s ease-out 1.2s forwards',
                opacity: 0,
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleNewQuiz}
              activeOpacity={0.8}
              // @ts-ignore
              onMouseEnter={newQuizHover.handlers.onMouseEnter}
              onMouseLeave={newQuizHover.handlers.onMouseLeave}
              style={[styles.primaryButton, newQuizHover.style]}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <Ionicons name="shuffle" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>New Quiz</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRestart}
              activeOpacity={0.8}
              // @ts-ignore
              onMouseEnter={reviewHover.handlers.onMouseEnter}
              onMouseLeave={reviewHover.handlers.onMouseLeave}
              style={[styles.outlineButton, reviewHover.style]}
            >
              <Ionicons name="refresh" size={18} color={colors.primary} />
              <Text style={styles.outlineButtonText}>Review Same Questions</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onBack} activeOpacity={0.8} style={styles.textButton}>
              <Text style={styles.textButtonText}>Back to Games</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
        <Text style={styles.headerTitle}>Multiple Choice</Text>
        <Text style={styles.scoreLabel}>Score: {score}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress */}
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>Question {questionIndex + 1} of {TOTAL_QUESTIONS}</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${((questionIndex + 1) / TOTAL_QUESTIONS) * 100}%`,
                // @ts-ignore
                transition: 'width 0.3s ease-out',
              },
            ]}
          />
        </View>

        {/* Question */}
        <View
          style={[
            styles.questionCard,
            {
              // @ts-ignore
              animation: 'fadeInUp 0.4s ease-out forwards',
            },
          ]}
        >
          <Text style={styles.questionLabel}>{promptLabel}</Text>
          <Text
            style={[
              styles.questionPrompt,
              currentQuestion.mode === 'arabic-to-english' && styles.questionArabic,
            ]}
          >
            {prompt}
          </Text>
          {currentQuestion.mode === 'arabic-to-english' && (
            <Text style={styles.questionTransliteration}>{currentQuestion.correct.transliteration}</Text>
          )}
        </View>

        {/* Options */}
        {currentQuestion.options.map((option, index) => {
          const display = currentQuestion.mode === 'arabic-to-english'
            ? option.translation
            : `${option.name}  —  ${option.transliteration}`;
          const isCorrectOption = option.number === currentQuestion.correct.number;

          return (
            <OptionButton
              key={`${quizKey}-${questionIndex}-${option.number}`}
              text={display}
              index={index}
              isSelected={index === selectedIndex}
              isSubmitted={isSubmitted}
              isCorrectOption={isCorrectOption}
              wasCorrect={!!wasCorrect}
              onPress={() => handleSelect(index)}
              disabled={isSubmitted}
            />
          );
        })}

        {/* Feedback */}
        {isSubmitted && wasCorrect && (
          <View style={styles.feedbackCorrect}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.feedbackCorrectText}>{feedbackMessage}</Text>
          </View>
        )}
        {isSubmitted && !wasCorrect && (
          <View style={styles.feedbackWrong}>
            <Ionicons name="close-circle" size={20} color={colors.error} />
            <Text style={styles.feedbackWrongText}>Not quite — review the correct answer above.</Text>
          </View>
        )}

        {/* Submit / Next */}
        {!isSubmitted && selectedIndex !== null && (
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.8}
            // @ts-ignore
            onMouseEnter={submitHover.handlers.onMouseEnter}
            onMouseLeave={submitHover.handlers.onMouseLeave}
            style={[styles.submitButton, submitHover.style]}
          >
            <Text style={styles.submitButtonText}>Submit Answer</Text>
          </TouchableOpacity>
        )}
        {isSubmitted && (
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.8}
            // @ts-ignore
            onMouseEnter={nextHover.handlers.onMouseEnter}
            onMouseLeave={nextHover.handlers.onMouseLeave}
            style={[styles.nextButton, nextHover.style]}
          >
            <Text style={styles.nextButtonText}>
              {questionIndex < TOTAL_QUESTIONS - 1 ? 'Next Question' : 'See Results'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // @ts-ignore
    maxWidth: 700,
    marginHorizontal: 'auto',
    width: '100%',
    padding: 32,
    position: 'relative',
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
  scrollView: {
    flex: 1,
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
  scoreLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  content: {
    paddingBottom: 40,
  },
  progressRow: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginBottom: 28,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    // @ts-ignore
    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  questionPrompt: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  questionArabic: {
    fontSize: 44,
    color: colors.primary,
    lineHeight: 60,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  questionTransliteration: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    // @ts-ignore
    cursor: 'pointer',
  },
  optionDefault: {
    backgroundColor: colors.background,
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
    fontSize: 15,
    flex: 1,
    marginRight: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
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
    marginLeft: 12,
    gap: 4,
  },
  correctAnswerLabel: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  feedbackCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.success,
  },
  feedbackCorrectText: {
    fontSize: 15,
    color: colors.success,
    fontWeight: '600',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  feedbackWrong: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.error,
  },
  feedbackWrongText: {
    fontSize: 15,
    color: colors.error,
    fontWeight: '500',
    flex: 1,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.info,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    // @ts-ignore
    cursor: 'pointer',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    gap: 8,
    // @ts-ignore
    cursor: 'pointer',
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  resultsContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  scoreRingOuter: {
    marginBottom: 28,
  },
  scoreRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  },
  scoreInner: {
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorePercent: {
    fontSize: 48,
    fontWeight: '800',
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  tierBadge: {
    alignItems: 'center',
    marginBottom: 28,
  },
  tierIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tierTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  tierSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 32,
    width: '100%',
    maxWidth: 480,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 3,
    gap: 6,
    // @ts-ignore
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  resultsButtons: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    // @ts-ignore
    cursor: 'pointer',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    gap: 8,
    marginBottom: 8,
    // @ts-ignore
    cursor: 'pointer',
  },
  outlineButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  textButton: {
    paddingVertical: 12,
    // @ts-ignore
    cursor: 'pointer',
  },
  textButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
});
