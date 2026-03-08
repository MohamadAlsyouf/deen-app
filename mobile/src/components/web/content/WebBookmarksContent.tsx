import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius } from '@/theme';
import { useWebHover } from '@/hooks/useWebHover';
import { useBookmarks } from '@/contexts/BookmarkContext';
import type { VerseBookmark, ChapterBookmark } from '@/types/bookmark';

type Tab = 'all' | 'verses' | 'chapters';

type WebBookmarksContentProps = {
  onOpenChapter: (params: {
    chapterId: number;
    chapterName: string;
    chapterArabicName: string;
    scrollToVerse?: number;
  }) => void;
};

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

const FilterChip: React.FC<{
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  count: number;
  active: boolean;
  onPress: () => void;
}> = ({ label, icon, count, active, onPress }) => {
  const hover = useWebHover({
    hoverStyle: active ? {} : { transform: 'translateY(-1px)', backgroundColor: '#F7FAF8' },
    transition: 'all 0.2s ease-out',
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[styles.filterChip, active && styles.filterChipActive, hover.style]}
    >
      <Ionicons name={icon} size={16} color={active ? colors.primary : colors.text.tertiary} />
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
      <View style={[styles.filterCount, active && styles.filterCountActive]}>
        <Text style={[styles.filterCountText, active && styles.filterCountTextActive]}>{count}</Text>
      </View>
    </TouchableOpacity>
  );
};

const VerseBookmarkCard: React.FC<{
  bookmark: VerseBookmark;
  index: number;
  onOpen: () => void;
  onRemove: () => void;
}> = ({ bookmark, index, onOpen, onRemove }) => {
  const hover = useWebHover({
    hoverStyle: {
      transform: 'translateY(-4px)',
      boxShadow: '0 18px 40px rgba(27, 67, 50, 0.12)',
    },
    transition: 'all 0.25s ease-out',
  });

  return (
    <TouchableOpacity
      onPress={onOpen}
      activeOpacity={0.92}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[
        styles.verseCard,
        hover.style,
        {
          // @ts-ignore
          animation: `fadeInUp 0.35s ease-out ${0.04 * Math.min(index, 12)}s forwards`,
          opacity: 0,
        },
      ]}
    >
      <View style={styles.verseAccent} />
      <View style={styles.verseCardBody}>
        <View style={styles.verseCardHeader}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{bookmark.verseKey}</Text>
          </View>
          <View style={styles.verseCardMeta}>
            <Text style={styles.timestamp}>{formatDate(bookmark.bookmarkedAt)}</Text>
            <TouchableOpacity onPress={onRemove} activeOpacity={0.8} style={styles.removeButton}>
              <Ionicons name="bookmark" size={18} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.verseArabic} numberOfLines={2}>
          {bookmark.arabicText}
        </Text>

        {bookmark.translationPreview ? (
          <Text style={styles.verseTranslation} numberOfLines={2}>
            {bookmark.translationPreview}
          </Text>
        ) : null}

        <View style={styles.verseCardFooter}>
          <View style={styles.chapterTag}>
            <Ionicons name="book-outline" size={13} color={colors.primary} />
            <Text style={styles.chapterTagText}>{bookmark.chapterName}</Text>
          </View>
          <View style={styles.jumpHint}>
            <Text style={styles.jumpHintText}>Jump to verse</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.text.tertiary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ChapterBookmarkCard: React.FC<{
  bookmark: ChapterBookmark;
  index: number;
  onOpen: () => void;
  onRemove: () => void;
}> = ({ bookmark, index, onOpen, onRemove }) => {
  const hover = useWebHover({
    hoverStyle: {
      transform: 'translateY(-4px)',
      boxShadow: '0 18px 40px rgba(27, 67, 50, 0.14)',
    },
    transition: 'all 0.25s ease-out',
  });

  return (
    <TouchableOpacity
      onPress={onOpen}
      activeOpacity={0.92}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[
        styles.chapterCard,
        hover.style,
        {
          // @ts-ignore
          animation: `fadeInUp 0.35s ease-out ${0.04 * Math.min(index, 12)}s forwards`,
          opacity: 0,
        },
      ]}
    >
      <LinearGradient
        colors={[colors.gradient.start, colors.gradient.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.chapterCardGradient}
      >
        <View style={styles.chapterCardTop}>
          <View style={styles.chapterNumberBubble}>
            <Text style={styles.chapterNumberBubbleText}>{bookmark.chapterId}</Text>
          </View>
          <TouchableOpacity onPress={onRemove} activeOpacity={0.85} style={styles.chapterRemoveButton}>
            <Ionicons name="bookmark" size={20} color="rgba(255,255,255,0.95)" />
          </TouchableOpacity>
        </View>

        <Text style={styles.chapterArabicName}>{bookmark.chapterArabicName}</Text>
        <Text style={styles.chapterEnglishName}>{bookmark.chapterName}</Text>

        <View style={styles.chapterCardBottom}>
          <Text style={styles.chapterMetaText}>{bookmark.versesCount} verses</Text>
          <Text style={styles.chapterMetaText}>{formatDate(bookmark.bookmarkedAt)}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const EmptyState: React.FC<{ tab: Tab }> = ({ tab }) => {
  const message =
    tab === 'verses'
      ? 'No verses bookmarked yet. Save any ayah to revisit it later here.'
      : tab === 'chapters'
        ? 'No chapters bookmarked yet. Save a chapter from its reading page to keep it close.'
        : 'No bookmarks yet. Save favorite verses and chapters as you explore the Quran.';

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="bookmark-outline" size={42} color={colors.text.disabled} />
      </View>
      <Text style={styles.emptyTitle}>
        {tab === 'all' ? 'No Bookmarks Yet' : tab === 'verses' ? 'No Saved Verses' : 'No Saved Chapters'}
      </Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
};

export const WebBookmarksContent: React.FC<WebBookmarksContentProps> = ({ onOpenChapter }) => {
  const [activeTab, setActiveTab] = React.useState<Tab>('all');
  const { bookmarks, loading, toggleVerseBookmark, toggleChapterBookmark } = useBookmarks();

  const verseCount = useMemo(() => bookmarks.filter((b) => b.type === 'verse').length, [bookmarks]);
  const chapterCount = useMemo(() => bookmarks.filter((b) => b.type === 'chapter').length, [bookmarks]);

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((bookmark) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'verses') return bookmark.type === 'verse';
      return bookmark.type === 'chapter';
    });
  }, [activeTab, bookmarks]);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading bookmarks...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderIcon}>
          <Ionicons name="bookmark" size={28} color={colors.accent} />
        </View>
        <Text style={styles.pageTitle}>Bookmarked Verses & Chapters</Text>
        <Text style={styles.pageSubtitle}>
          Keep your saved ayat and surahs close so you can return to them whenever you like.
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statNumber}>{bookmarks.length}</Text>
            <Text style={styles.statLabel}>saved total</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statNumber}>{verseCount}</Text>
            <Text style={styles.statLabel}>verses</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statNumber}>{chapterCount}</Text>
            <Text style={styles.statLabel}>chapters</Text>
          </View>
        </View>
      </View>

      <View style={styles.filtersRow}>
        {TABS.map((tab) => {
          const count = tab.key === 'all' ? bookmarks.length : tab.key === 'verses' ? verseCount : chapterCount;
          return (
            <FilterChip
              key={tab.key}
              label={tab.label}
              icon={tab.icon}
              count={count}
              active={activeTab === tab.key}
              onPress={() => setActiveTab(tab.key)}
            />
          );
        })}
      </View>

      {filteredBookmarks.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <View style={styles.resultsColumn}>
          {filteredBookmarks.map((bookmark, index) => {
            if (bookmark.type === 'verse') {
              return (
                <VerseBookmarkCard
                  key={`verse-${bookmark.verseKey}`}
                  bookmark={bookmark}
                  index={index}
                  onOpen={() =>
                    onOpenChapter({
                      chapterId: bookmark.chapterId,
                      chapterName: bookmark.chapterName,
                      chapterArabicName: bookmark.chapterArabicName,
                      scrollToVerse: bookmark.verseNumber,
                    })
                  }
                  onRemove={() =>
                    toggleVerseBookmark({
                      verseKey: bookmark.verseKey,
                      chapterId: bookmark.chapterId,
                      chapterName: bookmark.chapterName,
                      chapterArabicName: bookmark.chapterArabicName,
                      verseNumber: bookmark.verseNumber,
                      arabicText: bookmark.arabicText,
                      translationPreview: bookmark.translationPreview,
                    })
                  }
                />
              );
            }

            return (
              <ChapterBookmarkCard
                key={`chapter-${bookmark.chapterId}`}
                bookmark={bookmark}
                index={index}
                onOpen={() =>
                  onOpenChapter({
                    chapterId: bookmark.chapterId,
                    chapterName: bookmark.chapterName,
                    chapterArabicName: bookmark.chapterArabicName,
                  })
                }
                onRemove={() =>
                  toggleChapterBookmark({
                    chapterId: bookmark.chapterId,
                    chapterName: bookmark.chapterName,
                    chapterArabicName: bookmark.chapterArabicName,
                    versesCount: bookmark.versesCount,
                  })
                }
              />
            );
          })}
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
    paddingBottom: 80,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  pageHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  pageHeaderIcon: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: `${colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 10,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  pageSubtitle: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 640,
    marginBottom: 22,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statPill: {
    minWidth: 120,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    // @ts-ignore
    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.04)',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 28,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    // @ts-ignore
    cursor: 'pointer',
  },
  filterChipActive: {
    backgroundColor: `${colors.primary}10`,
    borderColor: `${colors.primary}35`,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  filterChipTextActive: {
    color: colors.primary,
  },
  filterCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterCountActive: {
    backgroundColor: colors.primary,
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  filterCountTextActive: {
    color: colors.text.white,
  },
  resultsColumn: {
    gap: 16,
  },
  verseCard: {
    backgroundColor: colors.background,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    // @ts-ignore
    boxShadow: '0 10px 28px rgba(0, 0, 0, 0.05)',
    // @ts-ignore
    cursor: 'pointer',
  },
  verseAccent: {
    height: 4,
    backgroundColor: colors.primary,
  },
  verseCardBody: {
    padding: 22,
  },
  verseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.round,
    backgroundColor: `${colors.primary}12`,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  verseCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timestamp: {
    fontSize: 12,
    color: colors.text.disabled,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.accent}14`,
    // @ts-ignore
    cursor: 'pointer',
  },
  verseArabic: {
    fontSize: 28,
    lineHeight: 48,
    color: colors.text.primary,
    textAlign: 'right',
    marginBottom: 12,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
    direction: 'rtl',
  },
  verseTranslation: {
    fontSize: 15,
    lineHeight: 25,
    color: colors.text.secondary,
    marginBottom: 16,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  verseCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  chapterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.round,
    backgroundColor: `${colors.primary}10`,
  },
  chapterTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  jumpHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jumpHintText: {
    fontSize: 12,
    color: colors.text.tertiary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  chapterCard: {
    borderRadius: 24,
    overflow: 'hidden',
    // @ts-ignore
    boxShadow: '0 14px 32px rgba(27, 67, 50, 0.14)',
    // @ts-ignore
    cursor: 'pointer',
  },
  chapterCardGradient: {
    padding: 22,
  },
  chapterCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  chapterNumberBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  chapterNumberBubbleText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.white,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  chapterRemoveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    // @ts-ignore
    cursor: 'pointer',
  },
  chapterArabicName: {
    fontSize: 32,
    color: colors.text.white,
    textAlign: 'right',
    marginBottom: 6,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  chapterEnglishName: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.96)',
    marginBottom: 18,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  chapterCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chapterMetaText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 24,
    backgroundColor: colors.background,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIconWrap: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 10,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  emptyMessage: {
    fontSize: 15,
    lineHeight: 25,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 480,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
});
