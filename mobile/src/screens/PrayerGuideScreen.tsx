import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Header, Card } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { prayerService } from '@/services/prayerService';
import type { Prayer, PrayerStep } from '@/types/prayer';

// Position icons mapping
const positionIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  standing: 'person-outline',
  bowing: 'arrow-down-outline',
  prostrating: 'chevron-down-circle-outline',
  sitting: 'tablet-landscape-outline',
  turning: 'sync-outline',
};

// Prayer time icons
const prayerIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  fajr: 'sunny-outline',
  dhuhr: 'sunny',
  asr: 'partly-sunny-outline',
  maghrib: 'cloudy-night-outline',
  isha: 'moon-outline',
};

// Prayer gradient colors
const prayerGradients: Record<string, [string, string]> = {
  fajr: ['#667eea', '#764ba2'],
  dhuhr: ['#f093fb', '#f5576c'],
  asr: ['#4facfe', '#00f2fe'],
  maghrib: ['#fa709a', '#fee140'],
  isha: ['#30cfd0', '#330867'],
};

interface PrayerCardProps {
  prayer: Prayer;
  onPress: () => void;
  index: number;
}

const PrayerCard: React.FC<PrayerCardProps> = ({ prayer, onPress, index }) => {
  const isWeb = Platform.OS === 'web';
  const [isHovered, setIsHovered] = useState(false);
  const gradient = prayerGradients[prayer.id] || [colors.primary, colors.primaryLight];

  const webStyle = isWeb ? {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isHovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
    cursor: 'pointer',
  } : {};

  const animationStyle = isWeb ? {
    animationName: 'fadeInUp',
    animationDuration: '0.5s',
    animationTimingFunction: 'ease-out',
    animationFillMode: 'forwards',
    animationDelay: `${index * 0.1}s`,
    opacity: 0,
  } : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      // @ts-ignore - web event handlers
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // @ts-ignore - web styles
      style={[styles.prayerCard, webStyle, animationStyle]}
    >
      <LinearGradient
        colors={gradient}
        style={styles.prayerCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.prayerCardContent}>
          <View style={styles.prayerIconContainer}>
            <Ionicons
              name={prayerIcons[prayer.id] || 'time-outline'}
              size={32}
              color="rgba(255,255,255,0.9)"
            />
          </View>
          <View style={styles.prayerInfo}>
            <Text style={styles.prayerNameArabic}>{prayer.nameArabic}</Text>
            <Text style={styles.prayerName}>{prayer.name}</Text>
            <Text style={styles.prayerTime}>{prayer.time}</Text>
          </View>
          <View style={styles.prayerMeta}>
            <View style={styles.rakaatBadge}>
              <Text style={styles.rakaatText}>{prayer.rakaat}</Text>
              <Text style={styles.rakaatLabel}>rakaat</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          </View>
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
  const isWeb = Platform.OS === 'web';
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const webStyle = isWeb ? {
    transition: 'all 0.25s ease-out',
    transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
  } : {};

  const animationStyle = isWeb ? {
    animationName: 'slideInLeft',
    animationDuration: '0.4s',
    animationTimingFunction: 'ease-out',
    animationFillMode: 'forwards',
    animationDelay: `${index * 0.05}s`,
    opacity: 0,
  } : {};

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.9}
      // @ts-ignore
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={[styles.stepCard, webStyle, animationStyle]}
    >
      {/* Step number indicator */}
      <View style={styles.stepIndicator}>
        <View style={[styles.stepNumber, { backgroundColor: accentColor }]}>
          <Text style={styles.stepNumberText}>{step.order}</Text>
        </View>
        {index < totalSteps - 1 && (
          <View style={[styles.stepLine, { backgroundColor: `${accentColor}30` }]} />
        )}
      </View>

      {/* Step content */}
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <View style={styles.stepTitleRow}>
            <View style={[styles.positionIcon, { backgroundColor: `${accentColor}15` }]}>
              <Ionicons
                name={positionIcons[step.position] || 'person-outline'}
                size={18}
                color={accentColor}
              />
            </View>
            <View style={styles.stepTitles}>
              <Text style={styles.stepName}>{step.name}</Text>
              <Text style={styles.stepNameArabic}>{step.nameArabic}</Text>
            </View>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.text.secondary}
          />
        </View>

        {/* Instruction (always visible) */}
        <Text style={styles.stepInstruction}>{step.instruction}</Text>

        {/* Expanded content */}
        {expanded && (
          <View style={styles.expandedContent}>
            {step.arabicText ? (
              <>
                {/* Arabic text */}
                <View style={[styles.arabicContainer, { borderLeftColor: accentColor }]}>
                  <Text style={styles.arabicText}>{step.arabicText}</Text>
                </View>

                {/* Transliteration */}
                <View style={styles.transliterationContainer}>
                  <Text style={styles.labelText}>Transliteration:</Text>
                  <Text style={styles.transliteration}>{step.transliteration}</Text>
                </View>

                {/* Translation */}
                <View style={styles.translationContainer}>
                  <Text style={styles.labelText}>Translation:</Text>
                  <Text style={styles.translation}>{step.translation}</Text>
                </View>
              </>
            ) : null}

            {/* Repetitions */}
            {step.repetitions && (
              <View style={styles.repetitionsContainer}>
                <Ionicons name="repeat-outline" size={16} color={accentColor} />
                <Text style={[styles.repetitionsText, { color: accentColor }]}>
                  Repeat {step.repetitions} times
                </Text>
              </View>
            )}

            {/* Note */}
            {step.note && (
              <View style={[styles.noteContainer, { backgroundColor: `${accentColor}10` }]}>
                <Ionicons name="information-circle-outline" size={16} color={accentColor} />
                <Text style={styles.noteText}>{step.note}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const PrayerGuideScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = width >= 1024;

  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);

  const prayerGuideQuery = useQuery({
    queryKey: ['prayerGuide'],
    queryFn: prayerService.getPrayerGuide,
  });

  const handleGoBack = () => {
    if (selectedPrayer) {
      setSelectedPrayer(null);
    } else {
      navigation.goBack();
    }
  };

  const accentColor = selectedPrayer
    ? prayerGradients[selectedPrayer.id]?.[0] || colors.primary
    : colors.primary;

  // Loading state
  if (prayerGuideQuery.isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <Header
            title="Prayer Guide"
            leftAction={{ iconName: 'arrow-back', onPress: handleGoBack }}
          />
        </View>
        <View style={styles.center}>
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
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <Header
            title="Prayer Guide"
            leftAction={{ iconName: 'arrow-back', onPress: handleGoBack }}
          />
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Unable to load prayer guide</Text>
          <Text style={styles.errorText}>
            {(prayerGuideQuery.error as Error)?.message || 'Please try again later.'}
          </Text>
        </View>
      </View>
    );
  }

  const data = prayerGuideQuery.data;

  // Prayer detail view
  if (selectedPrayer) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <Header
            title={`${selectedPrayer.name} Prayer`}
            titleNumberOfLines={1}
            leftAction={{ iconName: 'arrow-back', onPress: handleGoBack }}
          />
        </View>

        <ScrollView
          style={[styles.scrollView, isWeb && styles.webScrollView]}
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.scrollContentDesktop,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Prayer header card */}
          <LinearGradient
            colors={prayerGradients[selectedPrayer.id] || [colors.primary, colors.primaryLight]}
            style={styles.prayerHeaderCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.prayerHeaderContent}>
              <Text style={styles.prayerHeaderArabic}>{selectedPrayer.nameArabic}</Text>
              <Text style={styles.prayerHeaderName}>{selectedPrayer.name} Prayer</Text>
              <Text style={styles.prayerHeaderTime}>{selectedPrayer.time}</Text>

              <View style={styles.prayerStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{selectedPrayer.rakaat}</Text>
                  <Text style={styles.statLabel}>Rakaat</Text>
                </View>
                {selectedPrayer.sunnahBefore && (
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{selectedPrayer.sunnahBefore}</Text>
                    <Text style={styles.statLabel}>Sunnah Before</Text>
                  </View>
                )}
                {selectedPrayer.sunnahAfter && (
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{selectedPrayer.sunnahAfter}</Text>
                    <Text style={styles.statLabel}>Sunnah After</Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>

          {/* Description */}
          <Card style={styles.descriptionCard}>
            <Text style={styles.descriptionTitle}>About this Prayer</Text>
            <Text style={styles.descriptionText}>{selectedPrayer.description}</Text>
            <Text style={styles.significanceTitle}>Significance</Text>
            <Text style={styles.significanceText}>{selectedPrayer.significance}</Text>
          </Card>

          {/* Steps */}
          <Text style={styles.stepsTitle}>Step-by-Step Guide</Text>
          <View style={styles.stepsContainer}>
            {selectedPrayer.steps.map((step, index) => (
              <StepCard
                key={step.order}
                step={step}
                index={index}
                totalSteps={selectedPrayer.steps.length}
                accentColor={accentColor}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Prayer list view
  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Header
          title="Prayer Guide"
          leftAction={{ iconName: 'arrow-back', onPress: handleGoBack }}
        />
      </View>

      <ScrollView
        style={[styles.scrollView, isWeb && styles.webScrollView]}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction */}
        <Card style={styles.introCard}>
          <View style={styles.introHeader}>
            <View style={styles.introIconContainer}>
              <Ionicons name="book-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.introTitle}>{data?.title}</Text>
          </View>
          <Text style={styles.introText}>{data?.introduction}</Text>
        </Card>

        {/* Wudu reminder */}
        <TouchableOpacity style={styles.wuduCard} activeOpacity={0.9}>
          <LinearGradient
            colors={[colors.accent, colors.accentLight]}
            style={styles.wuduGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="water-outline" size={24} color={colors.text.white} />
            <View style={styles.wuduContent}>
              <Text style={styles.wuduTitle}>Don't forget Wudu!</Text>
              <Text style={styles.wuduText}>
                Perform ablution before praying to purify yourself
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Prayer cards */}
        <Text style={styles.sectionTitle}>The Five Daily Prayers</Text>
        <View style={[styles.prayerCardsContainer, isDesktop && styles.prayerCardsDesktop]}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  headerContainer: {
    backgroundColor: colors.background,
    paddingTop: 0,
  },
  scrollView: {
    flex: 1,
  },
  webScrollView: {
    // @ts-ignore
    overflowY: 'auto',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  scrollContentDesktop: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  errorTitle: {
    ...typography.h4,
    color: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Introduction
  introCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  introIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  introTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  introText: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },

  // Wudu card
  wuduCard: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  wuduGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  wuduContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  wuduTitle: {
    ...typography.h4,
    color: colors.text.white,
    marginBottom: 2,
  },
  wuduText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
  },

  // Section title
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },

  // Prayer cards
  prayerCardsContainer: {
    gap: spacing.md,
  },
  prayerCardsDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  prayerCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        // @ts-ignore
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        flex: 1,
        minWidth: 280,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
      },
    }),
  },
  prayerCardGradient: {
    padding: spacing.lg,
  },
  prayerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  prayerInfo: {
    flex: 1,
  },
  prayerNameArabic: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : undefined,
    marginBottom: 2,
  },
  prayerName: {
    ...typography.h4,
    color: colors.text.white,
    marginBottom: 2,
  },
  prayerTime: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
  },
  prayerMeta: {
    alignItems: 'flex-end',
  },
  rakaatBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  rakaatText: {
    ...typography.h4,
    color: colors.text.white,
  },
  rakaatLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    textTransform: 'uppercase',
  },

  // Prayer detail header
  prayerHeaderCard: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  prayerHeaderContent: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  prayerHeaderArabic: {
    fontSize: 36,
    color: 'rgba(255,255,255,0.95)',
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : undefined,
    marginBottom: spacing.xs,
  },
  prayerHeaderName: {
    ...typography.h2,
    color: colors.text.white,
    marginBottom: 4,
  },
  prayerHeaderTime: {
    ...typography.body,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing.lg,
  },
  prayerStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    color: colors.text.white,
  },
  statLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },

  // Description card
  descriptionCard: {
    marginBottom: spacing.lg,
  },
  descriptionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  descriptionText: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  significanceTitle: {
    ...typography.h4,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  significanceText: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
    fontStyle: 'italic',
  },

  // Steps
  stepsTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  stepsContainer: {
    paddingLeft: spacing.xs,
  },
  stepCard: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  stepIndicator: {
    alignItems: 'center',
    width: 40,
    marginRight: spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...typography.body,
    color: colors.text.white,
    fontWeight: '700',
  },
  stepLine: {
    width: 2,
    flex: 1,
    marginTop: spacing.xs,
  },
  stepContent: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xs,
    ...Platform.select({
      web: {
        // @ts-ignore
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  positionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  stepTitles: {
    flex: 1,
  },
  stepName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  stepNameArabic: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  stepInstruction: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },

  // Expanded content
  expandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  arabicContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
  },
  arabicText: {
    fontSize: 22,
    color: colors.text.primary,
    textAlign: 'right',
    fontFamily: Platform.OS === 'web' ? 'Amiri, serif' : undefined,
    lineHeight: 38,
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
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  noteText: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
});
