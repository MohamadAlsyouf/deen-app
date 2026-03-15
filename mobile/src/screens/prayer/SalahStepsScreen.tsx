import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  FlatList,
  ViewToken,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
import type { Prayer, PrayerStep } from '@/types/prayer';
import type { RootStackParamList } from '@/navigation/AppNavigator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Position icons mapping
const positionIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  standing: 'person-outline',
  bowing: 'arrow-down-outline',
  prostrating: 'chevron-down-circle-outline',
  sitting: 'tablet-landscape-outline',
  turning: 'sync-outline',
};

// Prayer gradient colors
const prayerGradients: Record<string, [string, string]> = {
  fajr: ['#667eea', '#764ba2'],
  dhuhr: ['#f093fb', '#f5576c'],
  asr: ['#4facfe', '#00f2fe'],
  maghrib: ['#fa709a', '#fee140'],
  isha: ['#30cfd0', '#330867'],
};

// Steps to filter out (opening supplication and supplication before tasleem)
const STEPS_TO_FILTER = [
  'opening supplication',
  'opening dua',
  'dua al-istiftah',
  'supplication before tasleem',
  'dua before tasleem',
  'supplication before salam',
];

// Steps that need special notes
const shouldAddSunnahNote = (stepName: string): boolean => {
  const lowerName = stepName.toLowerCase();
  return lowerName.includes('additional surah') ||
         lowerName.includes('recite another surah') ||
         lowerName.includes('surah after fatiha');
};

const shouldAddProstrationNote = (stepName: string): boolean => {
  const lowerName = stepName.toLowerCase();
  return lowerName.includes('prostration') || lowerName.includes('sujud');
};

const SUNNAH_SURAH_NOTE = 'This is Sunnah (recommended) and optional. You may recite only Al-Fatiha and your prayer is still valid. Reciting an additional Surah is highly rewarded but not obligatory.';

const PROSTRATION_NOTE = 'This is the closest a servant can be to Allah. This is the perfect time to make dua (supplication) and ask Allah for literally anything - healing for yourself or others, guidance, knowledge, wealth, forgiveness, or anything your heart desires. Pour your heart out to Allah in this blessed position.';

type StepItemProps = {
  step: PrayerStep;
  accentColor: string;
  isLast: boolean;
  prayerName: string;
};

const StepItem: React.FC<StepItemProps> = ({ step, accentColor, isLast, prayerName }) => {
  const insets = useSafeAreaInsets();
  const itemHeight = SCREEN_HEIGHT - insets.top - insets.bottom - 120;

  // Determine if we need to add special notes
  const hasSunnahNote = shouldAddSunnahNote(step.name);
  const hasProstrationNote = shouldAddProstrationNote(step.name);

  // Combine notes
  let displayNote = step.note || '';
  if (hasSunnahNote) {
    displayNote = SUNNAH_SURAH_NOTE;
  }
  if (hasProstrationNote) {
    displayNote = displayNote
      ? `${displayNote}\n\n${PROSTRATION_NOTE}`
      : PROSTRATION_NOTE;
  }

  return (
    <View style={[styles.stepContainer, { height: itemHeight, width: SCREEN_WIDTH }]}>
      <ScrollView
        style={styles.stepScrollView}
        contentContainerStyle={styles.stepScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step header with position icon */}
        <View style={styles.stepHeader}>
          <View style={[styles.positionIconContainer, { backgroundColor: `${accentColor}15` }]}>
            <Ionicons
              name={positionIcons[step.position] || 'person-outline'}
              size={40}
              color={accentColor}
            />
          </View>
          <View style={[styles.positionBadge, { backgroundColor: `${accentColor}20` }]}>
            <Text style={[styles.positionBadgeText, { color: accentColor }]}>
              {step.position.charAt(0).toUpperCase() + step.position.slice(1)}
            </Text>
          </View>
        </View>

        {/* Step number and name */}
        <View style={styles.stepNameContainer}>
          <View style={[styles.stepNumberBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.stepNumberText}>{step.order}</Text>
          </View>
          <View style={styles.stepTitles}>
            <Text style={styles.stepName}>{step.name}</Text>
            <Text style={styles.stepNameArabic}>{step.nameArabic}</Text>
          </View>
        </View>

        {/* Instruction */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>{step.instruction}</Text>
        </View>

        {/* Arabic text if available */}
        {step.arabicText && (
          <View style={[styles.arabicContainer, { borderLeftColor: accentColor }]}>
            <Text style={styles.arabicText}>{step.arabicText}</Text>
          </View>
        )}

        {/* Transliteration */}
        {step.transliteration && (
          <View style={styles.transliterationContainer}>
            <Text style={styles.labelText}>Transliteration:</Text>
            <Text style={styles.transliteration}>{step.transliteration}</Text>
          </View>
        )}

        {/* Translation */}
        {step.translation && (
          <View style={styles.translationContainer}>
            <Text style={styles.labelText}>Translation:</Text>
            <Text style={styles.translation}>{step.translation}</Text>
          </View>
        )}

        {/* Repetitions */}
        {step.repetitions && (
          <View style={styles.repetitionsContainer}>
            <Ionicons name="repeat-outline" size={18} color={accentColor} />
            <Text style={[styles.repetitionsText, { color: accentColor }]}>
              Repeat {step.repetitions} times
            </Text>
          </View>
        )}

        {/* Note or special notes */}
        {displayNote && (
          <View style={[styles.noteContainer, { backgroundColor: `${accentColor}10` }]}>
            <Ionicons
              name={hasProstrationNote ? 'heart' : hasSunnahNote ? 'information-circle' : 'information-circle-outline'}
              size={18}
              color={hasProstrationNote ? colors.error : accentColor}
            />
            <Text style={[styles.noteText, hasProstrationNote && styles.noteTextHighlight]}>
              {displayNote}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

type CompletionItemProps = {
  prayerName: string;
  accentColor: string;
  onGoBack: () => void;
};

const CompletionItem: React.FC<CompletionItemProps> = ({ prayerName, accentColor, onGoBack }) => {
  const insets = useSafeAreaInsets();
  const itemHeight = SCREEN_HEIGHT - insets.top - insets.bottom - 120;

  return (
    <View style={[styles.stepContainer, { height: itemHeight, width: SCREEN_WIDTH }]}>
      <View style={styles.completionContent}>
        <View style={[styles.completionIconContainer, { backgroundColor: `${accentColor}15` }]}>
          <Ionicons name="checkmark-circle" size={64} color={accentColor} />
        </View>

        <Text style={styles.completionTitle}>Masha'Allah!</Text>
        <Text style={styles.completionSubtitle}>
          You've completed the {prayerName} prayer guide
        </Text>

        <View style={styles.completionCard}>
          <Ionicons name="sparkles-outline" size={24} color={colors.accent} />
          <Text style={styles.completionCardText}>
            After completing your prayer, it's Sunnah to make dhikr (remembrance of Allah) such as saying SubhanAllah, Alhamdulillah, and Allahu Akbar 33 times each.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.completionButton, { backgroundColor: accentColor }]}
          onPress={onGoBack}
        >
          <Text style={styles.completionButtonText}>Return to Prayer Guide</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.text.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const SalahStepsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'SalahSteps'>>();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const prayer = route.params?.prayer;

  // Filter out unwanted steps
  const filteredSteps = useMemo(() => {
    if (!prayer?.steps) return [];
    return prayer.steps.filter(step => {
      const lowerName = step.name.toLowerCase();
      return !STEPS_TO_FILTER.some(filter => lowerName.includes(filter));
    });
  }, [prayer?.steps]);

  const totalItems = filteredSteps.length + 1; // Steps + completion screen
  const accentColor = prayerGradients[prayer?.id || 'fajr']?.[0] || colors.primary;

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

  const handleGoBack = () => {
    navigation.goBack();
  };

  const itemHeight = SCREEN_HEIGHT - insets.top - insets.bottom - 120;

  if (!prayer) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prayer Guide</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No prayer data available</Text>
        </View>
      </View>
    );
  }

  const renderItem = ({ item, index }: { item: PrayerStep | 'completion'; index: number }) => {
    if (item === 'completion') {
      return (
        <CompletionItem
          prayerName={prayer.name}
          accentColor={accentColor}
          onGoBack={handleGoBack}
        />
      );
    }
    return (
      <StepItem
        step={item}
        accentColor={accentColor}
        isLast={index === filteredSteps.length - 1}
        prayerName={prayer.name}
      />
    );
  };

  const data: (PrayerStep | 'completion')[] = [...filteredSteps, 'completion'];

  // Calculate progress percentage
  const progressPercent = ((currentIndex + 1) / totalItems) * 100;

  return (
    <View style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient
        colors={prayerGradients[prayer.id] || [colors.primary, colors.primaryLight]}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitleWhite}>{prayer.name} Prayer</Text>
          <Text style={styles.headerSubtitle}>{prayer.rakaat} Rakaat</Text>
        </View>
        <View style={styles.headerRight} />
      </LinearGradient>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercent}%`, backgroundColor: accentColor }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentIndex < filteredSteps.length
            ? `Step ${currentIndex + 1} of ${filteredSteps.length}`
            : 'Complete'}
        </Text>
      </View>

      {/* Swipeable content */}
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) => (item === 'completion' ? 'completion' : `step-${index}`)}
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
      <View style={[styles.navButtonsContainer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TouchableOpacity
          onPress={scrollToPrev}
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          disabled={currentIndex === 0}
        >
          <Ionicons
            name="chevron-up"
            size={24}
            color={currentIndex === 0 ? colors.text.tertiary : accentColor}
          />
          <Text style={[styles.navButtonText, { color: currentIndex === 0 ? colors.text.tertiary : accentColor }]}>
            Previous
          </Text>
        </TouchableOpacity>

        <View style={styles.swipeHint}>
          <Ionicons name="swap-vertical-outline" size={14} color={colors.text.tertiary} />
          <Text style={styles.swipeHintText}>Swipe</Text>
        </View>

        <TouchableOpacity
          onPress={scrollToNext}
          style={[styles.navButton, currentIndex === totalItems - 1 && styles.navButtonDisabled]}
          disabled={currentIndex === totalItems - 1}
        >
          <Ionicons
            name="chevron-down"
            size={24}
            color={currentIndex === totalItems - 1 ? colors.text.tertiary : accentColor}
          />
          <Text style={[styles.navButtonText, { color: currentIndex === totalItems - 1 ? colors.text.tertiary : accentColor }]}>
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
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  headerTitleWhite: {
    ...typography.h3,
    color: colors.text.white,
  },
  headerSubtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
  },
  headerRight: {
    width: 40,
  },
  progressBarContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  stepContainer: {
    paddingHorizontal: spacing.lg,
  },
  stepScrollView: {
    flex: 1,
  },
  stepScrollContent: {
    paddingVertical: spacing.lg,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  positionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  positionBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
  },
  positionBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: 2,
  },
  stepNameArabic: {
    fontSize: 16,
    color: colors.text.secondary,
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : undefined,
  },
  instructionContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  instructionText: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 24,
  },
  arabicContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
  },
  arabicText: {
    fontSize: 20,
    color: colors.text.primary,
    textAlign: 'right',
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : undefined,
    lineHeight: 36,
  },
  transliterationContainer: {
    marginBottom: spacing.sm,
  },
  labelText: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transliteration: {
    ...typography.body,
    color: colors.text.primary,
    fontStyle: 'italic',
  },
  translationContainer: {
    marginBottom: spacing.md,
  },
  translation: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  repetitionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  repetitionsText: {
    ...typography.caption,
    fontWeight: '600',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  noteText: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 22,
    fontSize: 14,
  },
  noteTextHighlight: {
    color: colors.text.primary,
  },
  completionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  completionIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  completionTitle: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  completionSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  completionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  completionCardText: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 22,
  },
  completionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  completionButtonText: {
    ...typography.body,
    color: colors.text.white,
    fontWeight: '600',
  },
  navButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navButton: {
    alignItems: 'center',
    padding: spacing.xs,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  swipeHintText: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 11,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
