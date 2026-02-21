/**
 * WebPillarsContent - Pillars of Islam/Iman with luxury styling
 * Enhanced UI with better responsiveness and visual consistency
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors, borderRadius, typography } from '@/theme';
import { useWebHover } from '@/hooks/useWebHover';
import { pillarsService } from '@/services/pillarsService';
import type { PillarType, Pillar } from '@/types/pillars';

// Gradient colors for pillars - Islam (green tones) and Iman (purple/blue tones)
const islamGradients: [string, string][] = [
  ['#1B4332', '#2D6A4F'],
  ['#2D6A4F', '#40916C'],
  ['#40916C', '#52B788'],
  ['#52B788', '#74C69D'],
  ['#74C69D', '#95D5B2'],
];

const imanGradients: [string, string][] = [
  ['#5E548E', '#9F86C0'],
  ['#7B2CBF', '#9D4EDD'],
  ['#9D4EDD', '#C77DFF'],
  ['#6930C3', '#7400B8'],
  ['#5A189A', '#9D4EDD'],
  ['#7209B7', '#B5179E'],
];

// Icon mapping for pillar types
const pillarIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  'star-outline': 'star-outline',
  'hand-right-outline': 'hand-right-outline',
  'wallet-outline': 'wallet-outline',
  'restaurant-outline': 'restaurant-outline',
  'compass-outline': 'compass-outline',
  'book-outline': 'book-outline',
  'heart-outline': 'heart-outline',
  'shield-checkmark-outline': 'shield-checkmark-outline',
  'flash-outline': 'flash-outline',
  'calendar-outline': 'calendar-outline',
  'infinite-outline': 'infinite-outline',
};

interface PillarCardProps {
  pillar: Pillar;
  type: PillarType;
  index: number;
  isCompact: boolean;
}

const PillarCard: React.FC<PillarCardProps> = ({ pillar, type, index, isCompact }) => {
  const [expanded, setExpanded] = useState(false);
  const gradients = type === 'islam' ? islamGradients : imanGradients;
  const gradient = gradients[index % gradients.length];

  const hover = useWebHover({
    hoverStyle: {
      transform: 'translateY(-8px) scale(1.02)',
      boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
    },
    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.95}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[
        styles.pillarCard,
        isCompact && styles.pillarCardCompact,
        hover.style,
        {
          // @ts-ignore
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
        style={styles.pillarCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header section */}
        <View style={styles.pillarHeader}>
          <View style={styles.pillarNumberBadge}>
            <Text style={styles.pillarNumberText}>{pillar.number}</Text>
          </View>
          <View style={styles.pillarHeaderRight}>
            <View style={styles.pillarIconWrap}>
              <Ionicons
                name={pillarIcons[pillar.icon] || 'star-outline'}
                size={28}
                color="rgba(255,255,255,0.95)"
              />
            </View>
          </View>
        </View>

        {/* Title section */}
        <View style={styles.pillarTitleSection}>
          <Text style={styles.pillarArabic}>{pillar.arabicName}</Text>
          <Text style={styles.pillarName}>{pillar.name}</Text>
          <Text style={styles.pillarMeaning}>{pillar.meaning}</Text>
        </View>

        {/* Preview description */}
        {!expanded && (
          <Text style={styles.pillarPreview} numberOfLines={2}>
            {pillar.description}
          </Text>
        )}

        {/* Expanded content */}
        {expanded && (
          <View style={styles.pillarExpanded}>
            <View style={styles.pillarDivider} />

            <View style={styles.pillarSection}>
              <View style={styles.pillarSectionHeader}>
                <Ionicons name="document-text-outline" size={18} color="rgba(255,255,255,0.9)" />
                <Text style={styles.pillarSectionTitle}>Description</Text>
              </View>
              <Text style={styles.pillarDescription}>{pillar.description}</Text>
            </View>

            <View style={styles.pillarSection}>
              <View style={styles.pillarSectionHeader}>
                <Ionicons name="star-outline" size={18} color="rgba(255,255,255,0.9)" />
                <Text style={styles.pillarSectionTitle}>Significance</Text>
              </View>
              <Text style={styles.pillarDescription}>{pillar.significance}</Text>
            </View>
          </View>
        )}

        {/* Footer / expand hint */}
        <View style={styles.pillarFooter}>
          <Text style={styles.pillarExpandText}>
            {expanded ? 'Tap to collapse' : 'Tap to learn more'}
          </Text>
          <View style={styles.expandIconWrap}>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="rgba(255,255,255,0.9)"
            />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

type ToggleOption = {
  value: PillarType;
  label: string;
  count: number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  description: string;
  gradientColors: [string, string];
};

const TOGGLE_OPTIONS: ToggleOption[] = [
  {
    value: 'islam',
    label: 'Pillars of Islam',
    count: 5,
    icon: 'star',
    description: 'The five foundational practices',
    gradientColors: ['#1B4332', '#40916C'],
  },
  {
    value: 'iman',
    label: 'Pillars of Iman',
    count: 6,
    icon: 'heart',
    description: 'The six articles of faith',
    gradientColors: ['#5E548E', '#9F86C0'],
  },
];

interface ToggleButtonProps {
  option: ToggleOption;
  isActive: boolean;
  onPress: () => void;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ option, isActive, onPress }) => {
  const hover = useWebHover({
    hoverStyle: isActive ? {} : {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
    },
    transition: 'all 0.25s ease-out',
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[
        styles.toggleButton,
        hover.style,
      ]}
    >
      <LinearGradient
        colors={isActive ? option.gradientColors : ['#F8F9FA', '#F1F3F4']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.toggleContent}>
        <View style={[
          styles.toggleIconWrap,
          { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : `${option.gradientColors[0]}15` }
        ]}>
          <Ionicons
            name={option.icon}
            size={24}
            color={isActive ? 'rgba(255,255,255,0.95)' : option.gradientColors[0]}
          />
        </View>
        <View style={styles.toggleTextWrap}>
          <Text style={[styles.toggleLabel, isActive && styles.toggleLabelActive]}>
            {option.label}
          </Text>
          <Text style={[styles.toggleDescription, isActive && styles.toggleDescriptionActive]}>
            {option.description}
          </Text>
        </View>
        <View style={[
          styles.toggleCountBadge,
          { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : `${option.gradientColors[0]}15` }
        ]}>
          <Text style={[
            styles.toggleCountNumber,
            { color: isActive ? colors.text.white : option.gradientColors[0] }
          ]}>
            {option.count}
          </Text>
        </View>
      </View>
      {isActive && (
        <View style={styles.activeIndicator}>
          <Ionicons name="checkmark-circle" size={20} color="rgba(255,255,255,0.9)" />
        </View>
      )}
    </TouchableOpacity>
  );
};

export const WebPillarsContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PillarType>('islam');
  const { width } = useWindowDimensions();

  // Responsive breakpoints
  const isCompact = width < 600;
  const isMedium = width >= 600 && width < 900;
  const isWide = width >= 900 && width < 1200;
  const isExtraWide = width >= 1200;

  const pillarsQuery = useQuery({
    queryKey: ['pillars', activeTab],
    queryFn: () => pillarsService.getPillarsData(activeTab),
  });

  const accentColor = activeTab === 'islam' ? '#1B4332' : '#5E548E';
  const accentLight = activeTab === 'islam' ? '#40916C' : '#9F86C0';

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        isCompact && styles.scrollContentCompact,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.pageHeader}>
        <View style={[styles.pageHeaderIcon, { backgroundColor: `${accentColor}12` }]}>
          <Ionicons name="compass" size={36} color={accentColor} />
        </View>
        <Text style={styles.pageTitle}>Pillars of Faith</Text>
        <Text style={styles.pageSubtitle}>
          Understand the fundamental pillars that form the foundation of Islamic belief and practice
        </Text>
      </View>

      {/* Toggle Section */}
      <View style={styles.toggleSection}>
        <Text style={styles.toggleSectionTitle}>Select a Category</Text>
        <View style={[
          styles.toggleContainer,
          isCompact && styles.toggleContainerCompact,
        ]}>
          {TOGGLE_OPTIONS.map((option) => (
            <ToggleButton
              key={option.value}
              option={option}
              isActive={activeTab === option.value}
              onPress={() => setActiveTab(option.value)}
            />
          ))}
        </View>
      </View>

      {/* Content */}
      {pillarsQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={styles.loadingText}>Loading pillars...</Text>
        </View>
      ) : pillarsQuery.isError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.errorTitle}>Failed to load pillars</Text>
          <Text style={styles.errorText}>Please try again later</Text>
        </View>
      ) : pillarsQuery.data ? (
        <>
          {/* Introduction Card */}
          <LinearGradient
            colors={[accentColor, accentLight]}
            style={styles.introCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.introIconWrap}>
              <Ionicons
                name={activeTab === 'islam' ? 'star' : 'heart'}
                size={32}
                color="rgba(255,255,255,0.95)"
              />
            </View>
            <View style={styles.introContent}>
              <Text style={styles.introTitle}>{pillarsQuery.data.title}</Text>
              <Text style={styles.introDescription}>
                {pillarsQuery.data.description}
              </Text>
            </View>
          </LinearGradient>

          {/* Pillar Cards Grid */}
          <View style={styles.pillarsSection}>
            <View style={styles.pillarsSectionHeader}>
              <Text style={[styles.pillarsSectionTitle, { color: accentColor }]}>
                The {activeTab === 'islam' ? '5' : '6'} {activeTab === 'islam' ? 'Pillars' : 'Articles'}
              </Text>
              <Text style={styles.pillarsSectionSubtitle}>
                Tap any card to expand and learn more
              </Text>
            </View>

            <View style={[
              styles.pillarsGrid,
              isMedium && styles.pillarsGridMedium,
              isWide && styles.pillarsGridWide,
              isExtraWide && styles.pillarsGridExtraWide,
            ]}>
              {pillarsQuery.data.pillars.map((pillar, index) => (
                <PillarCard
                  key={pillar.number}
                  pillar={pillar}
                  type={activeTab}
                  index={index}
                  isCompact={isCompact}
                />
              ))}
            </View>
          </View>
        </>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>No data available</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 32,
    paddingBottom: 80,
    // @ts-ignore
    maxWidth: 1200,
    marginHorizontal: 'auto',
    width: '100%',
  },
  scrollContentCompact: {
    padding: 20,
    paddingBottom: 60,
  },

  // Page header
  pageHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  pageHeaderIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 16,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  pageSubtitle: {
    fontSize: 17,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 28,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },

  // Toggle section
  toggleSection: {
    marginBottom: 40,
  },
  toggleSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  toggleContainerCompact: {
    flexDirection: 'column',
    gap: 16,
  },
  toggleButton: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    // @ts-ignore
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  toggleIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  toggleTextWrap: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  toggleLabelActive: {
    color: colors.text.white,
  },
  toggleDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  toggleDescriptionActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  toggleCountBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  toggleCountNumber: {
    fontSize: 20,
    fontWeight: '700',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  activeIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  // Intro card
  introCard: {
    borderRadius: borderRadius.xl,
    padding: 28,
    marginBottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    // @ts-ignore
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
  },
  introIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  introContent: {
    flex: 1,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.white,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  introDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },

  // Pillars section
  pillarsSection: {
    marginBottom: 24,
  },
  pillarsSectionHeader: {
    marginBottom: 28,
  },
  pillarsSectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  pillarsSectionSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },

  // Pillars grid - responsive layouts
  pillarsGrid: {
    gap: 24,
    // @ts-ignore
    display: 'grid',
    gridTemplateColumns: '1fr',
  },
  pillarsGridMedium: {
    // @ts-ignore
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
  pillarsGridWide: {
    // @ts-ignore
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
  pillarsGridExtraWide: {
    // @ts-ignore
    gridTemplateColumns: 'repeat(2, 1fr)',
  },

  // Pillar card
  pillarCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    // @ts-ignore
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    cursor: 'pointer',
    width: '100%',
  },
  pillarCardCompact: {
    width: '100%',
  },
  pillarCardGradient: {
    padding: 24,
  },
  pillarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  pillarNumberBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarNumberText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.white,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  pillarHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillarIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarTitleSection: {
    marginBottom: 16,
  },
  pillarArabic: {
    fontSize: 32,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  pillarName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.white,
    marginBottom: 6,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  pillarMeaning: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  pillarPreview: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 22,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  pillarExpanded: {
    marginTop: 8,
  },
  pillarDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 20,
  },
  pillarSection: {
    marginBottom: 20,
  },
  pillarSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pillarSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  pillarDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 26,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  pillarFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  pillarExpandText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  expandIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Loading state
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 80,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 20,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },

  // Error state
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 80,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.error,
    marginTop: 20,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  errorText: {
    fontSize: 15,
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
});
