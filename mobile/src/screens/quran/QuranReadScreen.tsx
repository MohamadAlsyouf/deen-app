import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
  ViewToken,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, borderRadius } from "@/theme";
import { quranService } from "@/services/quranService";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { useQuranProgress } from "@/contexts/QuranProgressContext";
import type { QuranVerse } from "@/types/quran";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import type { ViewMode } from "@/components/quran/ViewModeToggle";
import type { UserType } from "@/types/user";
import { buildQuranReadPages, type QuranReadPage } from "@/utils/quranReadPagination";

const PAGE_TURN_DURATION = 280;

type QuranReadPageItem = QuranReadPage & {
  verse: QuranVerse;
};

// Conditionally import haptics (not available on web)
import * as Haptics from "expo-haptics";

type QuranReadRouteProp = RouteProp<RootStackParamList, "QuranRead">;
type QuranReadNavigationProp = StackNavigationProp<RootStackParamList, "QuranRead">;

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const PER_PAGE = 50; // Load more verses at once for reading mode

// Get available view modes based on user type
const getAvailableViewModes = (
  userType: UserType | undefined
): { key: ViewMode; label: string }[] => {
  if (userType === "learner") {
    // Learner: English only (no toggle visible)
    return [];
  }
  if (userType === "revert") {
    // Revert: All, English
    return [
      { key: "all", label: "All" },
      { key: "english", label: "English" },
    ];
  }
  // Muslim: All, Arabic, English
  return [
    { key: "all", label: "All" },
    { key: "arabic", label: "عربي" },
    { key: "english", label: "English" },
  ];
};

// Get default view mode based on user type
const getDefaultViewMode = (userType: UserType | undefined): ViewMode => {
  if (userType === "learner") {
    return "english";
  }
  return "all";
};

// Helper functions for verse text processing
const stripHtmlTags = (value: string): string => {
  return value.replace(/<[^>]*>/g, " ");
};

const stripSupFootnotes = (value: string): string => {
  return value.replace(/<sup[^>]*>.*?<\/sup>/gi, "");
};

const decodeHtmlEntities = (value: string): string => {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
};

const normalizeWhitespace = (value: string): string => {
  return value.replace(/\s+/g, " ").trim();
};

const sanitizeTranslationText = (value: string): string => {
  const withoutSupFootnotes = stripSupFootnotes(value);
  const withoutTags = stripHtmlTags(withoutSupFootnotes);
  const decoded = decodeHtmlEntities(withoutTags);
  return normalizeWhitespace(decoded);
};

export const QuranReadScreen: React.FC = () => {
  const navigation = useNavigation<QuranReadNavigationProp>();
  const route = useRoute<QuranReadRouteProp>();
  const insets = useSafeAreaInsets();
  const { chapterId: initialChapterId, chapterName: initialChapterName, chapterArabicName: initialChapterArabicName, versesCount: initialVersesCount } = route.params;
  const { userProfile } = useUserProfile();
  const { isVerseBookmarked, toggleVerseBookmark } = useBookmarks();
  const { updateReadProgress, getChapterProgress } = useQuranProgress();

  // Track current chapter ID internally for navigation
  const [currentChapterId, setCurrentChapterId] = useState(initialChapterId);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Store chapter info separately to ensure it's always available during transitions
  const [currentChapterName, setCurrentChapterName] = useState(initialChapterName || "Chapter");
  const [currentChapterArabicName, setCurrentChapterArabicName] = useState(initialChapterArabicName || "");
  const [currentChapterVersesCount, setCurrentChapterVersesCount] = useState(initialVersesCount || 0);

  // Animation values for page turn effect
  const pageTranslateX = useRef(new Animated.Value(0)).current;
  const pageOpacity = useRef(new Animated.Value(1)).current;
  const pageScale = useRef(new Animated.Value(1)).current;

  // Fetch all chapters to get chapter info for navigation
  const chaptersQuery = useQuery({
    queryKey: ["quranChapters"],
    queryFn: quranService.getChapters,
    staleTime: Infinity, // Chapters don't change
  });

  // Helper to get chapter info from the cached chapters list
  const getChapterInfo = useCallback((chapterId: number) => {
    const chapter = chaptersQuery.data?.find((c) => c.id === chapterId);
    if (chapter) {
      return {
        name: chapter.name_simple,
        arabicName: chapter.name_arabic,
        versesCount: chapter.verses_count,
      };
    }
    return null;
  }, [chaptersQuery.data]);

  // Combined chapter info for use in components
  const currentChapterInfo = useMemo(() => ({
    name: currentChapterName,
    arabicName: currentChapterArabicName,
    versesCount: currentChapterVersesCount,
  }), [currentChapterName, currentChapterArabicName, currentChapterVersesCount]);

  const userType = userProfile?.userType;
  const availableViewModes = useMemo(
    () => getAvailableViewModes(userType),
    [userType]
  );
  const defaultViewMode = getDefaultViewMode(userType);

  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [hasRestoredPosition, setHasRestoredPosition] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  // Calculate item height for FlatList
  const ITEM_HEIGHT = SCREEN_HEIGHT - insets.top - insets.bottom - 100; // Reserve space for header + progress

  // Fetch all verses using currentChapterId
  const versesQuery = useInfiniteQuery({
    queryKey: ["quranVersesByChapterRead", currentChapterId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      quranService.getVersesByChapter({
        chapterId: currentChapterId,
        page: pageParam,
        perPage: PER_PAGE,
      }),
    getNextPageParam: (lastPage) => lastPage.pagination.next_page ?? undefined,
  });

  const verses: QuranVerse[] = useMemo(() => {
    return versesQuery.data?.pages.flatMap((page) => page.verses) ?? [];
  }, [versesQuery.data?.pages]);

  const totalVerses = currentChapterInfo.versesCount || verses.length;
  const readPages = useMemo<QuranReadPageItem[]>(() => {
    return verses.flatMap((verse) => {
      const translationRaw = verse.translations?.[0]?.text || "";
      const translationText = sanitizeTranslationText(translationRaw);

      return buildQuranReadPages({
        verseKey: verse.verse_key,
        verseNumber: verse.verse_number,
        arabicText: verse.text_uthmani,
        translationText,
        viewMode,
        surface: "mobile",
      }).map((page) => ({
        ...page,
        verse,
      }));
    });
  }, [verses, viewMode]);

  const currentPage = readPages[currentPageIndex] ?? null;
  const currentVerseProgress = currentPage?.verseNumber ?? 1;

  useEffect(() => {
    setCurrentPageIndex((prev) => Math.min(prev, Math.max(readPages.length - 1, 0)));
  }, [readPages.length]);

  // Restore last read position when entering the chapter
  useEffect(() => {
    if (hasRestoredPosition || readPages.length === 0) return;

    const savedProgress = getChapterProgress(currentChapterId);
    if (savedProgress.lastReadVerse > 1) {
      // Find the page index for the saved verse
      const targetPageIndex = readPages.findIndex(
        (page) => page.verseNumber >= savedProgress.lastReadVerse
      );
      if (targetPageIndex > 0) {
        // Delay scroll to ensure FlatList is ready
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: targetPageIndex,
            animated: false,
          });
          setCurrentPageIndex(targetPageIndex);
        }, 100);
      }
    }
    setHasRestoredPosition(true);
  }, [currentChapterId, readPages, hasRestoredPosition, getChapterProgress]);

  // Track reading progress when page changes
  useEffect(() => {
    if (currentVerseProgress > 0 && totalVerses > 0) {
      updateReadProgress(currentChapterId, currentVerseProgress, totalVerses);
    }
  }, [currentChapterId, currentVerseProgress, totalVerses, updateReadProgress]);

  // Update progress bar animation
  useEffect(() => {
    const progress = totalVerses > 0 ? currentVerseProgress / totalVerses : 0;
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  }, [currentVerseProgress, totalVerses, progressAnim]);

  // Trigger haptic feedback
  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  // Handle viewable items change for paging
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        const newIndex = viewableItems[0].index;
        setCurrentPageIndex((prevIndex) => {
          if (newIndex !== prevIndex) {
            triggerHaptic();
          }
          return newIndex;
        });
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Load more verses when reaching end
  const handleEndReached = useCallback(() => {
    if (versesQuery.hasNextPage && !versesQuery.isFetchingNextPage) {
      versesQuery.fetchNextPage();
    }
  }, [versesQuery]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Animate page turn for chapter transitions
  const animatePageTurn = useCallback(
    (direction: "next" | "previous", newChapterId: number) => {
      if (isTransitioning) return;

      // Get the new chapter info BEFORE starting animation
      const newChapterInfo = getChapterInfo(newChapterId);
      if (!newChapterInfo) {
        // If chapters aren't loaded yet, just update the ID and let it show "Chapter"
        setCurrentChapterId(newChapterId);
        setCurrentChapterName("Chapter");
        setCurrentChapterArabicName("");
        setCurrentChapterVersesCount(0);
        return;
      }

      setIsTransitioning(true);

      const slideDirection = direction === "next" ? -1 : 1;

      // Animate out current content
      Animated.parallel([
        Animated.timing(pageTranslateX, {
          toValue: slideDirection * SCREEN_WIDTH * 0.5,
          duration: PAGE_TURN_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pageOpacity, {
          toValue: 0,
          duration: PAGE_TURN_DURATION * 0.8,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pageScale, {
          toValue: 0.92,
          duration: PAGE_TURN_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Update chapter ID, name, and reset to first page
        setCurrentChapterId(newChapterId);
        setCurrentChapterName(newChapterInfo.name);
        setCurrentChapterArabicName(newChapterInfo.arabicName);
        setCurrentChapterVersesCount(newChapterInfo.versesCount);
        setCurrentPageIndex(0);
        setHasRestoredPosition(true); // Don't restore position when navigating between chapters

        // Reset scroll position
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });

        // Position for slide in from opposite direction and set opacity to 0
        pageTranslateX.setValue(-slideDirection * SCREEN_WIDTH * 0.5);
        pageScale.setValue(0.92);
        pageOpacity.setValue(0);

        // Animate in new content after brief delay for data to start loading
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(pageTranslateX, {
              toValue: 0,
              duration: PAGE_TURN_DURATION,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(pageOpacity, {
              toValue: 1,
              duration: PAGE_TURN_DURATION * 0.8,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pageScale, {
              toValue: 1,
              duration: PAGE_TURN_DURATION,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]).start(() => {
            setIsTransitioning(false);
          });
        }, 80);
      });
    },
    [isTransitioning, pageTranslateX, pageOpacity, pageScale, getChapterInfo]
  );

  // Navigate to previous chapter
  const handlePreviousChapter = useCallback(() => {
    if (currentChapterId > 1 && !isTransitioning) {
      triggerHaptic();
      animatePageTurn("previous", currentChapterId - 1);
    }
  }, [currentChapterId, isTransitioning, triggerHaptic, animatePageTurn]);

  // Navigate to next chapter
  const handleNextChapter = useCallback(() => {
    if (currentChapterId < 114 && !isTransitioning) {
      triggerHaptic();
      animatePageTurn("next", currentChapterId + 1);
    }
  }, [currentChapterId, isTransitioning, triggerHaptic, animatePageTurn]);

  const handleToggleVerseBookmark = useCallback(
    (verse: QuranVerse) => {
      const translationRaw = verse.translations?.[0]?.text || "";
      const preview = sanitizeTranslationText(translationRaw).slice(0, 120);
      toggleVerseBookmark({
        verseKey: verse.verse_key,
        chapterId: currentChapterId,
        chapterName: currentChapterInfo.name || "Chapter",
        chapterArabicName: currentChapterInfo.arabicName || "",
        verseNumber: verse.verse_number,
        arabicText: verse.text_uthmani,
        translationPreview: preview,
      });
    },
    [currentChapterId, currentChapterInfo, toggleVerseBookmark]
  );

  // Render individual verse page
  const renderVersePage = useCallback(
    ({ item: page }: { item: QuranReadPageItem; index: number }) => {
      const isBookmarked = isVerseBookmarked(page.verseKey);

      const showArabic = viewMode === "all" || viewMode === "arabic";
      const showTranslation = viewMode === "all" || viewMode === "english";

      return (
        <View style={[styles.versePage, { height: ITEM_HEIGHT }]}>
          <View style={styles.verseContent}>
            {/* Verse Number Badge */}
            <View style={[styles.verseBadge, page.continuationIndex > 0 && styles.verseBadgeWide]}>
              <Text
                style={[
                  styles.verseBadgeText,
                  page.continuationIndex > 0 && styles.verseBadgeContinuationText,
                ]}
              >
                {page.badgeLabel}
              </Text>
            </View>

            {/* Arabic Text */}
            {showArabic && page.arabicText.length > 0 && (
              <Text
                style={[
                  styles.arabicText,
                  viewMode === "arabic" && styles.arabicOnlyText,
                ]}
                selectable
              >
                {page.arabicText}
              </Text>
            )}

            {/* Translation */}
            {showTranslation && page.translationText.length > 0 && (
              <Text
                style={[
                  styles.translationText,
                  viewMode === "english" && styles.englishOnlyText,
                ]}
                selectable
              >
                {page.translationText}
              </Text>
            )}

            {/* Bookmark Button */}
            <TouchableOpacity
              style={styles.bookmarkButton}
              onPress={() => handleToggleVerseBookmark(page.verse)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={24}
                color={isBookmarked ? colors.accent : colors.text.tertiary}
              />
            </TouchableOpacity>
          </View>

          {/* Verse Key */}
          <Text style={styles.verseKey}>
            {page.verseKey}
            {page.continuationCount > 1 ? ` • ${page.continuationIndex + 1}/${page.continuationCount}` : ""}
          </Text>
        </View>
      );
    },
    [viewMode, ITEM_HEIGHT, isVerseBookmarked, handleToggleVerseBookmark]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [ITEM_HEIGHT]
  );

  const keyExtractor = useCallback((item: QuranReadPageItem) => item.pageKey, []);

  // Progress bar width interpolation
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
          <Text style={styles.backButtonText}>Back to Chapters</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {currentChapterInfo.name || "Loading..."}
          </Text>
          <Text style={styles.headerSubtitle}>
            {currentVerseProgress} of {Math.max(totalVerses, 1)}
          </Text>
        </View>

        {/* Chapter Navigation Arrows */}
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.chapterNavButton, (currentChapterId <= 1 || isTransitioning) && styles.chapterNavButtonDisabled]}
            onPress={handlePreviousChapter}
            disabled={currentChapterId <= 1 || isTransitioning}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={currentChapterId <= 1 ? colors.text.disabled : colors.text.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chapterNavButton, (currentChapterId >= 114 || isTransitioning) && styles.chapterNavButtonDisabled]}
            onPress={handleNextChapter}
            disabled={currentChapterId >= 114 || isTransitioning}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={currentChapterId >= 114 ? colors.text.disabled : colors.text.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { width: progressWidth }]}
          />
        </View>
      </View>

      {/* View Mode Toggle (for muslim and revert users) */}
      {availableViewModes.length > 0 && (
        <View style={styles.viewModeContainer}>
          <View style={styles.viewModeToggle}>
            {availableViewModes.map((mode) => {
              const isActive = viewMode === mode.key;
              return (
                <TouchableOpacity
                  key={mode.key}
                  style={[
                    styles.viewModeButton,
                    isActive && styles.viewModeButtonActive,
                  ]}
                  onPress={() => setViewMode(mode.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.viewModeText,
                      isActive && styles.viewModeTextActive,
                      mode.key === "arabic" && styles.arabicModeText,
                    ]}
                  >
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Swipeable Verse List with Page Turn Animation */}
      <Animated.View
        style={[
          styles.animatedContentContainer,
          {
            opacity: pageOpacity,
            transform: [
              { translateX: pageTranslateX },
              { scale: pageScale },
            ],
          },
        ]}
      >
        <FlatList
          ref={flatListRef}
          data={readPages}
          renderItem={renderVersePage}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          decelerationRate="fast"
          snapToInterval={ITEM_HEIGHT}
          snapToAlignment="start"
          contentContainerStyle={styles.listContent}
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          windowSize={5}
        />
      </Animated.View>

      {/* Swipe Hint (shown briefly) */}
      <SwipeHint />
    </SafeAreaView>
  );
};

// Swipe hint component that fades out
const SwipeHint: React.FC = () => {
  const opacity = useRef(new Animated.Value(1)).current;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, 2000);

    return () => clearTimeout(timer);
  }, [opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.swipeHint, { opacity }]}>
      <Ionicons name="chevron-up" size={20} color={colors.text.secondary} />
      <Text style={styles.swipeHintText}>Swipe to navigate</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  animatedContentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  backButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "600",
    marginLeft: spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chapterNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterNavButtonDisabled: {
    opacity: 0.4,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  viewModeContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  viewModeToggle: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  viewModeButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  viewModeText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  viewModeTextActive: {
    color: colors.text.white,
  },
  arabicModeText: {
    fontSize: 16,
  },
  listContent: {
    flexGrow: 1,
  },
  versePage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  verseContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    maxWidth: 600,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl + spacing.lg,
  },
  verseBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  verseBadgeWide: {
    width: "auto",
    minWidth: 48,
    paddingHorizontal: spacing.md,
  },
  verseBadgeText: {
    ...typography.h4,
    color: colors.text.white,
    fontWeight: "700",
  },
  verseBadgeContinuationText: {
    fontSize: 15,
  },
  arabicText: {
    fontSize: 32,
    lineHeight: 56,
    color: colors.text.primary,
    textAlign: "center",
    writingDirection: "rtl",
    marginBottom: spacing.lg,
    width: "100%",
    flexShrink: 1,
  },
  arabicOnlyText: {
    fontSize: 40,
    lineHeight: 68,
  },
  translationText: {
    ...typography.body,
    fontSize: 18,
    lineHeight: 30,
    color: colors.text.secondary,
    textAlign: "center",
    width: "100%",
    flexShrink: 1,
  },
  englishOnlyText: {
    fontSize: 22,
    lineHeight: 36,
    color: colors.text.primary,
  },
  bookmarkButton: {
    position: "absolute",
    bottom: spacing.lg,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  verseKey: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },
  swipeHint: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  swipeHintText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});
