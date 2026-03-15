import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  FlatList,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type WuduStep = {
  order: number;
  name: string;
  nameArabic: string;
  bodyPart: string;
  action: string;
  tip?: string;
  repetitions: number;
  isFard: boolean;
  icon: keyof typeof Ionicons.glyphMap;
};

const WUDU_STEPS: WuduStep[] = [
  {
    order: 1,
    name: 'Intention (Niyyah)',
    nameArabic: 'النية',
    bodyPart: 'heart',
    action: 'Make intention in your heart for purification. Say "Bismillah" (In the name of Allah) before starting.',
    tip: 'The intention is made in the heart, not spoken aloud. Simply intend to purify yourself for worship.',
    repetitions: 1,
    isFard: false,
    icon: 'heart-outline',
  },
  {
    order: 2,
    name: 'Wash Hands',
    nameArabic: 'غسل اليدين',
    bodyPart: 'hands',
    action: 'Wash both hands up to the wrists, ensuring water reaches between the fingers. Start with the right hand.',
    tip: 'Make sure water flows over the entire hand including between all fingers.',
    repetitions: 3,
    isFard: false,
    icon: 'hand-left-outline',
  },
  {
    order: 3,
    name: 'Rinse Mouth',
    nameArabic: 'المضمضة',
    bodyPart: 'mouth',
    action: 'Take water with your right hand and rinse your mouth thoroughly, swirling water around.',
    tip: 'Swirl the water well to clean the entire mouth, then spit it out.',
    repetitions: 3,
    isFard: false,
    icon: 'water-outline',
  },
  {
    order: 4,
    name: 'Clean Nose',
    nameArabic: 'الاستنشاق',
    bodyPart: 'nose',
    action: 'Sniff water gently into your nose using your right hand, then blow it out using your left hand.',
    tip: 'Be gentle - you don\'t need to sniff water too far up. Just enough to cleanse the nostrils.',
    repetitions: 3,
    isFard: false,
    icon: 'remove-outline',
  },
  {
    order: 5,
    name: 'Wash Face',
    nameArabic: 'غسل الوجه',
    bodyPart: 'face',
    action: 'Wash the entire face from the forehead hairline to the chin, and from ear to ear.',
    tip: 'Make sure water reaches all parts of the face, including the eyebrows and any facial hair.',
    repetitions: 3,
    isFard: true,
    icon: 'happy-outline',
  },
  {
    order: 6,
    name: 'Wash Arms',
    nameArabic: 'غسل اليدين إلى المرفقين',
    bodyPart: 'arms',
    action: 'Wash from fingertips up to and including the elbows. Start with the right arm, then the left.',
    tip: 'Ensure water covers the entire arm including the elbow. Rotate your arm to get all sides.',
    repetitions: 3,
    isFard: true,
    icon: 'fitness-outline',
  },
  {
    order: 7,
    name: 'Wipe Head',
    nameArabic: 'مسح الرأس',
    bodyPart: 'head',
    action: 'Wet your hands and wipe over your head from the forehead to the back of the head, then return to the front.',
    tip: 'Use both hands together, starting at the hairline. One continuous motion back and forth.',
    repetitions: 1,
    isFard: true,
    icon: 'person-outline',
  },
  {
    order: 8,
    name: 'Clean Ears',
    nameArabic: 'مسح الأذنين',
    bodyPart: 'ears',
    action: 'Wipe the inside of your ears with your index fingers and behind the ears with your thumbs.',
    tip: 'Use the same water from wiping the head - no need to wet your hands again.',
    repetitions: 1,
    isFard: false,
    icon: 'ear-outline',
  },
  {
    order: 9,
    name: 'Wash Feet',
    nameArabic: 'غسل القدمين',
    bodyPart: 'feet',
    action: 'Wash both feet up to and including the ankles. Ensure water reaches between the toes. Start with the right foot.',
    tip: 'Use your little finger to clean between your toes. Make sure to wash the heels and ankles.',
    repetitions: 3,
    isFard: true,
    icon: 'footsteps-outline',
  },
];

const CLOSING_DUA = {
  arabic: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
  transliteration: 'Ash-hadu an la ilaha illallahu wahdahu la sharika lah, wa ash-hadu anna Muhammadan abduhu wa rasuluh',
  translation: 'I bear witness that there is no god but Allah alone, with no partner, and I bear witness that Muhammad is His servant and messenger.',
};

type StepItemProps = {
  step: WuduStep;
  isLast: boolean;
};

const StepItem: React.FC<StepItemProps> = ({ step, isLast }) => {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const itemHeight = SCREEN_HEIGHT - insets.top - insets.bottom - 100;

  return (
    <View style={[styles.stepContainer, { height: itemHeight, width: SCREEN_WIDTH }]}>
      <View style={styles.stepContent}>
        {/* Step header */}
        <View style={styles.stepHeader}>
          <View style={[styles.stepIconContainer, step.isFard && styles.stepIconFard]}>
            <Ionicons name={step.icon} size={48} color={step.isFard ? colors.primary : colors.accent} />
          </View>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              {step.isFard ? 'Required (Fard)' : 'Sunnah'}
            </Text>
          </View>
        </View>

        {/* Step number and name */}
        <View style={styles.stepNameContainer}>
          <View style={styles.stepNumberBadge}>
            <Text style={styles.stepNumberText}>{step.order}</Text>
          </View>
          <View style={styles.stepTitles}>
            <Text style={styles.stepName}>{step.name}</Text>
            <Text style={styles.stepNameArabic}>{step.nameArabic}</Text>
          </View>
        </View>

        {/* Action instruction */}
        <View style={styles.actionContainer}>
          <Text style={styles.actionText}>{step.action}</Text>
        </View>

        {/* Repetitions */}
        <View style={styles.repetitionsContainer}>
          <Ionicons name="repeat-outline" size={20} color={colors.primary} />
          <Text style={styles.repetitionsText}>
            {step.repetitions === 1 ? 'Once' : `${step.repetitions} times`}
          </Text>
        </View>

        {/* Tip */}
        {step.tip && (
          <View style={styles.tipContainer}>
            <Ionicons name="bulb-outline" size={20} color={colors.accent} />
            <Text style={styles.tipText}>{step.tip}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const ClosingDuaItem: React.FC = () => {
  const insets = useSafeAreaInsets();
  const itemHeight = SCREEN_HEIGHT - insets.top - insets.bottom - 100;

  return (
    <View style={[styles.stepContainer, { height: itemHeight, width: SCREEN_WIDTH }]}>
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <View style={[styles.stepIconContainer, styles.duaIconContainer]}>
            <Ionicons name="sparkles-outline" size={48} color={colors.primary} />
          </View>
          <View style={styles.completeBadge}>
            <Text style={styles.completeBadgeText}>Wudu Complete!</Text>
          </View>
        </View>

        <Text style={styles.duaTitle}>Closing Dua</Text>
        <Text style={styles.duaSubtitle}>Say this after completing wudu:</Text>

        <View style={styles.duaArabicContainer}>
          <Text style={styles.duaArabic}>{CLOSING_DUA.arabic}</Text>
        </View>

        <View style={styles.duaTransliterationContainer}>
          <Text style={styles.duaLabel}>Transliteration:</Text>
          <Text style={styles.duaTransliteration}>{CLOSING_DUA.transliteration}</Text>
        </View>

        <View style={styles.duaTranslationContainer}>
          <Text style={styles.duaLabel}>Translation:</Text>
          <Text style={styles.duaTranslation}>{CLOSING_DUA.translation}</Text>
        </View>
      </View>
    </View>
  );
};

export const WuduGuideScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalItems = WUDU_STEPS.length + 1; // Steps + closing dua

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const scrollToNext = () => {
    if (currentIndex < totalItems - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const scrollToPrev = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
    }
  };

  const itemHeight = SCREEN_HEIGHT - insets.top - insets.bottom - 100;

  const renderItem = ({ item, index }: { item: WuduStep | 'dua'; index: number }) => {
    if (item === 'dua') {
      return <ClosingDuaItem />;
    }
    return <StepItem step={item} isLast={index === WUDU_STEPS.length - 1} />;
  };

  const data: (WuduStep | 'dua')[] = [...WUDU_STEPS, 'dua'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wudu Guide</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        {Array.from({ length: totalItems }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentIndex && styles.progressDotActive,
              index < currentIndex && styles.progressDotCompleted,
            ]}
          />
        ))}
      </View>

      {/* Step counter */}
      <View style={styles.stepCounterContainer}>
        <Text style={styles.stepCounterText}>
          {currentIndex < WUDU_STEPS.length
            ? `Step ${currentIndex + 1} of ${WUDU_STEPS.length}`
            : 'Complete'}
        </Text>
      </View>

      {/* Swipeable content */}
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) => (item === 'dua' ? 'dua' : `step-${item.order}`)}
        pagingEnabled
        horizontal={false}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        bounces={false}
      />

      {/* Navigation buttons */}
      <View style={[styles.navButtonsContainer, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity
          onPress={scrollToPrev}
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          disabled={currentIndex === 0}
        >
          <Ionicons
            name="chevron-up"
            size={28}
            color={currentIndex === 0 ? colors.text.tertiary : colors.primary}
          />
          <Text style={[styles.navButtonText, currentIndex === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        <View style={styles.swipeHint}>
          <Ionicons name="swap-vertical-outline" size={16} color={colors.text.tertiary} />
          <Text style={styles.swipeHintText}>Swipe to navigate</Text>
        </View>

        <TouchableOpacity
          onPress={scrollToNext}
          style={[styles.navButton, currentIndex === totalItems - 1 && styles.navButtonDisabled]}
          disabled={currentIndex === totalItems - 1}
        >
          <Ionicons
            name="chevron-down"
            size={28}
            color={currentIndex === totalItems - 1 ? colors.text.tertiary : colors.primary}
          />
          <Text style={[styles.navButtonText, currentIndex === totalItems - 1 && styles.navButtonTextDisabled]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: 6,
    backgroundColor: colors.background,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  progressDotCompleted: {
    backgroundColor: colors.primaryLight,
  },
  stepCounterContainer: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  stepCounterText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  stepContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  stepContent: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  stepIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${colors.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  stepIconFard: {
    backgroundColor: `${colors.primary}15`,
  },
  duaIconContainer: {
    backgroundColor: `${colors.primary}15`,
  },
  stepBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
  },
  stepBadgeText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  completeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    backgroundColor: `${colors.success}20`,
  },
  completeBadgeText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
  },
  stepNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  stepNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    ...typography.body,
    color: colors.text.white,
    fontWeight: '700',
  },
  stepTitles: {
    flex: 1,
  },
  stepName: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: 2,
  },
  stepNameArabic: {
    fontSize: 18,
    color: colors.text.secondary,
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : undefined,
  },
  actionContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  actionText: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 26,
  },
  repetitionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  repetitionsText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: `${colors.accent}10`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  tipText: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 22,
  },
  duaTitle: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  duaSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  duaArabicContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  duaArabic: {
    fontSize: 22,
    color: colors.text.primary,
    textAlign: 'right',
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : undefined,
    lineHeight: 40,
  },
  duaTransliterationContainer: {
    marginBottom: spacing.md,
  },
  duaLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  duaTransliteration: {
    ...typography.body,
    color: colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  duaTranslationContainer: {
    marginBottom: spacing.md,
  },
  duaTranslation: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  navButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navButton: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: colors.text.tertiary,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  swipeHintText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
});
