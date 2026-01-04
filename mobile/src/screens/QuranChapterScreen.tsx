import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button, Header } from "@/components";
import { colors, spacing, typography } from "@/theme";
import { quranService } from "@/services/quranService";
import type { QuranVerse } from "@/types/quran";
import { QuranVerseCard } from "@/components/quran/QuranVerseCard";
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
      <ScrollView
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
          <QuranVerseCard key={verse.verse_key} verse={verse} />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
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
