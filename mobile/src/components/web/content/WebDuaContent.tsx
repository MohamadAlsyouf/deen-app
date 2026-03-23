import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors, borderRadius } from '@/theme';
import { useWebHover } from '@/hooks/useWebHover';
import { duaService } from '@/services/duaService';
import type { Dua, DuaCategoryInfo } from '@/types/dua';

const CategoryCard: React.FC<{
  category: DuaCategoryInfo;
  onPress: () => void;
}> = ({ category, onPress }) => {
  const hover = useWebHover({
    hoverStyle: {
      transform: 'translateY(-4px)',
      boxShadow: '0 16px 36px rgba(0, 0, 0, 0.12)',
    },
    transition: 'all 0.25s ease-out',
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[styles.categoryCard, hover.style]}
    >
      <View style={styles.categoryTopRow}>
        <View style={[styles.categoryIconWrap, { backgroundColor: `${category.gradientColors[0]}14` }]}>
          <Ionicons name={category.icon as any} size={24} color={category.gradientColors[0]} />
        </View>
        <View style={[styles.categoryCountBadge, { backgroundColor: `${category.gradientColors[0]}14` }]}>
          <Text style={[styles.categoryCountBadgeText, { color: category.gradientColors[0] }]}>
            {category.count} duas
          </Text>
        </View>
      </View>
      <Text style={styles.categoryTitle}>{category.title}</Text>
      <Text style={styles.categoryArabic}>{category.titleArabic}</Text>
      <Text style={styles.categoryDescription}>{category.description}</Text>
    </TouchableOpacity>
  );
};

const DuaListItem: React.FC<{
  dua: Dua;
  index: number;
  accentColor: string;
}> = ({ dua, index, accentColor }) => {
  const [expanded, setExpanded] = useState(false);
  const hover = useWebHover({
    hoverStyle: {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 28px rgba(0, 0, 0, 0.08)',
    },
    transition: 'all 0.2s ease-out',
  });
  const benefits = dua.benefits || dua.fawaid;

  return (
    <TouchableOpacity
      onPress={() => setExpanded((value) => !value)}
      activeOpacity={0.94}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[styles.duaItem, hover.style]}
    >
      <View style={styles.duaItemTop}>
        <View style={styles.duaTitleSection}>
          <View style={[styles.duaIndexBadge, { backgroundColor: `${accentColor}14` }]}>
            <Text style={[styles.duaIndexText, { color: accentColor }]}>{index + 1}</Text>
          </View>
          <View style={styles.duaTitleWrap}>
            <Text style={styles.duaTitle}>{dua.title}</Text>
            {dua.notes ? (
              <View style={[styles.noteBadge, { backgroundColor: `${accentColor}14` }]}>
                <Text style={[styles.noteBadgeText, { color: accentColor }]}>{dua.notes}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Ionicons
          name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={20}
          color={colors.text.tertiary}
        />
      </View>

      {expanded ? (
        <View style={styles.duaExpanded}>
          <View style={[styles.inlineDivider, { backgroundColor: `${accentColor}22` }]} />
          <Text style={styles.duaArabicText}>{dua.arabic}</Text>
          <Text style={styles.duaLatinText}>{dua.latin}</Text>
          <Text style={styles.duaTranslationText}>{dua.translation}</Text>

          {benefits ? (
            <View style={styles.metaBlock}>
              <Text style={[styles.metaLabel, { color: accentColor }]}>Benefits</Text>
              <Text style={styles.metaText}>{benefits}</Text>
            </View>
          ) : null}

          {dua.source ? (
            <View style={styles.metaBlock}>
              <Text style={[styles.metaLabel, { color: accentColor }]}>Source</Text>
              <Text style={styles.metaText}>{dua.source}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

export const WebDuaContent: React.FC = () => {
  const { width } = useWindowDimensions();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['dua-categories'],
    queryFn: duaService.getCategories,
  });

  const categories = categoriesQuery.data ?? [];
  const featuredCategories = useMemo(
    () => categories.filter((category) => category.featured),
    [categories]
  );
  const allCategories = useMemo(
    () => categories.filter((category) => !category.featured),
    [categories]
  );

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? null;
  const activeCategory = selectedCategoryId ? selectedCategory : null;

  const duasQuery = useQuery({
    queryKey: ['duas', selectedCategoryId],
    queryFn: () => duaService.getDuasByCategory(selectedCategoryId ?? ''),
    enabled: Boolean(selectedCategoryId),
  });

  const currentAccent = activeCategory?.gradientColors[0] ?? colors.primary;
  const featuredColumns = width < 900 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)';
  const allColumns = width < 780 ? 'repeat(2, 1fr)' : width < 1120 ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)';

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {!selectedCategoryId ? (
        <>
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="hand-left-outline" size={34} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Dua & Dhikr</Text>
            <Text style={styles.heroArabic}>الدعاء والذكر</Text>
            <Text style={styles.heroSubtitle}>
              Start from categories, then open only the supplications that fit that moment in your day.
            </Text>
          </View>

          {categoriesQuery.isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading categories...</Text>
            </View>
          ) : categoriesQuery.isError ? (
            <View style={styles.errorState}>
              <Ionicons name="alert-circle-outline" size={56} color={colors.error} />
              <Text style={styles.errorTitle}>Failed to load categories</Text>
              <Text style={styles.errorText}>Please try again later.</Text>
            </View>
          ) : (
            <>
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>Main Categories</Text>
                <View
                  style={[
                    styles.categoryGrid,
                    // @ts-ignore
                    { gridTemplateColumns: featuredColumns },
                  ]}
                >
                  {featuredCategories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onPress={() => setSelectedCategoryId(category.id)}
                    />
                  ))}
                </View>
              </View>

              <View style={[styles.sectionBlock, styles.allCategoriesSection]}>
                <Text style={styles.sectionLabel}>All Categories</Text>
                <View
                  style={[
                    styles.categoryGrid,
                    // @ts-ignore
                    { gridTemplateColumns: allColumns },
                  ]}
                >
                  {allCategories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onPress={() => setSelectedCategoryId(category.id)}
                    />
                  ))}
                </View>
              </View>
            </>
          )}
        </>
      ) : activeCategory ? (
        <>
          <TouchableOpacity onPress={() => setSelectedCategoryId(null)} activeOpacity={0.75} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={18} color={currentAccent} />
            <Text style={[styles.backButtonText, { color: currentAccent }]}>Back to Categories</Text>
          </TouchableOpacity>

          <View style={styles.detailHero}>
            <View style={[styles.detailHeroIcon, { backgroundColor: `${currentAccent}14` }]}>
              <Ionicons name={activeCategory.icon as any} size={24} color={currentAccent} />
            </View>
            <Text style={styles.detailHeroTitle}>{activeCategory.title}</Text>
            <Text style={styles.detailHeroArabic}>{activeCategory.titleArabic}</Text>
            <Text style={styles.detailHeroDescription}>{activeCategory.description}</Text>
            <Text style={[styles.detailHeroCount, { color: currentAccent }]}>
              {activeCategory.count} supplications
            </Text>
          </View>

          {duasQuery.isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={currentAccent} />
              <Text style={styles.loadingText}>Loading duas...</Text>
            </View>
          ) : duasQuery.isError ? (
            <View style={styles.errorState}>
              <Ionicons name="alert-circle-outline" size={56} color={colors.error} />
              <Text style={styles.errorTitle}>Failed to load duas</Text>
              <Text style={styles.errorText}>Please try again or select another category.</Text>
            </View>
          ) : (
            <View style={styles.duaList}>
              {(duasQuery.data ?? []).map((dua, index) => (
                <DuaListItem
                  key={`${activeCategory.id}-${index}-${dua.title}`}
                  dua={dua}
                  index={index}
                  accentColor={currentAccent}
                />
              ))}
            </View>
          )}
        </>
      ) : null}
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
    maxWidth: 1240,
    marginHorizontal: 'auto',
    width: '100%',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 36,
  },
  heroIcon: {
    width: 84,
    height: 84,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}12`,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  heroArabic: {
    fontSize: 30,
    color: colors.primary,
    marginBottom: 14,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  heroSubtitle: {
    fontSize: 17,
    lineHeight: 28,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 720,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  sectionBlock: {
    marginBottom: 40,
  },
  allCategoriesSection: {
    marginTop: 26,
    paddingTop: 28,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    marginBottom: 16,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  categoryGrid: {
    // @ts-ignore
    display: 'grid',
    gap: 18,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    height: 292,
  },
  categoryTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCountBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryCountBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  categoryTitle: {
    fontSize: 23,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
    minHeight: 62,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  categoryArabic: {
    fontSize: 18,
    color: colors.primary,
    marginBottom: 10,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  categoryDescription: {
    fontSize: 14,
    lineHeight: 23,
    color: colors.text.secondary,
    flex: 1,
    marginBottom: 18,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginBottom: 18,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  detailHero: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 28,
    marginBottom: 20,
  },
  detailHeroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  detailHeroTitle: {
    fontSize: 34,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  detailHeroArabic: {
    fontSize: 24,
    color: colors.primary,
    marginBottom: 12,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  detailHeroDescription: {
    fontSize: 15,
    lineHeight: 25,
    color: colors.text.secondary,
    marginBottom: 10,
    maxWidth: 720,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  detailHeroCount: {
    fontSize: 13,
    fontWeight: '700',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  duaList: {
    gap: 14,
  },
  duaItem: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
  },
  duaItemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  duaTitleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  duaIndexBadge: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  duaIndexText: {
    fontSize: 13,
    fontWeight: '700',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  duaTitleWrap: {
    flex: 1,
  },
  duaTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  noteBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  noteBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  duaExpanded: {
    marginTop: 18,
  },
  inlineDivider: {
    height: 1,
    marginBottom: 18,
  },
  duaArabicText: {
    fontSize: 34,
    lineHeight: 56,
    textAlign: 'right',
    color: colors.text.primary,
    marginBottom: 16,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  duaLatinText: {
    fontSize: 15,
    lineHeight: 25,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: 14,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  duaTranslationText: {
    fontSize: 16,
    lineHeight: 27,
    color: colors.text.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  metaBlock: {
    marginTop: 16,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  metaText: {
    fontSize: 14,
    lineHeight: 24,
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 10,
  },
  loadingText: {
    fontSize: 15,
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 14,
    marginBottom: 6,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  errorText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
});
