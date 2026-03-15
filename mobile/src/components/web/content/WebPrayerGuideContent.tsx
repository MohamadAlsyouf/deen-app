/**
 * WebPrayerGuideContent - Prayer Guide content for web
 * Beautiful step-by-step guide to the 5 daily prayers
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { prayerService } from '@/services/prayerService';
import { useWebHover } from '@/hooks/useWebHover';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getCompletePrayerSteps } from '@/data/prayerStepsGenerator';
import type { Prayer, PrayerStep } from '@/types/prayer';

// Helper to detect special notes in step names
const isProstrationStep = (stepName: string): boolean => {
  const lowerName = stepName.toLowerCase();
  return lowerName.includes('prostration') || lowerName.includes('sujud');
};

const isSunnahSurahStep = (stepName: string): boolean => {
  const lowerName = stepName.toLowerCase();
  return lowerName.includes('additional surah');
};

// Prayer gradient colors - matching mobile
const prayerGradients: Record<string, [string, string]> = {
  fajr: ['#667eea', '#764ba2'],
  dhuhr: ['#f093fb', '#f5576c'],
  asr: ['#4facfe', '#00f2fe'],
  maghrib: ['#fa709a', '#fee140'],
  isha: ['#30cfd0', '#330867'],
};

// Prayer time icons
const prayerIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  fajr: 'sunny-outline',
  dhuhr: 'sunny',
  asr: 'partly-sunny-outline',
  maghrib: 'cloudy-night-outline',
  isha: 'moon-outline',
};

// Position icons
const positionIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  standing: 'person-outline',
  bowing: 'arrow-down-outline',
  prostrating: 'chevron-down-circle-outline',
  sitting: 'tablet-landscape-outline',
  turning: 'sync-outline',
};

// Wudu steps data
const WUDU_STEPS = [
  { order: 1, name: 'Intention (Niyyah)', nameArabic: 'النية', action: 'Make intention in your heart. Say "Bismillah" before starting.', repetitions: 1, isFard: false, icon: 'heart-outline' as const },
  { order: 2, name: 'Wash Hands', nameArabic: 'غسل اليدين', action: 'Wash both hands up to the wrists, ensuring water reaches between fingers. Start with right.', repetitions: 3, isFard: false, icon: 'hand-left-outline' as const },
  { order: 3, name: 'Rinse Mouth', nameArabic: 'المضمضة', action: 'Take water with right hand and rinse mouth thoroughly.', repetitions: 3, isFard: false, icon: 'water-outline' as const },
  { order: 4, name: 'Clean Nose', nameArabic: 'الاستنشاق', action: 'Sniff water gently into nose using right hand, blow out with left.', repetitions: 3, isFard: false, icon: 'remove-outline' as const },
  { order: 5, name: 'Wash Face', nameArabic: 'غسل الوجه', action: 'Wash entire face from forehead to chin, ear to ear.', repetitions: 3, isFard: true, icon: 'happy-outline' as const },
  { order: 6, name: 'Wash Arms', nameArabic: 'غسل اليدين إلى المرفقين', action: 'Wash from fingertips to elbows (including elbows). Start with right.', repetitions: 3, isFard: true, icon: 'fitness-outline' as const },
  { order: 7, name: 'Wipe Head', nameArabic: 'مسح الرأس', action: 'Wet hands and wipe over head from forehead to back, then return.', repetitions: 1, isFard: true, icon: 'person-outline' as const },
  { order: 8, name: 'Clean Ears', nameArabic: 'مسح الأذنين', action: 'Wipe inside of ears with index fingers and behind with thumbs.', repetitions: 1, isFard: false, icon: 'ear-outline' as const },
  { order: 9, name: 'Wash Feet', nameArabic: 'غسل القدمين', action: 'Wash feet up to and including ankles. Ensure water reaches between toes. Start with right.', repetitions: 3, isFard: true, icon: 'footsteps-outline' as const },
];

const CLOSING_DUA = {
  arabic: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
  transliteration: 'Ash-hadu an la ilaha illallahu wahdahu la sharika lah, wa ash-hadu anna Muhammadan abduhu wa rasuluh',
  translation: 'I bear witness that there is no god but Allah alone, with no partner, and I bear witness that Muhammad is His servant and messenger.',
};

interface PrayerCardProps {
  prayer: Prayer;
  onPress: () => void;
  index: number;
}

const PrayerCard: React.FC<PrayerCardProps> = ({ prayer, onPress, index }) => {
  const hover = useWebHover({
    hoverStyle: {
      transform: 'translateY(-8px) scale(1.02)',
      boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
    },
    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  const gradient = prayerGradients[prayer.id] || [colors.primary, colors.primaryLight];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.95}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[
        styles.prayerCard,
        hover.style,
        {
          animationName: 'fadeInUp',
          animationDuration: '0.6s',
          animationTimingFunction: 'ease-out',
          animationFillMode: 'forwards',
          animationDelay: `${index * 0.1}s`,
          opacity: 0,
        },
      ]}
    >
      <LinearGradient
        colors={gradient}
        style={styles.prayerCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.prayerCardInner}>
          {/* Icon */}
          <View style={styles.prayerIconWrap}>
            <Ionicons
              name={prayerIcons[prayer.id] || 'time-outline'}
              size={36}
              color="rgba(255,255,255,0.95)"
            />
          </View>

          {/* Info */}
          <View style={styles.prayerCardInfo}>
            <Text style={styles.prayerArabicName}>{prayer.nameArabic}</Text>
            <Text style={styles.prayerEnglishName}>{prayer.name} Prayer</Text>
            <Text style={styles.prayerTime}>{prayer.time}</Text>
          </View>

          {/* Stats */}
          <View style={styles.prayerStats}>
            <View style={styles.rakaatBadge}>
              <Text style={styles.rakaatNumber}>{prayer.rakaat}</Text>
              <Text style={styles.rakaatLabel}>RAKAAT</Text>
            </View>
          </View>
        </View>

        {/* Description preview */}
        <Text style={styles.prayerDescription} numberOfLines={2}>
          {prayer.description}
        </Text>

        {/* Footer */}
        <View style={styles.prayerCardFooter}>
          <Text style={styles.learnMore}>Learn how to pray</Text>
          <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.9)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

interface StepCardProps {
  step: PrayerStep;
  index: number;
  totalSteps: number;
  accentColor: string;
}

const StepCard: React.FC<StepCardProps> = ({ step, index, totalSteps, accentColor }) => {
  const [expanded, setExpanded] = useState(index === 0); // First step expanded by default
  const hover = useWebHover({
    hoverStyle: {
      transform: 'translateX(8px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    },
    transition: 'all 0.25s ease-out',
  });

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.95}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[
        styles.stepCard,
        hover.style,
        {
          animationName: 'slideInLeft',
          animationDuration: '0.4s',
          animationTimingFunction: 'ease-out',
          animationFillMode: 'forwards',
          animationDelay: `${index * 0.05}s`,
          opacity: 0,
        },
      ]}
    >
      {/* Step indicator line */}
      <View style={styles.stepIndicatorColumn}>
        <View style={[styles.stepCircle, { backgroundColor: accentColor }]}>
          <Text style={styles.stepCircleText}>{step.order}</Text>
        </View>
        {index < totalSteps - 1 && (
          <View style={[styles.stepConnector, { backgroundColor: `${accentColor}30` }]} />
        )}
      </View>

      {/* Content */}
      <View style={[styles.stepCardContent, expanded && styles.stepCardContentExpanded]}>
        {/* Header */}
        <View style={styles.stepHeader}>
          <View style={styles.stepHeaderLeft}>
            <View style={[styles.positionBadge, { backgroundColor: `${accentColor}15` }]}>
              <Ionicons
                name={positionIcons[step.position] || 'person-outline'}
                size={20}
                color={accentColor}
              />
            </View>
            <View style={styles.stepTitles}>
              <Text style={styles.stepName}>{step.name}</Text>
              <Text style={styles.stepArabicName}>{step.nameArabic}</Text>
            </View>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.text.secondary}
          />
        </View>

        {/* Instruction - always visible */}
        <Text style={styles.stepInstruction}>{step.instruction}</Text>

        {/* Expanded details */}
        {expanded && step.arabicText && (
          <View style={styles.expandedDetails}>
            {/* Arabic text box */}
            <View style={[styles.arabicBox, { borderLeftColor: accentColor }]}>
              <Text style={styles.arabicText}>{step.arabicText}</Text>
            </View>

            {/* Transliteration */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>TRANSLITERATION</Text>
              <Text style={styles.transliteration}>{step.transliteration}</Text>
            </View>

            {/* Translation */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>TRANSLATION</Text>
              <Text style={styles.translation}>{step.translation}</Text>
            </View>

            {/* Repetitions */}
            {step.repetitions && (
              <View style={[styles.repetitionsBadge, { backgroundColor: `${accentColor}15` }]}>
                <Ionicons name="repeat" size={16} color={accentColor} />
                <Text style={[styles.repetitionsText, { color: accentColor }]}>
                  Repeat {step.repetitions} times
                </Text>
              </View>
            )}

            {/* Note - special styling for prostration and sunnah notes */}
            {step.note && (
              <View style={[
                styles.noteBox,
                isSunnahSurahStep(step.name) && styles.sunnahNoteBox,
                isProstrationStep(step.name) && styles.prostrationNoteBox,
              ]}>
                <Ionicons
                  name={isProstrationStep(step.name) ? 'heart' : 'information-circle'}
                  size={18}
                  color={isProstrationStep(step.name) ? colors.error : isSunnahSurahStep(step.name) ? colors.primary : colors.accent}
                />
                <Text style={[styles.noteText, isProstrationStep(step.name) && styles.prostrationNoteText]}>
                  {step.note}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const WebPrayerGuideContent: React.FC = () => {
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [showWuduGuide, setShowWuduGuide] = useState(false);
  const { userProfile, loading: profileLoading } = useUserProfile();

  const prayerGuideQuery = useQuery({
    queryKey: ['prayerGuide'],
    queryFn: prayerService.getPrayerGuide,
  });

  // Get complete standalone steps for this prayer (generated fresh, not from Firestore)
  // This ensures each prayer has a full walkthrough from start to finish
  const prayerSteps = useMemo(() => {
    if (!selectedPrayer?.id) return [];
    return getCompletePrayerSteps(selectedPrayer.id);
  }, [selectedPrayer?.id]);

  const accentColor = selectedPrayer
    ? prayerGradients[selectedPrayer.id]?.[0] || colors.primary
    : colors.primary;

  // Check if user has access (reverts and learners only)
  const hasAccess = userProfile?.userType === 'revert' || userProfile?.userType === 'learner';

  // Loading state
  if (prayerGuideQuery.isLoading || profileLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading prayer guide...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (prayerGuideQuery.isError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.errorTitle}>Unable to load prayer guide</Text>
          <Text style={styles.errorText}>
            {(prayerGuideQuery.error as Error)?.message || 'Please try again later.'}
          </Text>
        </View>
      </View>
    );
  }

  // Access restriction - only for reverts and learners
  if (!hasAccess) {
    return (
      <View style={styles.container}>
        <View style={styles.restrictedContainer}>
          <View style={styles.restrictedIconWrap}>
            <Ionicons name="hand-left-outline" size={64} color={colors.primary} />
          </View>
          <Text style={styles.restrictedTitle}>Prayer Guide</Text>
          <Text style={styles.restrictedText}>
            This feature is designed specifically for new Muslims and those learning about Islam.
            As an experienced Muslim, you likely already know how to pray.
          </Text>
          <Text style={styles.restrictedSubtext}>
            If you'd like access to this feature, you can update your profile type in Settings.
          </Text>
        </View>
      </View>
    );
  }

  const data = prayerGuideQuery.data;

  // Wudu guide view
  if (showWuduGuide) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setShowWuduGuide(false)}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={styles.backButtonText}>Back to prayers</Text>
        </TouchableOpacity>

        {/* Wudu header */}
        <LinearGradient
          colors={[colors.accent, colors.accentLight]}
          style={styles.wuduHero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.wuduHeroContent}>
            <View style={styles.wuduHeroIcon}>
              <Ionicons name="water" size={48} color="rgba(255,255,255,0.95)" />
            </View>
            <Text style={styles.wuduHeroTitle}>Wudu (Ablution)</Text>
            <Text style={styles.wuduHeroArabic}>الوضوء</Text>
            <Text style={styles.wuduHeroSubtitle}>Ritual purification before prayer</Text>
          </View>
        </LinearGradient>

        {/* Steps */}
        <View style={styles.wuduStepsSection}>
          <Text style={styles.sectionTitle}>Step-by-Step Guide</Text>
          <Text style={styles.sectionSubtitle}>
            Steps marked as "Required (Fard)" must be performed for wudu to be valid
          </Text>

          <View style={styles.wuduStepsList}>
            {WUDU_STEPS.map((step, index) => (
              <View key={step.order} style={styles.wuduStepCard}>
                <View style={styles.wuduStepHeader}>
                  <View style={[styles.wuduStepIcon, step.isFard ? styles.wuduStepIconFard : styles.wuduStepIconSunnah]}>
                    <Ionicons name={step.icon} size={24} color={step.isFard ? colors.primary : colors.accent} />
                  </View>
                  <View style={styles.wuduStepInfo}>
                    <View style={styles.wuduStepTitleRow}>
                      <Text style={styles.wuduStepNumber}>{step.order}.</Text>
                      <Text style={styles.wuduStepName}>{step.name}</Text>
                      <View style={[styles.wuduStepBadge, step.isFard ? styles.wuduStepBadgeFard : styles.wuduStepBadgeSunnah]}>
                        <Text style={[styles.wuduStepBadgeText, step.isFard ? styles.wuduStepBadgeTextFard : styles.wuduStepBadgeTextSunnah]}>
                          {step.isFard ? 'Required' : 'Sunnah'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.wuduStepArabic}>{step.nameArabic}</Text>
                  </View>
                </View>
                <Text style={styles.wuduStepAction}>{step.action}</Text>
                <View style={styles.wuduStepRepetitions}>
                  <Ionicons name="repeat-outline" size={16} color={colors.text.secondary} />
                  <Text style={styles.wuduStepRepetitionsText}>
                    {step.repetitions === 1 ? 'Once' : `${step.repetitions} times`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Closing dua */}
        <View style={styles.closingDuaSection}>
          <Text style={styles.sectionTitle}>Closing Dua</Text>
          <Text style={styles.sectionSubtitle}>Say this after completing wudu:</Text>

          <View style={styles.closingDuaCard}>
            <Text style={styles.closingDuaArabic}>{CLOSING_DUA.arabic}</Text>
            <View style={styles.closingDuaDetail}>
              <Text style={styles.detailLabel}>TRANSLITERATION</Text>
              <Text style={styles.transliteration}>{CLOSING_DUA.transliteration}</Text>
            </View>
            <View style={styles.closingDuaDetail}>
              <Text style={styles.detailLabel}>TRANSLATION</Text>
              <Text style={styles.translation}>{CLOSING_DUA.translation}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Prayer detail view
  if (selectedPrayer) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedPrayer(null)}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={styles.backButtonText}>Back to prayers</Text>
        </TouchableOpacity>

        {/* Prayer hero header */}
        <LinearGradient
          colors={prayerGradients[selectedPrayer.id] || [colors.primary, colors.primaryLight]}
          style={styles.prayerHero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.prayerHeroContent}>
            <View style={styles.prayerHeroIcon}>
              <Ionicons
                name={prayerIcons[selectedPrayer.id] || 'time-outline'}
                size={48}
                color="rgba(255,255,255,0.95)"
              />
            </View>
            <Text style={styles.prayerHeroArabic}>{selectedPrayer.nameArabic}</Text>
            <Text style={styles.prayerHeroName}>{selectedPrayer.name} Prayer</Text>
            <Text style={styles.prayerHeroTime}>{selectedPrayer.time}</Text>

            <View style={styles.prayerHeroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{selectedPrayer.rakaat}</Text>
                <Text style={styles.heroStatLabel}>Rakaat</Text>
              </View>
              {selectedPrayer.sunnahBefore && (
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{selectedPrayer.sunnahBefore}</Text>
                  <Text style={styles.heroStatLabel}>Sunnah Before</Text>
                </View>
              )}
              {selectedPrayer.sunnahAfter && (
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{selectedPrayer.sunnahAfter}</Text>
                  <Text style={styles.heroStatLabel}>Sunnah After</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Description and significance */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>About This Prayer</Text>
          <Text style={styles.descriptionText}>{selectedPrayer.description}</Text>

          <View style={styles.significanceBox}>
            <View style={styles.significanceHeader}>
              <Ionicons name="star" size={20} color={colors.accent} />
              <Text style={styles.significanceTitle}>Significance</Text>
            </View>
            <Text style={styles.significanceText}>{selectedPrayer.significance}</Text>
          </View>
        </View>

        {/* Steps */}
        <View style={styles.stepsSection}>
          <Text style={styles.sectionTitle}>Step-by-Step Guide</Text>
          <Text style={styles.sectionSubtitle}>
            Tap each step to expand and see the Arabic text, transliteration, and meaning
          </Text>

          <View style={styles.stepsList}>
            {prayerSteps.map((step, index) => (
              <StepCard
                key={step.order}
                step={step}
                index={index}
                totalSteps={prayerSteps.length}
                accentColor={accentColor}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  // Prayer list view
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="hand-left" size={32} color={colors.primary} />
        </View>
        <Text style={styles.headerTitle}>{data?.title}</Text>
        <Text style={styles.headerDescription}>{data?.introduction}</Text>
      </View>

      {/* Wudu reminder card - clickable */}
      <TouchableOpacity style={styles.wuduCard} onPress={() => setShowWuduGuide(true)} activeOpacity={0.9}>
        <LinearGradient
          colors={[colors.accent, colors.accentLight]}
          style={styles.wuduGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.wuduIconWrap}>
            <Ionicons name="water" size={28} color="rgba(255,255,255,0.95)" />
          </View>
          <View style={styles.wuduContent}>
            <Text style={styles.wuduTitle}>Don't Forget Wudu (Ablution)</Text>
            <Text style={styles.wuduText}>
              Tap to learn the step-by-step ablution guide
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Section title */}
      <View style={styles.prayersSectionHeader}>
        <Text style={styles.prayersSectionTitle}>The Five Daily Prayers</Text>
        <Text style={styles.prayersSectionSubtitle}>
          Select a prayer to learn the step-by-step guide
        </Text>
      </View>

      {/* Prayer cards grid */}
      <View style={styles.prayerCardsGrid}>
        {data?.prayers.map((prayer, index) => (
          <PrayerCard
            key={prayer.id}
            prayer={prayer}
            index={index}
            onPress={() => setSelectedPrayer(prayer)}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 32,
    paddingBottom: 64,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.error,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Header
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: `${colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  headerDescription: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 700,
    lineHeight: 26,
  },

  // Wudu card
  wuduCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: 40,
    // @ts-ignore
    boxShadow: '0 8px 32px rgba(212, 163, 115, 0.25)',
  },
  wuduGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  wuduIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  wuduContent: {
    flex: 1,
  },
  wuduTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.white,
    marginBottom: 4,
  },
  wuduText: {
    ...typography.body,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },

  // Prayers section
  prayersSectionHeader: {
    marginBottom: 24,
  },
  prayersSectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  prayersSectionSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },

  // Prayer cards
  prayerCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  prayerCard: {
    flex: 1,
    minWidth: 320,
    maxWidth: 400,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    // @ts-ignore
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    cursor: 'pointer',
  },
  prayerCardGradient: {
    padding: 24,
  },
  prayerCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  prayerIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  prayerCardInfo: {
    flex: 1,
  },
  prayerArabicName: {
    fontSize: 28,
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 4,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  prayerEnglishName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.white,
    marginBottom: 4,
  },
  prayerTime: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
  },
  prayerStats: {
    alignItems: 'flex-end',
  },
  rakaatBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  rakaatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.white,
  },
  rakaatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
  },
  prayerDescription: {
    ...typography.body,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    marginBottom: 16,
  },
  prayerCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  learnMore: {
    ...typography.body,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
  },

  // Back button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'flex-start',
    padding: 8,
    paddingRight: 16,
    borderRadius: borderRadius.round,
    backgroundColor: `${colors.primary}10`,
    // @ts-ignore
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
  },
  backButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Prayer hero
  prayerHero: {
    borderRadius: borderRadius.xl,
    marginBottom: 32,
    overflow: 'hidden',
  },
  prayerHeroContent: {
    padding: 40,
    alignItems: 'center',
  },
  prayerHeroIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  prayerHeroArabic: {
    fontSize: 48,
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  prayerHeroName: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.white,
    marginBottom: 8,
  },
  prayerHeroTime: {
    ...typography.body,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 24,
  },
  prayerHeroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
    gap: 40,
  },
  heroStat: {
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.white,
  },
  heroStatLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },

  // Description section
  descriptionSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  descriptionText: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 26,
    marginBottom: 24,
  },
  significanceBox: {
    backgroundColor: `${colors.accent}10`,
    borderRadius: borderRadius.lg,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  significanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  significanceTitle: {
    ...typography.h4,
    color: colors.accent,
    marginLeft: 8,
  },
  significanceText: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
    fontStyle: 'italic',
  },

  // Steps section
  stepsSection: {
    marginBottom: 40,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: 24,
  },
  stepsList: {
    paddingLeft: 8,
  },
  stepCard: {
    flexDirection: 'row',
    marginBottom: 8,
    // @ts-ignore
    cursor: 'pointer',
  },
  stepIndicatorColumn: {
    alignItems: 'center',
    width: 48,
    marginRight: 16,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.white,
  },
  stepConnector: {
    width: 3,
    flex: 1,
    marginTop: 8,
    borderRadius: 1.5,
  },
  stepCardContent: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: 20,
    marginBottom: 8,
    // @ts-ignore
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    transition: 'all 0.2s ease-out',
  },
  stepCardContentExpanded: {
    // @ts-ignore
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stepHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  positionBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepTitles: {
    flex: 1,
  },
  stepName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  stepArabicName: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  stepInstruction: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },

  // Expanded details
  expandedDetails: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  arabicBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  arabicText: {
    fontSize: 24,
    color: colors.text.primary,
    textAlign: 'right',
    lineHeight: 42,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  transliteration: {
    ...typography.body,
    color: colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  translation: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  repetitionsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.round,
    marginBottom: 16,
    gap: 8,
  },
  repetitionsText: {
    ...typography.body,
    fontWeight: '600',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${colors.accent}10`,
    borderRadius: borderRadius.md,
    padding: 16,
    gap: 12,
  },
  noteText: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 22,
  },
  sunnahNoteBox: {
    backgroundColor: `${colors.primary}10`,
  },
  prostrationNoteBox: {
    backgroundColor: `${colors.error}08`,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  prostrationNoteText: {
    color: colors.text.primary,
  },

  // Restricted access
  restrictedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  restrictedIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  restrictedTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  restrictedText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 12,
    maxWidth: 500,
  },
  restrictedSubtext: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    maxWidth: 400,
  },

  // Wudu guide
  wuduHero: {
    borderRadius: borderRadius.xl,
    marginBottom: 32,
    overflow: 'hidden',
  },
  wuduHeroContent: {
    padding: 40,
    alignItems: 'center',
  },
  wuduHeroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  wuduHeroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.white,
    marginBottom: 8,
  },
  wuduHeroArabic: {
    fontSize: 36,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  wuduHeroSubtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.85)',
  },
  wuduStepsSection: {
    marginBottom: 40,
  },
  wuduStepsList: {
    gap: 16,
  },
  wuduStepCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: 20,
    // @ts-ignore
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  wuduStepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  wuduStepIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  wuduStepIconFard: {
    backgroundColor: `${colors.primary}15`,
  },
  wuduStepIconSunnah: {
    backgroundColor: `${colors.accent}15`,
  },
  wuduStepInfo: {
    flex: 1,
  },
  wuduStepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  wuduStepNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  wuduStepName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  wuduStepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
  },
  wuduStepBadgeFard: {
    backgroundColor: `${colors.primary}15`,
  },
  wuduStepBadgeSunnah: {
    backgroundColor: `${colors.accent}15`,
  },
  wuduStepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  wuduStepBadgeTextFard: {
    color: colors.primary,
  },
  wuduStepBadgeTextSunnah: {
    color: colors.accent,
  },
  wuduStepArabic: {
    fontSize: 16,
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  wuduStepAction: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
    marginBottom: 8,
  },
  wuduStepRepetitions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wuduStepRepetitionsText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  closingDuaSection: {
    marginBottom: 40,
  },
  closingDuaCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    // @ts-ignore
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  closingDuaArabic: {
    fontSize: 24,
    color: colors.text.primary,
    textAlign: 'right',
    lineHeight: 42,
    marginBottom: 24,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  closingDuaDetail: {
    marginBottom: 16,
  },
});
