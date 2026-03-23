import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography } from '@/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Decorative star positions
const STARS = [
  { top: '8%', left: '10%', size: 3, delay: 0 },
  { top: '12%', right: '15%', size: 4, delay: 100 },
  { top: '18%', left: '25%', size: 2, delay: 200 },
  { top: '15%', right: '30%', size: 3, delay: 150 },
  { top: '22%', left: '8%', size: 2, delay: 250 },
  { top: '25%', right: '12%', size: 4, delay: 50 },
  { top: '10%', left: '45%', size: 3, delay: 300 },
  { top: '28%', right: '40%', size: 2, delay: 180 },
  { top: '6%', right: '25%', size: 3, delay: 220 },
  { top: '20%', left: '35%', size: 2, delay: 280 },
];

// Rewards messages
const REWARDS_MESSAGES = [
  "Every letter of the Quran you recite earns you ten rewards. And Allah multiplies the reward for whom He wills.",
  "The Prophet (PBUH) said: 'The best among you are those who learn the Quran and teach it.'",
  "Reading and reflecting upon the Quran brings light to your heart and peace to your soul.",
  "The Quran will intercede for its companions on the Day of Judgment.",
  "Each verse you read is a step closer to Jannah, and a shield from the trials of this world.",
];

type ChapterCompletionOverlayProps = {
  visible: boolean;
  chapterName: string;
  chapterArabicName?: string;
  mode: 'listen' | 'read';
  onDismiss: () => void;
  onNextChapter?: () => void;
  hasNextChapter?: boolean;
};

export const ChapterCompletionOverlay: React.FC<ChapterCompletionOverlayProps> = ({
  visible,
  chapterName,
  chapterArabicName,
  mode,
  onDismiss,
  onNextChapter,
  hasNextChapter = true,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const starAnims = useRef(STARS.map(() => new Animated.Value(0))).current;
  const moonAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  // Get a random reward message
  const rewardMessage = useRef(
    REWARDS_MESSAGES[Math.floor(Math.random() * REWARDS_MESSAGES.length)]
  ).current;

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Additional celebratory haptics
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, 300);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 500);
      }

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate moon
      Animated.timing(moonAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }).start();

      // Animate content
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      }).start();

      // Animate stars with staggered delays
      starAnims.forEach((anim, index) => {
        Animated.sequence([
          Animated.delay(STARS[index].delay + 300),
          Animated.spring(anim, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      moonAnim.setValue(0);
      contentAnim.setValue(0);
      starAnims.forEach((anim) => anim.setValue(0));
    }
  }, [visible, fadeAnim, scaleAnim, moonAnim, contentAnim, starAnims]);

  const handleDismiss = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handleNextChapter = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onNextChapter?.();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <LinearGradient
        colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative Stars */}
        {STARS.map((star, index) => (
          <Animated.View
            key={index}
            style={[
              styles.star,
              {
                top: star.top as any,
                left: star.left as any,
                right: star.right as any,
                width: star.size * 2,
                height: star.size * 2,
                borderRadius: star.size,
                opacity: starAnims[index],
                transform: [
                  {
                    scale: starAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}

        {/* Crescent Moon */}
        <Animated.View
          style={[
            styles.moonContainer,
            {
              opacity: moonAnim,
              transform: [
                {
                  translateY: moonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.moon}>
            <View style={styles.moonCrescent} />
          </View>
        </Animated.View>

        {/* Main Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentAnim,
              transform: [
                {
                  scale: scaleAnim,
                },
                {
                  translateY: contentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Celebration Icon */}
          <View style={styles.celebrationIcon}>
            <Ionicons name="checkmark-circle" size={80} color={colors.accent} />
          </View>

          {/* Congratulations Text */}
          <Text style={styles.congratsText}>Masha'Allah!</Text>
          <Text style={styles.completedText}>
            You have completed {mode === 'listen' ? 'listening to' : 'reading'}
          </Text>

          {/* Chapter Name */}
          <View style={styles.chapterInfo}>
            {chapterArabicName && (
              <Text style={styles.chapterArabic}>{chapterArabicName}</Text>
            )}
            <Text style={styles.chapterName}>Surah {chapterName}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Rewards Message */}
          <View style={styles.rewardsContainer}>
            <Ionicons name="sparkles" size={24} color={colors.accent} />
            <Text style={styles.rewardsText}>{rewardMessage}</Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {hasNextChapter && onNextChapter && (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNextChapter}
                activeOpacity={0.8}
              >
                <Text style={styles.nextButtonText}>Next Chapter</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
              activeOpacity={0.8}
            >
              <Text style={styles.dismissButtonText}>
                {hasNextChapter ? 'Back to Chapters' : 'Done'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  star: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  moonContainer: {
    position: 'absolute',
    top: '5%',
    right: '10%',
  },
  moon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    overflow: 'hidden',
  },
  moonCrescent: {
    position: 'absolute',
    top: -10,
    left: 15,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.gradient.start,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  celebrationIcon: {
    marginBottom: spacing.lg,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  congratsText: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text.white,
    textAlign: 'center',
    marginBottom: spacing.xs,
    // @ts-ignore
    fontFamily: Platform.OS === 'web' ? "'Cormorant Garamond', Georgia, serif" : undefined,
  },
  completedText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  chapterInfo: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  chapterArabic: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.text.white,
    marginBottom: spacing.xs,
  },
  chapterName: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
    marginBottom: spacing.lg,
  },
  rewardsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  rewardsText: {
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  buttonsContainer: {
    width: '100%',
    gap: spacing.md,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    gap: spacing.sm,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  dismissButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.white,
  },
});
