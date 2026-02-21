import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
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

export const AsmaUlHusnaMultipleChoiceScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const dataQuery = useQuery({
    queryKey: ['asmaUlHusna'],
    queryFn: () => asmaUlHusnaService.getData(),
  });

  const names = dataQuery.data?.names ?? [];

  const questions = useMemo(() => {
    if (names.length < 4) return [];
    return generateQuestions(names, TOTAL_QUESTIONS);
  }, [names]);

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
  }, []);

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
    return (
      <View style={styles.container}>
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <Header
            title="Results"
            leftAction={{ iconName: 'arrow-back', onPress: () => navigation.goBack() }}
          />
        </View>
        <View style={styles.resultsContainer}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scorePercent}>{percentage}%</Text>
          </View>
          <Text style={styles.resultsTitle}>
            {percentage >= 80 ? 'Excellent!' : percentage >= 50 ? 'Good effort!' : 'Keep practicing!'}
          </Text>
          <Text style={styles.resultsSubtitle}>
            You answered {score} out of {TOTAL_QUESTIONS} questions correctly.
          </Text>
          <TouchableOpacity style={styles.restartButton} onPress={handleRestart} activeOpacity={0.8}>
            <Ionicons name="refresh" size={20} color={colors.text.white} />
            <Text style={styles.restartButtonText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.backButtonText}>Back to Games</Text>
          </TouchableOpacity>
        </View>
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
        </View>

        {/* Options */}
        {currentQuestion.options.map((option, index) => {
          const display = currentQuestion.mode === 'arabic-to-english'
            ? option.translation
            : `${option.name}  —  ${option.transliteration}`;

          const isCorrectOption = option.number === currentQuestion.correct.number;
          const isSelectedWrong = isSubmitted && index === selectedIndex && !isCorrectOption;

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
              </TouchableOpacity>

              {/* "Correct answer" label shown when user got it wrong */}
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
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  scoreCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  scorePercent: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  resultsTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  resultsSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.md,
    width: '100%',
  },
  restartButtonText: {
    ...typography.button,
    color: colors.text.white,
  },
  backButton: {
    paddingVertical: spacing.md,
  },
  backButtonText: {
    ...typography.button,
    color: colors.primary,
  },
});
