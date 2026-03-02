import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useBookmarks } from '@/contexts/BookmarkContext';
import type { VerseBookmark, ChapterBookmark } from '@/types/bookmark';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Nav = StackNavigationProp<RootStackParamList>;

type Tab = 'all' | 'verses' | 'chapters';

const TABS: { key: Tab; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'all', label: 'All', icon: 'layers-outline' },
  { key: 'verses', label: 'Verses', icon: 'book-outline' },
  { key: 'chapters', label: 'Chapters', icon: 'library-outline' },
];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const VerseCard: React.FC<{
  bookmark: VerseBookmark;
  onPress: () => void;
  onRemove: () => void;
}> = ({ bookmark, onPress, onRemove }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 100, friction: 8 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.cardAccent} />
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>{bookmark.verseKey}</Text>
            </View>
            <View style={styles.cardMeta}>
              <Text style={styles.cardMetaText}>{formatDate(bookmark.bookmarkedAt)}</Text>
              <TouchableOpacity
                onPress={onRemove}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.removeBtn}
              >
                <Ionicons name="bookmark" size={18} color={colors.accent} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.arabicText} numberOfLines={2}>
            {bookmark.arabicText}
          </Text>

          {bookmark.translationPreview.length > 0 && (
            <Text style={styles.translationText} numberOfLines={2}>
              {bookmark.translationPreview}
            </Text>
          )}

          <View style={styles.cardFooter}>
            <Ionicons name="book-outline" size={13} color={colors.text.tertiary} />
            <Text style={styles.cardChapterName}>{bookmark.chapterName}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ChapterCard: React.FC<{
  bookmark: ChapterBookmark;
  onPress: () => void;
  onRemove: () => void;
}> = ({ bookmark, onPress, onRemove }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 100, friction: 8 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.chapterCard}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={[colors.gradient.start, colors.gradient.end]}
          style={styles.chapterGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.chapterTop}>
            <View style={styles.chapterBadge}>
              <Text style={styles.chapterBadgeText}>{bookmark.chapterId}</Text>
            </View>
            <TouchableOpacity
              onPress={onRemove}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="bookmark" size={20} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>

          <Text style={styles.chapterArabicName}>{bookmark.chapterArabicName}</Text>
          <Text style={styles.chapterEnglishName}>{bookmark.chapterName}</Text>

          <View style={styles.chapterBottom}>
            <Text style={styles.chapterVersesCount}>{bookmark.versesCount} verses</Text>
            <Text style={styles.chapterDate}>{formatDate(bookmark.bookmarkedAt)}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const EmptyState: React.FC<{ tab: Tab }> = ({ tab }) => {
  const message =
    tab === 'verses'
      ? 'No verses bookmarked yet.\nTap the bookmark icon on any verse to save it here.'
      : tab === 'chapters'
      ? 'No chapters bookmarked yet.\nTap the bookmark icon on any chapter page to save it here.'
      : 'No bookmarks yet.\nStart saving your favorite verses and chapters.';

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="bookmark-outline" size={48} color={colors.text.disabled} />
      </View>
      <Text style={styles.emptyTitle}>
        {tab === 'all' ? 'No Bookmarks' : tab === 'verses' ? 'No Verses' : 'No Chapters'}
      </Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
};

export const BookmarksScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { bookmarks, toggleVerseBookmark, toggleChapterBookmark } = useBookmarks();
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const filteredBookmarks = bookmarks.filter((b) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'verses') return b.type === 'verse';
    return b.type === 'chapter';
  });

  const handleVersePress = useCallback(
    (b: VerseBookmark) => {
      navigation.navigate('QuranChapter', {
        chapterId: b.chapterId,
        chapterName: b.chapterName,
        chapterArabicName: b.chapterArabicName,
        scrollToVerse: b.verseNumber,
      });
    },
    [navigation],
  );

  const handleChapterPress = useCallback(
    (b: ChapterBookmark) => {
      navigation.navigate('QuranChapter', {
        chapterId: b.chapterId,
        chapterName: b.chapterName,
        chapterArabicName: b.chapterArabicName,
      });
    },
    [navigation],
  );

  const handleRemoveVerse = useCallback(
    (b: VerseBookmark) => {
      toggleVerseBookmark({
        verseKey: b.verseKey,
        chapterId: b.chapterId,
        chapterName: b.chapterName,
        chapterArabicName: b.chapterArabicName,
        verseNumber: b.verseNumber,
        arabicText: b.arabicText,
        translationPreview: b.translationPreview,
      });
    },
    [toggleVerseBookmark],
  );

  const handleRemoveChapter = useCallback(
    (b: ChapterBookmark) => {
      toggleChapterBookmark({
        chapterId: b.chapterId,
        chapterName: b.chapterName,
        chapterArabicName: b.chapterArabicName,
        versesCount: b.versesCount,
      });
    },
    [toggleChapterBookmark],
  );

  const verseCount = bookmarks.filter((b) => b.type === 'verse').length;
  const chapterCount = bookmarks.filter((b) => b.type === 'chapter').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Bookmarks"
        leftAction={{ iconName: 'arrow-back', onPress: () => navigation.goBack() }}
      />

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count =
            tab.key === 'all' ? bookmarks.length : tab.key === 'verses' ? verseCount : chapterCount;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={isActive ? colors.primary : colors.text.tertiary}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                  <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredBookmarks.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          filteredBookmarks.map((bookmark, index) => {
            if (bookmark.type === 'verse') {
              return (
                <VerseCard
                  key={`verse-${bookmark.verseKey}`}
                  bookmark={bookmark}
                  onPress={() => handleVersePress(bookmark)}
                  onRemove={() => handleRemoveVerse(bookmark)}
                />
              );
            }
            return (
              <ChapterCard
                key={`chapter-${bookmark.chapterId}`}
                bookmark={bookmark}
                onPress={() => handleChapterPress(bookmark)}
                onRemove={() => handleRemoveChapter(bookmark)}
              />
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 6,
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: `${colors.primary}12`,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  tabCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabCountActive: {
    backgroundColor: colors.primary,
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  tabCountTextActive: {
    color: colors.text.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Verse card
  card: {
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
  cardAccent: {
    height: 3,
    backgroundColor: colors.primary,
  },
  cardBody: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.round,
    backgroundColor: `${colors.primary}12`,
  },
  cardBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardMetaText: {
    fontSize: 11,
    color: colors.text.disabled,
  },
  removeBtn: {
    padding: 2,
  },
  arabicText: {
    fontSize: 22,
    lineHeight: 38,
    color: colors.text.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.xs,
  },
  translationText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardChapterName: {
    fontSize: 12,
    color: colors.text.tertiary,
  },

  // Chapter card
  chapterCard: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  chapterGradient: {
    padding: spacing.lg,
  },
  chapterTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  chapterBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.white,
  },
  chapterArabicName: {
    fontSize: 28,
    color: colors.text.white,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  chapterEnglishName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: spacing.md,
  },
  chapterBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chapterVersesCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  chapterDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
