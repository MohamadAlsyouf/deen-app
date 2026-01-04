import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components";
import { colors, spacing, typography } from "@/theme";
import { quranService } from "@/services/quranService";
import type { QuranChapter } from "@/types/quran";
import { QuranChapterCard } from "@/components/quran/QuranChapterCard";
import type { RootStackParamList } from "@/navigation/AppNavigator";

type QuranChaptersNavigationProp = StackNavigationProp<
  RootStackParamList,
  "QuranChapters"
>;

export const QuranChaptersScreen: React.FC = () => {
  const navigation = useNavigation<QuranChaptersNavigationProp>();
  const insets = useSafeAreaInsets();

  const chaptersQuery = useQuery({
    queryKey: ["quranChapters"],
    queryFn: quranService.getChapters,
  });

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleOpenChapter = (chapter: QuranChapter) => {
    navigation.navigate("QuranChapter", {
      chapterId: chapter.id,
      chapterName: chapter.name_simple,
      chapterArabicName: chapter.name_arabic,
    });
  };

  if (chaptersQuery.isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <Header
            title="Quran"
            leftAction={{ iconName: "arrow-back", onPress: handleGoBack }}
          />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading chapters…</Text>
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
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <Header
            title="Quran"
            leftAction={{ iconName: "arrow-back", onPress: handleGoBack }}
          />
        </View>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{message}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Header
          title="Chapters"
          leftAction={{ iconName: "arrow-back", onPress: handleGoBack }}
        />
      </View>
      <ScrollView
        style={[
          styles.scrollView,
          Platform.OS === "web" && styles.webScrollView,
        ]}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Select a chapter</Text>
          <Text style={styles.headerSubtitle}>
            Tap a surah to view Arabic verses and English transliteration.
          </Text>
        </View>

        {chaptersQuery?.data?.map((chapter) => (
          <QuranChapterCard
            key={String(chapter.id)}
            chapter={chapter}
            onPress={handleOpenChapter}
          />
        ))}
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
    paddingTop: 0,
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
  headerCard: {
    marginBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
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
