import React, { useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "@/theme";
import { quranService } from "@/services/quranService";
import type { QuranChapter } from "@/types/quran";
import { QuranChapterCard } from "@/components/quran/QuranChapterCard";
import { OverallProgressCircle } from "@/components/quran/OverallProgressCircle";
import { useQuranProgress } from "@/contexts/QuranProgressContext";
import type { RootStackParamList } from "@/navigation/AppNavigator";

type QuranChaptersNavigationProp = StackNavigationProp<
  RootStackParamList,
  "QuranChapters"
>;

export const QuranChaptersScreen: React.FC = () => {
  const navigation = useNavigation<QuranChaptersNavigationProp>();
  const insets = useSafeAreaInsets();
  const { getChapterProgress, getOverallProgress } = useQuranProgress();

  // Refs for auto-scroll functionality
  const scrollViewRef = useRef<ScrollView>(null);
  const chapterPositions = useRef<Map<number, number>>(new Map());
  const lastOpenedChapterId = useRef<number | null>(null);
  const shouldScrollOnFocus = useRef(false);

  const chaptersQuery = useQuery({
    queryKey: ["quranChapters"],
    queryFn: quranService.getChapters,
  });

  // Auto-scroll to last opened chapter when returning to screen
  useFocusEffect(
    useCallback(() => {
      if (shouldScrollOnFocus.current && lastOpenedChapterId.current !== null) {
        const position = chapterPositions.current.get(lastOpenedChapterId.current);
        if (position !== undefined && scrollViewRef.current) {
          // Small delay to ensure layout is complete
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({
              y: Math.max(0, position - 100), // Offset to show some context above
              animated: true,
            });
          }, 100);
        }
        shouldScrollOnFocus.current = false;
      }
    }, [])
  );

  // Track chapter card positions
  const handleChapterLayout = useCallback((chapterId: number, event: LayoutChangeEvent) => {
    const { y } = event.nativeEvent.layout;
    chapterPositions.current.set(chapterId, y);
  }, []);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleOpenChapter = (chapter: QuranChapter) => {
    // Track which chapter was opened for auto-scroll on return
    lastOpenedChapterId.current = chapter.id;
    shouldScrollOnFocus.current = true;

    navigation.navigate("QuranModeSelect", {
      chapterId: chapter.id,
      chapterName: chapter.name_simple,
      chapterArabicName: chapter.name_arabic,
      versesCount: chapter.verses_count,
    });
  };

  const totalChapters = chaptersQuery.data?.length ?? 0;
  const overallProgress = chaptersQuery.data
    ? getOverallProgress(
        chaptersQuery.data.map((c) => ({ id: c.id, verses_count: c.verses_count }))
      )
    : 0;

  if (chaptersQuery.isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
          style={[styles.header, { paddingTop: insets.top + spacing.md }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={colors.text.white} />
          </TouchableOpacity>
        </LinearGradient>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading chapters...</Text>
        </View>
      </View>
    );
  }

  if (chaptersQuery.isError) {
    const message =
      (chaptersQuery.error as any)?.message ||
      "Failed to load chapters. Please try again.";
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
          style={[styles.header, { paddingTop: insets.top + spacing.md }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={colors.text.white} />
          </TouchableOpacity>
        </LinearGradient>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{message}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.text.white} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerArabic}>القرآن الكريم</Text>
            <Text style={styles.headerTitle}>The Noble Quran</Text>
            <Text style={styles.headerChapterCount}>{totalChapters} surahs</Text>
          </View>

          {overallProgress > 0 && (
            <View style={styles.progressCircleWrap}>
              <OverallProgressCircle progress={overallProgress} size={80} />
              <Text style={styles.progressLabel}>Progress</Text>
            </View>
          )}
        </View>

        <Text style={styles.headerHint}>Select a chapter to begin reading</Text>
      </LinearGradient>

      {/* Chapter List */}
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
        {chaptersQuery?.data?.map((chapter) => (
          <View
            key={String(chapter.id)}
            onLayout={(event) => handleChapterLayout(chapter.id, event)}
          >
            <QuranChapterCard
              chapter={chapter}
              onPress={handleOpenChapter}
              progress={getChapterProgress(chapter.id).progress}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  headerTextWrap: {
    alignItems: "center",
    flex: 1,
  },
  headerArabic: {
    fontSize: 24,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.white,
    marginBottom: 2,
  },
  headerChapterCount: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.65)",
  },
  progressCircleWrap: {
    alignItems: "center",
    marginLeft: spacing.md,
  },
  progressLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
  },
  headerHint: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.55)",
    textAlign: "center",
    fontStyle: "italic",
  },
  scrollView: {
    flex: 1,
  },
  webScrollView: {
    // @ts-ignore
    overflowY: "auto",
    // @ts-ignore
    WebkitOverflowScrolling: "touch",
    // @ts-ignore
    touchAction: "pan-y",
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
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
