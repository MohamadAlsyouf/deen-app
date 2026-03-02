/**
 * DuaScreen - Dua/Supplication feature screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Header, Card } from '@/components';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { duaService } from '@/services/duaService';
import type { Dua, DuaCategory, DuaCategoryInfo } from '@/types/dua';

// Category card component
const CategoryCard: React.FC<{
  category: DuaCategoryInfo;
  isActive: boolean;
  onPress: () => void;
}> = ({ category, isActive, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.categoryCard}>
      <LinearGradient
        colors={isActive ? category.gradientColors : ['#F5F5F5', '#EEEEEE']}
        style={styles.categoryCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[
          styles.categoryIcon,
          { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : `${category.gradientColors[0]}15` }
        ]}>
          <Ionicons
            name={category.icon as any}
            size={24}
            color={isActive ? 'rgba(255,255,255,0.95)' : category.gradientColors[0]}
          />
        </View>
        <View style={styles.categoryContent}>
          <Text style={[styles.categoryArabic, isActive && styles.categoryArabicActive]}>
            {category.titleArabic}
          </Text>
          <Text style={[styles.categoryTitle, isActive && styles.categoryTitleActive]}>
            {category.title}
          </Text>
        </View>
        <View style={[
          styles.categoryBadge,
          { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : `${category.gradientColors[0]}15` }
        ]}>
          <Text style={[styles.categoryCount, isActive && styles.categoryCountActive]}>
            {category.count}
          </Text>
        </View>
        {isActive && (
          <Ionicons name="checkmark-circle" size={20} color="rgba(255,255,255,0.9)" />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Dua card component
const DuaCard: React.FC<{
  dua: Dua;
  index: number;
  gradientColors: [string, string];
}> = ({ dua, index, gradientColors }) => {
  const [expanded, setExpanded] = useState(false);
  const benefits = dua.benefits || dua.fawaid;

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.95}
      style={styles.duaCard}
    >
      <View style={[styles.duaAccent, { backgroundColor: gradientColors[0] }]} />

      {/* Header */}
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
                <Ionicons name="sparkles" size={14} color={gradientColors[0]} />
                <Text style={[styles.duaSectionTitle, { color: gradientColors[0] }]}>Benefits</Text>
              </View>
              <Text style={styles.duaSectionText}>{benefits}</Text>
            </View>
          )}

          {dua.source && (
            <View style={styles.duaSection}>
              <View style={styles.duaSectionHeader}>
                <Ionicons name="book-outline" size={14} color={gradientColors[0]} />
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
            {expanded ? 'Tap to collapse' : 'Tap for more'}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.text.tertiary}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

export const DuaScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<DuaCategory>('morning');

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
        {/* Page intro */}
        <Card style={styles.introCard}>
          <View style={styles.introHeader}>
            <View style={[styles.introIcon, { backgroundColor: `${activeGradient[0]}15` }]}>
              <Ionicons name="hand-left" size={28} color={activeGradient[0]} />
            </View>
            <View style={styles.introTextWrap}>
              <Text style={styles.introArabic}>الدعاء والذكر</Text>
              <Text style={styles.introTitle}>Daily Supplications</Text>
            </View>
          </View>
          <Text style={styles.introDescription}>
            Strengthen your connection with Allah through morning, evening, and daily remembrance.
          </Text>
        </Card>

        {/* Categories */}
        {categoriesQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={activeGradient[0]} />
          </View>
        ) : categoriesQuery.data && (
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionLabel}>Categories</Text>
            {categoriesQuery.data.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isActive={activeCategory === category.id}
                onPress={() => setActiveCategory(category.id as DuaCategory)}
              />
            ))}
          </View>
        )}

        {/* Duas */}
        {duasQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={activeGradient[0]} />
            <Text style={styles.loadingText}>Loading duas...</Text>
          </View>
        ) : duasQuery.isError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={styles.errorTitle}>Failed to load</Text>
          </View>
        ) : duasQuery.data && (
          <View style={styles.duasSection}>
            <Text style={[styles.sectionLabel, { color: activeGradient[0] }]}>
              {categoriesQuery.data?.find(c => c.id === activeCategory)?.title || 'Duas'}
            </Text>
            {duasQuery.data.map((dua, index) => (
              <DuaCard
                key={`${activeCategory}-${index}`}
                dua={dua}
                index={index}
                gradientColors={activeGradient}
              />
            ))}
          </View>
        )}
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
    paddingBottom: spacing.xl * 2,
  },

  // Intro card
  introCard: {
    marginBottom: spacing.lg,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  introIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  introTextWrap: {
    flex: 1,
  },
  introArabic: {
    fontSize: 20,
    color: colors.text.primary,
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

  // Section label
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },

  // Categories section
  categoriesSection: {
    marginBottom: spacing.lg,
  },
  categoryCard: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  categoryContent: {
    flex: 1,
  },
  categoryArabic: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 2,
  },
  categoryArabicActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  categoryTitleActive: {
    color: colors.text.white,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  categoryCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  categoryCountActive: {
    color: colors.text.white,
  },

  // Duas section
  duasSection: {
    marginTop: spacing.md,
  },
  duaCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  duaAccent: {
    height: 3,
    width: '100%',
  },
  duaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    paddingBottom: 0,
  },
  duaIndex: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  duaIndexText: {
    fontSize: 14,
    fontWeight: '700',
  },
  duaTitleWrap: {
    flex: 1,
  },
  duaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
  },
  duaNoteBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  duaNoteText: {
    fontSize: 11,
    fontWeight: '600',
  },
  duaArabicContainer: {
    backgroundColor: '#FAFAFA',
    margin: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  duaArabic: {
    fontSize: 22,
    color: colors.text.primary,
    textAlign: 'right',
    lineHeight: 40,
  },
  duaLatin: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  duaTranslation: {
    fontSize: 14,
    color: colors.text.primary,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  duaExpanded: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  duaDivider: {
    height: 1,
    marginBottom: spacing.md,
  },
  duaSection: {
    marginBottom: spacing.sm,
  },
  duaSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  duaSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  duaSectionText: {
    fontSize: 13,
    color: colors.text.primary,
    lineHeight: 20,
  },
  duaSourceText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  duaExpandHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  duaExpandText: {
    fontSize: 12,
    color: colors.text.tertiary,
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },

  // Error
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginTop: spacing.md,
  },
});
