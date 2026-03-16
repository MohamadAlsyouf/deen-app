import React, { useMemo, useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  LayoutChangeEvent,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
} from "react-native";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Header } from "@/components";
import { colors, spacing, typography, borderRadius } from "@/theme";
import { quranService } from "@/services/quranService";
import type { QuranVerse, QuranChapter } from "@/types/quran";
import { QuranVerseCard } from "@/components/quran/QuranVerseCard";
import { AudioPlayerBar } from "@/components/quran/AudioPlayerBar";
import { VerseRangeSidebar } from "@/components/quran/VerseRangeSidebar";
import { ViewModeToggle, type ViewMode } from "@/components/quran/ViewModeToggle";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import type { UserType } from "@/types/user";

// Get available view modes based on user type
const getAvailableViewModes = (
  userType: UserType | undefined
): ViewMode[] => {
  if (userType === "learner") {
    // Learner: English only (no toggle visible)
    return ["english"];
  }
  if (userType === "revert") {
    // Revert: All, English
    return ["all", "english"];
  }
  // Muslim (default): All, Arabic, English
  return ["all", "arabic", "english"];
};

// Get default view mode based on user type
const getDefaultViewMode = (userType: UserType | undefined): ViewMode => {
  if (userType === "learner") {
    return "english";
  }
  return "all";
};

type QuranChapterRouteProp = RouteProp<RootStackParamList, "QuranChapter">;
type QuranChapterNavigationProp = StackNavigationProp<
  RootStackParamList,
  "QuranChapter"
>;

const PER_PAGE = 20;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAGE_TURN_DURATION = 300;

export const QuranChapterScreen: React.FC = () => {
  const navigation = useNavigation<QuranChapterNavigationProp>();
  const route = useRoute<QuranChapterRouteProp>();
  const { chapterId: initialChapterId, chapterName: initialChapterName, chapterArabicName: initialChapterArabicName, scrollToVerse: initialScrollVerse } = route.params;
  const queryClient = useQueryClient();

  // Local chapter state for seamless transitions
  const [currentChapterId, setCurrentChapterId] = useState(initialChapterId);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Animation values for page turn effect
  const pageTranslateX = useRef(new Animated.Value(0)).current;
  const pageOpacity = useRef(new Animated.Value(1)).current;
  const pageScale = useRef(new Animated.Value(1)).current;

  // Fetch all chapters for chapter info lookup
  const chaptersQuery = useQuery({
    queryKey: ['quranChapters'],
    queryFn: () => quranService.getChapters(),
    staleTime: Infinity, // Chapters don't change
  });

  // Get current chapter info
  const currentChapterInfo = useMemo(() => {
    if (currentChapterId === initialChapterId) {
      return {
        name: initialChapterName || 'Chapter',
        arabicName: initialChapterArabicName || '',
      };
    }
    const chapter = chaptersQuery.data?.find((c) => c.id === currentChapterId);
    return {
      name: chapter?.name_simple || 'Chapter',
      arabicName: chapter?.name_arabic || '',
    };
  }, [currentChapterId, initialChapterId, initialChapterName, initialChapterArabicName, chaptersQuery.data]);

  const [isVerseRangeSidebarVisible, setIsVerseRangeSidebarVisible] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);

  const { userProfile } = useUserProfile();
  const userType = userProfile?.userType;
  const availableViewModes = useMemo(() => getAvailableViewModes(userType), [userType]);
  const defaultViewMode = getDefaultViewMode(userType);
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);

  // Update view mode when user type changes (e.g., profile loads)
  useEffect(() => {
    const validModes = getAvailableViewModes(userType);
    if (!validModes.includes(viewMode)) {
      setViewMode(getDefaultViewMode(userType));
    }
  }, [userType, viewMode]);

  // Refs for auto-scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  const versePositions = useRef<Map<string, { y: number; height: number }>>(new Map());
  const lastHighlightedVerseKey = useRef<string | null>(null);

  const { loadChapter, reset, resetPlaybackSettings, highlightState, playbackState, selectedReciter, pause } =
    useAudioPlayer();
  const { isVerseBookmarked, isChapterBookmarked, toggleVerseBookmark, toggleChapterBookmark } =
    useBookmarks();

  // Fetch verses
  const versesQuery = useInfiniteQuery({
    queryKey: ["quranVersesByChapter", currentChapterId],
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

  // Get total verses count from pagination
  const totalVerses = useMemo(() => {
    return versesQuery.data?.pages[0]?.pagination.total_records ?? 0;
  }, [versesQuery.data?.pages]);

  // Load audio when chapter or reciter changes
  useEffect(() => {
    if (selectedReciter && currentChapterId) {
      loadChapter(currentChapterId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapterId, selectedReciter?.id]);

  // Pause and reset audio when leaving screen to prevent audio stacking
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Pause first to immediately stop playback
        pause();
        // Then reset all audio state
        reset();
        resetPlaybackSettings();
      };
    }, [pause, reset, resetPlaybackSettings])
  );

  // Auto-scroll to highlighted verse
  useEffect(() => {
    const verseKey = highlightState.verseKey;
    
    // Only scroll if we have a new verse to highlight
    if (!verseKey || verseKey === lastHighlightedVerseKey.current) {
      return;
    }
    
    lastHighlightedVerseKey.current = verseKey;
    
    const verseInfo = versePositions.current.get(verseKey);
    if (!verseInfo || !scrollViewRef.current || containerHeight === 0) {
      return;
    }

    // Calculate scroll position to center the verse
    const { y, height } = verseInfo;
    const scrollTo = y - (containerHeight / 2) + (height / 2);
    
    scrollViewRef.current.scrollTo({
      y: Math.max(0, scrollTo),
      animated: true,
    });
  }, [highlightState.verseKey, containerHeight]);

  // Handler for tracking verse positions
  const handleVerseLayout = useCallback((verseKey: string, event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    versePositions.current.set(verseKey, { y, height });
  }, []);

  // Handler for container height
  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  }, []);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleLoadMore = () => {
    if (!versesQuery.hasNextPage) {
      return;
    }
    if (versesQuery.isFetchingNextPage) {
      return;
    }
    versesQuery.fetchNextPage();
  };

  // Target verse to scroll to (set when user applies a range, or from route param)
  const [targetScrollVerse, setTargetScrollVerse] = useState<number | null>(
    initialScrollVerse ?? null,
  );

  // Load verses until target verse is available, then scroll to it
  useEffect(() => {
    if (targetScrollVerse === null) return;

    const verseKey = `${currentChapterId}:${targetScrollVerse}`;
    
    // Check if verse is loaded
    const isVerseLoaded = verses.some((v) => v.verse_key === verseKey);
    
    if (isVerseLoaded) {
      // Wait for layout to update, then scroll
      setTimeout(() => {
        const verseInfo = versePositions.current.get(verseKey);
        if (verseInfo && scrollViewRef.current && containerHeight > 0) {
          const { y, height } = verseInfo;
          const scrollTo = y - (containerHeight / 2) + (height / 2);
          scrollViewRef.current.scrollTo({
            y: Math.max(0, scrollTo),
            animated: true,
          });
        }
        // Clear target after scrolling
        setTargetScrollVerse(null);
      }, 150);
    } else if (versesQuery.hasNextPage && !versesQuery.isFetchingNextPage) {
      // Need to load more verses
      versesQuery.fetchNextPage();
    }
  }, [targetScrollVerse, verses, currentChapterId, containerHeight, versesQuery]);

  // Function to trigger scroll to a verse (called from sidebar)
  const scrollToVerse = useCallback((verseNumber: number) => {
    if (verseNumber <= 0) return;
    setTargetScrollVerse(verseNumber);
  }, []);

  const handleToggleChapterBookmark = useCallback(() => {
    toggleChapterBookmark({
      chapterId: currentChapterId,
      chapterName: currentChapterInfo.name,
      chapterArabicName: currentChapterInfo.arabicName,
      versesCount: totalVerses,
    });
  }, [currentChapterId, currentChapterInfo, totalVerses, toggleChapterBookmark]);

  const handleToggleVerseBookmark = useCallback(
    (verse: QuranVerse) => {
      const translationRaw = verse.translations?.[0]?.text || '';
      const preview = translationRaw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
      toggleVerseBookmark({
        verseKey: verse.verse_key,
        chapterId: currentChapterId,
        chapterName: currentChapterInfo.name,
        chapterArabicName: currentChapterInfo.arabicName,
        verseNumber: verse.verse_number,
        arabicText: verse.text_uthmani,
        translationPreview: preview,
      });
    },
    [currentChapterId, currentChapterInfo, toggleVerseBookmark],
  );

  const chapterIsBookmarked = isChapterBookmarked(currentChapterId);

  const handleOpenVerseRangeSidebar = () => {
    setIsVerseRangeSidebarVisible(true);
  };

  const handleCloseVerseRangeSidebar = () => {
    setIsVerseRangeSidebarVisible(false);
  };

  // Animate page turn and change chapter
  const animatePageTurn = useCallback((direction: 'next' | 'previous', newChapterId: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    // Haptic feedback for chapter change
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Reset audio before changing
    reset();
    resetPlaybackSettings();

    // Clear verse positions for new chapter
    versePositions.current.clear();
    lastHighlightedVerseKey.current = null;

    // Direction: next = slide left (negative), previous = slide right (positive)
    const slideDirection = direction === 'next' ? -1 : 1;

    // Animate current page out with smooth easing
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
      // Update chapter ID (this triggers data fetch)
      setCurrentChapterId(newChapterId);

      // Reset scroll position
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });

      // Position new page on opposite side
      pageTranslateX.setValue(-slideDirection * SCREEN_WIDTH * 0.5);
      pageScale.setValue(0.92);
      pageOpacity.setValue(0);

      // Small delay for content to start loading, then animate in
      setTimeout(() => {
        // Animate new page in with smooth spring-like easing
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
      }, 50);
    });
  }, [isTransitioning, reset, resetPlaybackSettings, pageTranslateX, pageOpacity, pageScale]);

  // Navigate to previous chapter
  const handlePreviousChapter = useCallback(() => {
    if (currentChapterId > 1 && !isTransitioning) {
      animatePageTurn('previous', currentChapterId - 1);
    }
  }, [currentChapterId, isTransitioning, animatePageTurn]);

  // Navigate to next chapter
  const handleNextChapter = useCallback(() => {
    if (currentChapterId < 114 && !isTransitioning) {
      animatePageTurn('next', currentChapterId + 1);
    }
  }, [currentChapterId, isTransitioning, animatePageTurn]);

  // Helper to get highlight status for a verse
  const getVerseHighlightStatus = (
    verseKey: string
  ): "none" | "current" | "completed" => {
    // Show highlighting when playing, paused, or loading (if we have state)
    // Only hide highlighting when idle (no audio loaded) or error
    if (playbackState === "idle" || playbackState === "error") {
      return "none";
    }
    // Check if this verse has been completed
    if (highlightState.completedVerseKeys.has(verseKey)) {
      return "completed";
    }
    // Check if this is the current verse being recited
    if (highlightState.verseKey === verseKey) {
      return "current";
    }
    return "none";
  };

  // Helper to get highlighted word position for a verse
  const getVerseHighlightedWordPosition = (verseKey: string): number | null => {
    if (highlightState.verseKey === verseKey) {
      return highlightState.wordPosition;
    }
    return null;
  };

  const title = currentChapterInfo.name;

  // Determine content state
  const isLoading = versesQuery.isLoading;
  const isError = versesQuery.isError;
  const errorMessage = isError
    ? (versesQuery.error as any)?.message || "Failed to load verses. Please try again."
    : null;

  // Get subtitle text based on view mode
  const getSubtitleText = () => {
    switch (viewMode) {
      case 'arabic':
        return 'Arabic text only.';
      case 'english':
        return 'Translation with transliteration.';
      default:
        return 'Arabic verses with English transliteration.';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <Header
          title={title}
          leftAction={{ iconName: "arrow-back", onPress: handleGoBack }}
          rightAction={{ iconName: "settings-outline", onPress: handleOpenVerseRangeSidebar }}
        />
        <ViewModeToggle
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          availableModes={availableViewModes}
        />
        <View style={styles.contentWrapper} onLayout={handleContainerLayout}>
          <Animated.View
            style={[
              styles.animatedContent,
              {
                transform: [
                  { translateX: pageTranslateX },
                  { scale: pageScale },
                ],
                opacity: pageOpacity,
              },
            ]}
          >
            {/* Loading State */}
            {isLoading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading verses…</Text>
              </View>
            ) : isError ? (
              /* Error State */
              <View style={styles.centerContent}>
                <Text style={styles.errorTitle}>Something went wrong</Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : (
              /* Content */
              <ScrollView
                ref={scrollViewRef}
                style={[
                  styles.scrollView,
                  Platform.OS === "web" && styles.webScrollView,
                ]}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
              >
                <View style={styles.headerInfo}>
                  <View style={styles.headerInfoRow}>
                    {currentChapterInfo.arabicName && viewMode !== 'english' ? (
                      <Text style={styles.arabicName}>{currentChapterInfo.arabicName}</Text>
                    ) : (
                      <View style={styles.headerInfoSpacer} />
                    )}
                    <TouchableOpacity
                      onPress={handleToggleChapterBookmark}
                      style={styles.chapterBookmarkBtn}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={chapterIsBookmarked ? 'bookmark' : 'bookmark-outline'}
                        size={22}
                        color={chapterIsBookmarked ? colors.accent : colors.text.tertiary}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.subtitle}>{getSubtitleText()}</Text>
                </View>

                {verses.map((verse) => (
                  <View
                    key={verse.verse_key}
                    onLayout={(event) => handleVerseLayout(verse.verse_key, event)}
                  >
                    <QuranVerseCard
                      verse={verse}
                      viewMode={viewMode}
                      highlightStatus={getVerseHighlightStatus(verse.verse_key)}
                      highlightedWordPosition={getVerseHighlightedWordPosition(
                        verse.verse_key
                      )}
                      isBookmarked={isVerseBookmarked(verse.verse_key)}
                      onBookmarkPress={() => handleToggleVerseBookmark(verse)}
                    />
                  </View>
                ))}

                {versesQuery.isFetchingNextPage ? (
                  <View style={styles.footer}>
                    <ActivityIndicator color={colors.primary} />
                    <Text style={styles.footerText}>Loading more…</Text>
                  </View>
                ) : versesQuery.hasNextPage ? (
                  <View style={styles.loadMoreWrap}>
                    <Button title="Load more" onPress={handleLoadMore} />
                  </View>
                ) : (
                  <View style={styles.footerSpacer} />
                )}
              </ScrollView>
            )}
          </Animated.View>

          {/* Audio Player Bar - Outside animation to prevent flashing */}
          <AudioPlayerBar
            onSettingsPress={handleOpenVerseRangeSidebar}
            onPreviousChapter={handlePreviousChapter}
            onNextChapter={handleNextChapter}
            isChapterTransitioning={isTransitioning}
          />
        </View>

        {/* Verse Range Sidebar */}
        <VerseRangeSidebar
          visible={isVerseRangeSidebarVisible}
          onClose={handleCloseVerseRangeSidebar}
          totalVerses={totalVerses}
          chapterId={currentChapterId}
          onScrollToVerse={scrollToVerse}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  contentWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  animatedContent: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  webScrollView: {
    // @ts-ignore - web-specific CSS properties
    overflowY: "auto",
    // @ts-ignore - web-specific CSS properties
    WebkitOverflowScrolling: "touch",
    // @ts-ignore - web-specific CSS properties
    touchAction: "pan-y",
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerInfo: {
    marginBottom: spacing.lg,
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  headerInfoSpacer: {
    flex: 1,
  },
  arabicName: {
    fontSize: 28,
    color: colors.primary,
    flex: 1,
    textAlign: "left",
  },
  chapterBookmarkBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  loadMoreWrap: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  footerText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  footerSpacer: {
    height: spacing.xxl,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  errorTitle: {
    ...typography.h4,
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: "center",
  },
});
