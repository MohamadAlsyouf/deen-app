/**
 * WebPillarsContent - Pillars of Islam/Iman with luxury styling
 */

import React, { useState, useEffect } from 'react';
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
import { colors } from '@/theme';
import { useWebHover } from '@/hooks/useWebHover';
import { pillarsService } from '@/services/pillarsService';
import type { PillarType, Pillar } from '@/types/pillars';

const PillarCard: React.FC<{
  pillar: Pillar;
  accentColor: string;
  index: number;
}> = ({ pillar, accentColor, index }) => {
  const [expanded, setExpanded] = useState(false);

  const hover = useWebHover({
    hoverStyle: {
      transform: 'translateY(-4px)',
      boxShadow: '0 16px 40px rgba(27, 67, 50, 0.15)',
    },
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
        hover.style,
        {
          // @ts-ignore
          animation: `fadeInUp 0.5s ease-out ${0.1 + index * 0.1}s forwards`,
          opacity: 0,
        },
      ]}
    >
      <View style={[styles.pillarAccent, { backgroundColor: accentColor }]} />
      
      <View style={styles.pillarHeader}>
        <View style={[styles.pillarNumber, { backgroundColor: `${accentColor}20` }]}>
          <Text style={[styles.pillarNumberText, { color: accentColor }]}>
            {pillar.number}
          </Text>
        </View>
        <View style={styles.pillarTitleWrap}>
          <Text style={styles.pillarArabic}>{pillar.arabicName}</Text>
          <Text style={styles.pillarName}>{pillar.name}</Text>
          <Text style={styles.pillarMeaning}>{pillar.meaning}</Text>
        </View>
        <View style={[styles.pillarIcon, { backgroundColor: `${accentColor}15` }]}>
          <Ionicons
            name={pillar.icon as React.ComponentProps<typeof Ionicons>['name']}
            size={28}
            color={accentColor}
          />
        </View>
      </View>

      {expanded && (
        <View style={styles.pillarExpanded}>
          <View style={styles.pillarDivider} />
          <View style={styles.pillarSection}>
            <Text style={[styles.pillarSectionTitle, { color: accentColor }]}>
              Description
            </Text>
            <Text style={styles.pillarDescription}>{pillar.description}</Text>
          </View>
          <View style={styles.pillarSection}>
            <Text style={[styles.pillarSectionTitle, { color: accentColor }]}>
              Significance
            </Text>
            <Text style={styles.pillarDescription}>{pillar.significance}</Text>
          </View>
        </View>
      )}

      <View style={styles.pillarExpandHint}>
        <Text style={styles.pillarExpandText}>
          {expanded ? 'Tap to collapse' : 'Tap to learn more'}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.text.tertiary}
        />
      </View>
    </TouchableOpacity>
  );
};

type ToggleOption = {
  value: PillarType;
  label: string;
  count: number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const TOGGLE_OPTIONS: ToggleOption[] = [
  { value: 'islam', label: 'Pillars of Islam', count: 5, icon: 'star' },
  { value: 'iman', label: 'Pillars of Iman', count: 6, icon: 'heart' },
];

export const WebPillarsContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PillarType>('islam');
  const { width } = useWindowDimensions();
  const isWide = width >= 1200;

  const pillarsQuery = useQuery({
    queryKey: ['pillars', activeTab],
    queryFn: () => pillarsService.getPillarsData(activeTab),
  });

  const accentColor = activeTab === 'islam' ? colors.primary : colors.secondary;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.pageHeader}>
        <View style={[styles.pageHeaderIcon, { backgroundColor: `${accentColor}15` }]}>
          <Ionicons name="compass" size={32} color={accentColor} />
        </View>
        <Text style={styles.pageTitle}>Pillars of Faith</Text>
        <Text style={styles.pageSubtitle}>
          Understand the fundamental pillars that form the foundation of Islamic belief and practice
        </Text>
      </View>

      {/* Toggle */}
      <View style={styles.toggleContainer}>
        {TOGGLE_OPTIONS.map((option) => {
          const isActive = activeTab === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => setActiveTab(option.value)}
              style={[
                styles.toggleButton,
                isActive && [styles.toggleButtonActive, { borderColor: accentColor }],
              ]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isActive ? [accentColor, `${accentColor}DD`] : ['transparent', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Ionicons
                name={option.icon}
                size={20}
                color={isActive ? colors.text.white : colors.text.secondary}
                style={styles.toggleIcon}
              />
              <View style={styles.toggleTextWrap}>
                <Text style={[styles.toggleLabel, isActive && styles.toggleLabelActive]}>
                  {option.label}
                </Text>
                <Text style={[styles.toggleCount, isActive && styles.toggleCountActive]}>
                  {option.count} pillars
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {pillarsQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={styles.loadingText}>Loading pillars...</Text>
        </View>
      ) : pillarsQuery.isError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Failed to load pillars</Text>
        </View>
      ) : pillarsQuery.data ? (
        <>
          {/* Introduction Card */}
          <View style={[styles.introCard, { borderLeftColor: accentColor }]}>
            <View style={styles.introHeader}>
              <Ionicons
                name={activeTab === 'islam' ? 'star' : 'heart'}
                size={24}
                color={accentColor}
              />
              <Text style={[styles.introTitle, { color: accentColor }]}>
                {pillarsQuery.data.title}
              </Text>
            </View>
            <Text style={styles.introDescription}>
              {pillarsQuery.data.description}
            </Text>
          </View>

          {/* Pillar Cards */}
          <View style={[styles.pillarsGrid, isWide && styles.pillarsGridWide]}>
            {pillarsQuery.data.pillars.map((pillar, index) => (
              <PillarCard
                key={pillar.number}
                pillar={pillar}
                accentColor={accentColor}
                index={index}
              />
            ))}
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
    padding: 40,
    paddingBottom: 60,
  },
  pageHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  pageHeaderIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 12,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  pageSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 500,
    lineHeight: 26,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    // @ts-ignore
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
    cursor: 'pointer',
  },
  toggleButtonActive: {
    borderColor: colors.primary,
  },
  toggleIcon: {
    marginRight: 12,
  },
  toggleTextWrap: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  toggleLabelActive: {
    color: colors.text.white,
  },
  toggleCount: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  toggleCountActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  introCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderLeftWidth: 4,
    // @ts-ignore
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 12,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  introDescription: {
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 26,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  pillarsGrid: {
    gap: 20,
  },
  pillarsGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pillarCard: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    // @ts-ignore
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    cursor: 'pointer',
    // @ts-ignore
    flex: '0 0 calc(50% - 10px)',
    minWidth: 340,
  },
  pillarAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  pillarHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pillarNumber: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  pillarNumberText: {
    fontSize: 20,
    fontWeight: '700',
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  pillarTitleWrap: {
    flex: 1,
  },
  pillarArabic: {
    fontSize: 24,
    color: colors.text.primary,
    marginBottom: 4,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  pillarName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  pillarMeaning: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  pillarIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  pillarExpanded: {
    marginTop: 20,
  },
  pillarDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 20,
  },
  pillarSection: {
    marginBottom: 16,
  },
  pillarSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  pillarDescription: {
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 26,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  pillarExpandHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 4,
  },
  pillarExpandText: {
    fontSize: 12,
    color: colors.text.tertiary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  loadingContainer: {
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
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.error,
    marginTop: 16,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
});
