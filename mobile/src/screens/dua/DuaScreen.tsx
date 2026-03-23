import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Header, Card } from '@/components';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { duaService } from '@/services/duaService';
import type { Dua, DuaCategoryInfo } from '@/types/dua';

const CategoryCard: React.FC<{
  category: DuaCategoryInfo;
  onPress: () => void;
}> = ({ category, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.categoryCardWrap}>
    <Card style={styles.categoryCard}>
      <View style={[styles.categoryIconWrap, { backgroundColor: `${category.gradientColors[0]}14` }]}>
        <Ionicons name={category.icon as any} size={22} color={category.gradientColors[0]} />
      </View>
      <Text style={styles.categoryTitle}>{category.title}</Text>
      <Text style={styles.categoryArabic}>{category.titleArabic}</Text>
      <Text style={styles.categoryCount}>{category.count} duas</Text>
    </Card>
  </TouchableOpacity>
);

const DuaListItem: React.FC<{
  dua: Dua;
  index: number;
  accentColor: string;
}> = ({ dua, index, accentColor }) => {
  const [expanded, setExpanded] = useState(false);
  const benefits = dua.benefits || dua.fawaid;

  return (
    <TouchableOpacity
      onPress={() => setExpanded((value) => !value)}
      activeOpacity={0.92}
      style={styles.duaItem}
    >
      <View style={styles.duaItemTop}>
        <View style={styles.duaItemHeading}>
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

        <View style={styles.chevronWrap}>
          <Ionicons
            name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={20}
            color={colors.text.tertiary}
          />
        </View>
      </View>

      {expanded ? (
        <View style={styles.duaExpandedContent}>
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

export const DuaScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['dua-categories'],
    queryFn: duaService.getCategories,
  });

  const categories = categoriesQuery.data ?? [];
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? null;
  const activeCategory = selectedCategoryId ? selectedCategory : null;

  const duasQuery = useQuery({
    queryKey: ['duas', selectedCategoryId],
    queryFn: () => duaService.getDuasByCategory(selectedCategoryId ?? ''),
    enabled: Boolean(selectedCategoryId),
  });

  const featuredCategories = useMemo(
    () => categories.filter((category) => category.featured),
    [categories]
  );
  const allCategories = useMemo(
    () => categories.filter((category) => !category.featured),
    [categories]
  );

  const currentAccent = activeCategory?.gradientColors[0] ?? colors.primary;

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Header
          title="Dua & Dhikr"
          leftAction={{
            iconName: 'arrow-back',
            onPress: () => navigation.goBack(),
          }}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!selectedCategoryId ? (
          <>
            <Card style={styles.introCard}>
              <View style={styles.introHeader}>
                <View style={styles.introIcon}>
                  <Ionicons name="hand-left-outline" size={26} color={colors.primary} />
                </View>
                <View style={styles.introTextWrap}>
                  <Text style={styles.introArabic}>الدعاء والذكر</Text>
                  <Text style={styles.introTitle}>Supplications & Remembrance</Text>
                </View>
              </View>
              <Text style={styles.introDescription}>
                Explore duas by category first, then open only the supplications relevant to that moment.
              </Text>
            </Card>

            {categoriesQuery.isLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : categoriesQuery.isError ? (
              <View style={styles.errorState}>
                <Ionicons name="alert-circle-outline" size={42} color={colors.error} />
                <Text style={styles.errorTitle}>Failed to load categories</Text>
                <Text style={styles.errorText}>Please try again in a moment.</Text>
              </View>
            ) : (
              <>
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionLabel}>Featured Categories</Text>
                  <View style={styles.categoriesGrid}>
                    {featuredCategories.map((category) => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        onPress={() => setSelectedCategoryId(category.id)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionLabel}>All Categories</Text>
                  <View style={styles.categoriesGrid}>
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
            <TouchableOpacity
              onPress={() => setSelectedCategoryId(null)}
              activeOpacity={0.8}
              style={styles.backToCategories}
            >
              <Ionicons name="arrow-back-outline" size={18} color={currentAccent} />
              <Text style={[styles.backToCategoriesText, { color: currentAccent }]}>
                Back to Categories
              </Text>
            </TouchableOpacity>

            <Card style={styles.categoryHero}>
              <View style={styles.categoryHeroTop}>
                <View style={[styles.categoryHeroIcon, { backgroundColor: `${currentAccent}14` }]}>
                  <Ionicons name={activeCategory.icon as any} size={24} color={currentAccent} />
                </View>
                <View style={styles.categoryHeroText}>
                  <Text style={styles.categoryHeroArabic}>{activeCategory.titleArabic}</Text>
                  <Text style={styles.categoryHeroTitle}>{activeCategory.title}</Text>
                </View>
              </View>
              <Text style={styles.categoryHeroDescription}>{activeCategory.description}</Text>
              <Text style={[styles.categoryHeroCount, { color: currentAccent }]}>
                {activeCategory.count} supplications
              </Text>
            </Card>

            {duasQuery.isLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color={currentAccent} />
                <Text style={styles.loadingText}>Loading duas...</Text>
              </View>
            ) : duasQuery.isError ? (
              <View style={styles.errorState}>
                <Ionicons name="alert-circle-outline" size={42} color={colors.error} />
                <Text style={styles.errorTitle}>Failed to load duas</Text>
                <Text style={styles.errorText}>Please try another category or retry shortly.</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  introCard: {
    marginBottom: spacing.lg,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  introIcon: {
    width: 54,
    height: 54,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}14`,
    marginRight: spacing.md,
  },
  introTextWrap: {
    flex: 1,
  },
  introArabic: {
    fontSize: 18,
    color: colors.primary,
    marginBottom: 2,
  },
  introTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  introDescription: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  sectionBlock: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  categoryCardWrap: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  categoryCard: {
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  categoryIconWrap: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  categoryTitle: {
    ...typography.h4,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
    minHeight: 46,
  },
  categoryArabic: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  categoryCount: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  errorTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  errorText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  backToCategories: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  backToCategoriesText: {
    ...typography.body,
    fontWeight: '600',
  },
  categoryHero: {
    marginBottom: spacing.lg,
  },
  categoryHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryHeroIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  categoryHeroText: {
    flex: 1,
  },
  categoryHeroArabic: {
    fontSize: 18,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  categoryHeroTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  categoryHeroDescription: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  categoryHeroCount: {
    ...typography.caption,
    fontWeight: '700',
  },
  duaList: {
    gap: spacing.md,
  },
  duaItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  duaItemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  duaItemHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: spacing.sm,
  },
  duaIndexBadge: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  duaIndexText: {
    ...typography.caption,
    fontWeight: '700',
  },
  duaTitleWrap: {
    flex: 1,
  },
  duaTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: 6,
  },
  noteBadge: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  noteBadgeText: {
    ...typography.caption,
    fontWeight: '700',
  },
  chevronWrap: {
    paddingTop: 2,
  },
  duaExpandedContent: {
    marginTop: spacing.md,
  },
  inlineDivider: {
    height: 1,
    marginBottom: spacing.md,
  },
  duaArabicText: {
    fontSize: 28,
    lineHeight: 44,
    textAlign: 'right',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  duaLatinText: {
    ...typography.body,
    color: colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  duaTranslationText: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 24,
  },
  metaBlock: {
    marginTop: spacing.md,
  },
  metaLabel: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaText: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },
});
