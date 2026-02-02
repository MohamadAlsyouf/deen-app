/**
 * WebDuaContent - Dua/Supplication with beautiful UI
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
import { colors, borderRadius } from '@/theme';
import { useWebHover } from '@/hooks/useWebHover';
import { duaService } from '@/services/duaService';
import type { Dua, DuaCategory, DuaCategoryInfo } from '@/types/dua';

// Category card component
interface CategoryCardProps {
  category: DuaCategoryInfo;
  isActive: boolean;
  onPress: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, isActive, onPress }) => {
  const hover = useWebHover({
    hoverStyle: isActive ? {} : {
      transform: 'translateY(-4px) scale(1.02)',
      boxShadow: '0 16px 32px rgba(0, 0, 0, 0.15)',
    },
    transition: 'all 0.3s ease-out',
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[styles.categoryCard, hover.style]}
    >
      <LinearGradient
        colors={isActive ? category.gradientColors : ['#F8F9FA', '#E9ECEF']}
        style={styles.categoryCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[
          styles.categoryIconWrap,
          { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : `${category.gradientColors[0]}15` }
        ]}>
          <Ionicons
            name={category.icon as any}
            size={28}
            color={isActive ? 'rgba(255,255,255,0.95)' : category.gradientColors[0]}
          />
        </View>
        <Text style={[styles.categoryArabic, isActive && styles.categoryArabicActive]}>
          {category.titleArabic}
        </Text>
        <Text style={[styles.categoryTitle, isActive && styles.categoryTitleActive]}>
          {category.title}
        </Text>
        <Text style={[styles.categoryDescription, isActive && styles.categoryDescriptionActive]}>
          {category.description}
        </Text>
        <View style={[
          styles.categoryCount,
          { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : `${category.gradientColors[0]}15` }
        ]}>
          <Text style={[styles.categoryCountText, isActive && styles.categoryCountTextActive]}>
            {category.count} duas
          </Text>
        </View>
        {isActive && (
          <View style={styles.activeCheck}>
            <Ionicons name="checkmark-circle" size={24} color="rgba(255,255,255,0.9)" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Dua card component
interface DuaCardProps {
  dua: Dua;
  index: number;
  gradientColors: [string, string];
}

const DuaCard: React.FC<DuaCardProps> = ({ dua, index, gradientColors }) => {
  const [expanded, setExpanded] = useState(false);

  const hover = useWebHover({
    hoverStyle: {
      transform: 'translateY(-4px)',
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12)',
    },
    transition: 'all 0.3s ease-out',
  });

  const benefits = dua.benefits || dua.fawaid;

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.95}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[
        styles.duaCard,
        hover.style,
        {
          // @ts-ignore
          animationName: 'fadeInUp',
          animationDuration: '0.5s',
          animationTimingFunction: 'ease-out',
          animationFillMode: 'forwards',
          animationDelay: `${index * 0.05}s`,
          opacity: 0,
        },
      ]}
    >
      {/* Header with gradient accent */}
      <View style={[styles.duaAccent, { backgroundColor: gradientColors[0] }]} />

      <View style={styles.duaContent}>
        {/* Title and notes */}
        <View style={styles.duaHeader}>
          <View style={[styles.duaIndex, { backgroundColor: `${gradientColors[0]}15` }]}>
            <Text style={[styles.duaIndexText, { color: gradientColors[0] }]}>{index + 1}</Text>
          </View>
          <View style={styles.duaTitleWrap}>
            <Text style={styles.duaTitle}>{dua.title}</Text>
            {dua.notes && (
              <View style={[styles.duaNoteBadge, { backgroundColor: `${gradientColors[0]}15` }]}>
                <Text style={[styles.duaNoteText, { color: gradientColors[0] }]}>{dua.notes}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Arabic text */}
        <View style={styles.duaArabicContainer}>
          <Text style={styles.duaArabic}>{dua.arabic}</Text>
        </View>

        {/* Transliteration */}
        <Text style={styles.duaLatin}>{dua.latin}</Text>

        {/* Translation */}
        <Text style={styles.duaTranslation}>{dua.translation}</Text>

        {/* Expanded content */}
        {expanded && (benefits || dua.source) && (
          <View style={styles.duaExpanded}>
            <View style={[styles.duaDivider, { backgroundColor: `${gradientColors[0]}30` }]} />

            {benefits && (
              <View style={styles.duaSection}>
                <View style={styles.duaSectionHeader}>
                  <Ionicons name="sparkles" size={16} color={gradientColors[0]} />
                  <Text style={[styles.duaSectionTitle, { color: gradientColors[0] }]}>Benefits</Text>
                </View>
                <Text style={styles.duaSectionText}>{benefits}</Text>
              </View>
            )}

            {dua.source && (
              <View style={styles.duaSection}>
                <View style={styles.duaSectionHeader}>
                  <Ionicons name="book-outline" size={16} color={gradientColors[0]} />
                  <Text style={[styles.duaSectionTitle, { color: gradientColors[0] }]}>Source</Text>
                </View>
                <Text style={styles.duaSourceText}>{dua.source}</Text>
              </View>
            )}
          </View>
        )}

        {/* Expand hint */}
        {(benefits || dua.source) && (
          <View style={styles.duaExpandHint}>
            <Text style={styles.duaExpandText}>
              {expanded ? 'Tap to collapse' : 'Tap for benefits & source'}
            </Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.text.tertiary}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const WebDuaContent: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<DuaCategory>('morning');
  const { width } = useWindowDimensions();

  const isCompact = width < 600;
  const isMedium = width >= 600 && width < 900;
  const isWide = width >= 900;

  // Fetch categories
  const categoriesQuery = useQuery({
    queryKey: ['dua-categories'],
    queryFn: duaService.getCategories,
  });

  // Fetch duas for active category
  const duasQuery = useQuery({
    queryKey: ['duas', activeCategory],
    queryFn: () => duaService.getDuasByCategory(activeCategory),
  });

  const activeGradient: [string, string] = categoriesQuery.data?.find(c => c.id === activeCategory)?.gradientColors || ['#667eea', '#764ba2'];

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
        <View style={[styles.pageHeaderIcon, { backgroundColor: `${activeGradient[0]}12` }]}>
          <Ionicons name="hand-left" size={36} color={activeGradient[0]} />
        </View>
        <Text style={styles.pageTitle}>Dua & Dhikr</Text>
        <Text style={styles.pageArabic}>الدعاء والذكر</Text>
        <Text style={styles.pageSubtitle}>
          Strengthen your connection with Allah through daily supplications and remembrance
        </Text>
      </View>

      {/* Categories */}
      {categoriesQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={activeGradient[0]} />
        </View>
      ) : categoriesQuery.data && (
        <>
          <Text style={styles.sectionTitle}>Select a Category</Text>
          <View style={[
            styles.categoriesGrid,
            isMedium && styles.categoriesGridMedium,
            isWide && styles.categoriesGridWide,
          ]}>
            {categoriesQuery.data.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isActive={activeCategory === category.id}
                onPress={() => setActiveCategory(category.id as DuaCategory)}
              />
            ))}
          </View>
        </>
      )}

      {/* Duas List */}
      {duasQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={activeGradient[0]} />
          <Text style={styles.loadingText}>Loading duas...</Text>
        </View>
      ) : duasQuery.isError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.errorTitle}>Failed to load duas</Text>
          <Text style={styles.errorText}>Please try again later</Text>
        </View>
      ) : duasQuery.data && (
        <View style={styles.duasSection}>
          <View style={styles.duasSectionHeader}>
            <Text style={[styles.duasSectionTitle, { color: activeGradient[0] }]}>
              {categoriesQuery.data?.find(c => c.id === activeCategory)?.title || 'Duas'}
            </Text>
            <Text style={styles.duasSectionSubtitle}>
              {duasQuery.data.length} supplications
            </Text>
          </View>

          <View style={styles.duasList}>
            {duasQuery.data.map((dua, index) => (
              <DuaCard
                key={`${activeCategory}-${index}`}
                dua={dua}
                index={index}
                gradientColors={activeGradient}
              />
            ))}
          </View>
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
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  pageArabic: {
    fontSize: 32,
    color: colors.primary,
    marginBottom: 16,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
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

  // Section title
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 20,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },

  // Categories grid
  categoriesGrid: {
    gap: 20,
    marginBottom: 48,
    // @ts-ignore
    display: 'grid',
    gridTemplateColumns: '1fr',
  },
  categoriesGridMedium: {
    // @ts-ignore
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
  categoriesGridWide: {
    // @ts-ignore
    gridTemplateColumns: 'repeat(4, 1fr)',
  },

  // Category card
  categoryCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    // @ts-ignore
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
  },
  categoryCardGradient: {
    padding: 24,
    position: 'relative',
  },
  categoryIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  categoryArabic: {
    fontSize: 22,
    color: colors.text.primary,
    marginBottom: 4,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  categoryArabicActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  categoryTitleActive: {
    color: colors.text.white,
  },
  categoryDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 16,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  categoryDescriptionActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  categoryCount: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryCountText: {
    fontSize: 13,
    fontWeight: '600',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  categoryCountTextActive: {
    color: colors.text.white,
  },
  activeCheck: {
    position: 'absolute',
    top: 16,
    right: 16,
  },

  // Duas section
  duasSection: {
    marginTop: 16,
  },
  duasSectionHeader: {
    marginBottom: 24,
  },
  duasSectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  duasSectionSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },

  // Duas list
  duasList: {
    gap: 20,
  },

  // Dua card
  duaCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    // @ts-ignore
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    cursor: 'pointer',
  },
  duaAccent: {
    height: 4,
    width: '100%',
  },
  duaContent: {
    padding: 24,
  },
  duaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  duaIndex: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  duaIndexText: {
    fontSize: 16,
    fontWeight: '700',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  duaTitleWrap: {
    flex: 1,
  },
  duaTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  duaNoteBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  duaNoteText: {
    fontSize: 12,
    fontWeight: '600',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  duaArabicContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  duaArabic: {
    fontSize: 26,
    color: colors.text.primary,
    textAlign: 'right',
    lineHeight: 48,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
    direction: 'rtl',
  },
  duaLatin: {
    fontSize: 15,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 24,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  duaTranslation: {
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 26,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  duaExpanded: {
    marginTop: 20,
  },
  duaDivider: {
    height: 1,
    marginBottom: 20,
  },
  duaSection: {
    marginBottom: 16,
  },
  duaSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  duaSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  duaSectionText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 24,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  duaSourceText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontStyle: 'italic',
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  duaExpandHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  duaExpandText: {
    fontSize: 13,
    color: colors.text.tertiary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 16,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },

  // Error
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.error,
    marginTop: 16,
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
