/**
 * WebAboutContent - About page with luxury styling
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { useWebHover } from '@/hooks/useWebHover';

type ValueCardProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  index: number;
};

const ValueCard: React.FC<ValueCardProps> = ({ icon, title, description, index }) => {
  const hover = useWebHover({
    hoverStyle: {
      transform: 'translateY(-6px)',
      boxShadow: '0 20px 40px rgba(27, 67, 50, 0.15)',
    },
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  return (
    <View
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[
        styles.valueCard,
        hover.style,
        {
          // @ts-ignore
          animation: `fadeInUp 0.5s ease-out ${0.2 + index * 0.1}s forwards`,
          opacity: 0,
        },
      ]}
    >
      <View style={styles.valueIconWrap}>
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Ionicons name={icon} size={28} color={colors.text.white} />
      </View>
      <Text style={styles.valueTitle}>{title}</Text>
      <Text style={styles.valueDescription}>{description}</Text>
    </View>
  );
};

const VALUES = [
  {
    icon: 'shield-checkmark' as const,
    title: 'Authenticity',
    description: 'All content is based on authentic Islamic sources from the Quran and verified Hadith.',
  },
  {
    icon: 'globe' as const,
    title: 'Accessibility',
    description: 'Making Islamic knowledge available to everyone, everywhere, in multiple languages.',
  },
  {
    icon: 'diamond' as const,
    title: 'Excellence',
    description: 'Commitment to quality and beauty in everything we create for the Ummah.',
  },
];

const OFFERINGS = [
  'Comprehensive lessons on the fundamentals of Islam',
  'Easy-to-understand explanations of Quranic verses',
  'Guidance on daily Islamic practices and etiquette',
  'Stories from the lives of the Prophets and companions',
  'Interactive learning tools and memorization aids',
];

export const WebAboutContent: React.FC = () => {
  const { width } = useWindowDimensions();
  const isWide = width >= 1200;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <LinearGradient
          colors={['#0D2818', '#1B4332', '#2D6A4F']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.heroPattern} />
        <View style={styles.heroContent}>
          <Text style={styles.heroSubtitle}>Welcome to</Text>
          <Text style={styles.heroTitle}>Deen Learning</Text>
          <Text style={styles.heroDescription}>
            A comprehensive platform to learn and deepen your understanding of Deen.
            We believe that learning about Islam should be a beautiful and enriching experience.
          </Text>
        </View>
      </View>

      {/* Mission Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <View style={styles.sectionDivider} />
        </View>
        <Text style={styles.missionText}>
          Deen Learning is dedicated to making Islamic knowledge accessible, understandable,
          and engaging for Muslims around the world. We strive to present the teachings of
          Islam in a way that resonates with contemporary learners while staying true to
          authentic sources and traditional scholarship.
        </Text>
      </View>

      {/* What We Offer */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>What We Offer</Text>
          <View style={styles.sectionDivider} />
        </View>
        <View style={styles.offeringsContainer}>
          {OFFERINGS.map((offering, index) => (
            <View
              key={index}
              style={[
                styles.offeringItem,
                {
                  // @ts-ignore
                  animation: `fadeInUp 0.4s ease-out ${0.1 + index * 0.08}s forwards`,
                  opacity: 0,
                },
              ]}
            >
              <View style={styles.offeringBullet}>
                <Ionicons name="checkmark" size={14} color={colors.text.white} />
              </View>
              <Text style={styles.offeringText}>{offering}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Values */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Our Values</Text>
          <View style={styles.sectionDivider} />
        </View>
        <View style={[styles.valuesGrid, isWide && styles.valuesGridWide]}>
          {VALUES.map((value, index) => (
            <ValueCard key={value.title} {...value} index={index} />
          ))}
        </View>
      </View>

      {/* Vision */}
      <View style={styles.visionSection}>
        <LinearGradient
          colors={[`${colors.primary}10`, `${colors.secondary}10`]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.visionContent}>
          <Ionicons name="eye" size={40} color={colors.primary} style={styles.visionIcon} />
          <Text style={styles.visionTitle}>Our Vision</Text>
          <Text style={styles.visionText}>
            We envision a world where every Muslim has the tools and resources they need to
            deepen their understanding of Islam and strengthen their relationship with Allah.
            Through education, community, and dedication, we strive to be a trusted companion
            on your spiritual journey.
          </Text>
        </View>
      </View>

      {/* Footer Quote */}
      <View style={styles.quoteSection}>
        <Text style={styles.quoteArabic}>وَقُل رَّبِّ زِدْنِي عِلْمًا</Text>
        <Text style={styles.quoteTranslation}>"And say: My Lord, increase me in knowledge"</Text>
        <Text style={styles.quoteReference}>— Surah Ta-Ha, 20:114</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  heroSection: {
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 48,
  },
  heroPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    // @ts-ignore
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40z' fill='none' stroke='%23D4A373' stroke-width='1'/%3E%3C/svg%3E")`,
    backgroundSize: '80px 80px',
  },
  heroContent: {
    padding: 60,
    paddingVertical: 80,
    alignItems: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 12,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text.white,
    marginBottom: 20,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  heroDescription: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 32,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  section: {
    paddingHorizontal: 40,
    marginBottom: 48,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  sectionDivider: {
    width: 60,
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  missionText: {
    fontSize: 17,
    color: colors.text.primary,
    lineHeight: 32,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  offeringsContainer: {
    gap: 16,
  },
  offeringItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  offeringBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  offeringText: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 28,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  valuesGrid: {
    gap: 24,
  },
  valuesGridWide: {
    flexDirection: 'row',
  },
  valueCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
    // @ts-ignore
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
  },
  valueIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  valueTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  valueDescription: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  visionSection: {
    marginHorizontal: 40,
    marginBottom: 48,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  visionContent: {
    padding: 48,
    alignItems: 'center',
  },
  visionIcon: {
    marginBottom: 20,
  },
  visionTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 20,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  visionText: {
    fontSize: 17,
    color: colors.text.primary,
    textAlign: 'center',
    maxWidth: 700,
    lineHeight: 32,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  quoteSection: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 40,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quoteArabic: {
    fontSize: 36,
    color: colors.primary,
    marginBottom: 16,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  quoteTranslation: {
    fontSize: 18,
    color: colors.text.primary,
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  quoteReference: {
    fontSize: 14,
    color: colors.text.tertiary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
});
