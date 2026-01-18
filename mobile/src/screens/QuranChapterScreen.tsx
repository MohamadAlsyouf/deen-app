import React, { useMemo, useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button, Header } from "@/components";
import { colors, spacing, typography } from "@/theme";
import { quranService } from "@/services/quranService";
import type { QuranVerse } from "@/types/quran";
import { QuranVerseCard } from "@/components/quran/QuranVerseCard";
import { AudioPlayerBar } from "@/components/quran/AudioPlayerBar";
import { ReciterSelectModal } from "@/components/quran/ReciterSelectModal";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import type { RootStackParamList } from "@/navigation/AppNavigator";

type QuranChapterRouteProp = RouteProp<RootStackParamList, "QuranChapter">;
type QuranChapterNavigationProp = StackNavigationProp<
  RootStackParamList,
  "QuranChapter"
>;

const PER_PAGE = 20;

export const QuranChapterScreen: React.FC = () => {
  const navigation = useNavigation<QuranChapterNavigationProp>();
  const route = useRoute<QuranChapterRouteProp>();
  const { chapterId, chapterName, chapterArabicName } = route.params;

  const [isReciterModalVisible, setIsReciterModalVisible] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);

  // Refs for auto-scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  const versePositions = useRef<Map<string, { y: number; height: number }>>(new Map());
  const lastHighlightedVerseKey = useRef<string | null>(null);

  const { loadChapter, reset, highlightState, playbackState, selectedReciter } =
    useAudioPlayer();

  // Fetch verses
  const versesQuery = useInfiniteQuery({
    queryKey: ["quranVersesByChapter", chapterId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      quranService.getVersesByChapter({
        chapterId,
        page: pageParam,
        perPage: PER_PAGE,
      }),
    getNextPageParam: (lastPage) => lastPage.pagination.next_page ?? undefined,
  });

  const verses: QuranVerse[] = useMemo(() => {
    return versesQuery.data?.pages.flatMap((page) => page.verses) ?? [];
  }, [versesQuery.data?.pages]);

  // Load audio when chapter or reciter changes
  useEffect(() => {
    if (selectedReciter && chapterId) {
      loadChapter(chapterId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId, selectedReciter?.id]);

  // Reset audio when leaving screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        reset();
      };
    }, [reset])
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

  const handleOpenReciterModal = () => {
    setIsReciterModalVisible(true);
  };

  const handleCloseReciterModal = () => {
    setIsReciterModalVisible(false);
  };

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

  const title = chapterName || "Chapter";

  if (versesQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header
          title={title}
          leftAction={{ iconName: "arrow-back", onPress: handleGoBack }}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading verses…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (versesQuery.isError) {
    const message =
      (versesQuery.error as any)?.message ||
      "Failed to load verses. Please try again.";
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header
          title={title}
          leftAction={{ iconName: "arrow-back", onPress: handleGoBack }}
        />
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title={title}
        leftAction={{ iconName: "arrow-back", onPress: handleGoBack }}
      />
      <View style={styles.contentWrapper} onLayout={handleContainerLayout}>
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
            {chapterArabicName ? (
              <Text style={styles.arabicName}>{chapterArabicName}</Text>
            ) : null}
            <Text style={styles.subtitle}>
              Arabic verses with English transliteration (ayah + per-word).
            </Text>
          </View>

          {verses.map((verse) => (
            <View
              key={verse.verse_key}
              onLayout={(event) => handleVerseLayout(verse.verse_key, event)}
            >
              <QuranVerseCard
                verse={verse}
                highlightStatus={getVerseHighlightStatus(verse.verse_key)}
                highlightedWordPosition={getVerseHighlightedWordPosition(
                  verse.verse_key
                )}
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

        {/* Audio Player Bar */}
        <AudioPlayerBar onReciterPress={handleOpenReciterModal} />
      </View>

      {/* Reciter Selection Modal */}
      <ReciterSelectModal
        visible={isReciterModalVisible}
        onClose={handleCloseReciterModal}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  contentWrapper: {
    flex: 1,
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
  arabicName: {
    fontSize: 28,
    color: colors.primary,
    textAlign: "right",
    marginBottom: spacing.sm,
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
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
