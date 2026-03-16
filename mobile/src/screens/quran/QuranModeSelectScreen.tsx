import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, borderRadius } from "@/theme";
import type { RootStackParamList } from "@/navigation/AppNavigator";

type QuranModeSelectRouteProp = RouteProp<RootStackParamList, "QuranModeSelect">;
type QuranModeSelectNavigationProp = StackNavigationProp<
  RootStackParamList,
  "QuranModeSelect"
>;

type QuranMode = "listen" | "read";

interface ModeOption {
  mode: QuranMode;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const getModeOptions = (): ModeOption[] => {
  // All users see both Listen and Read options
  return [
    {
      mode: "listen",
      title: "Listen",
      subtitle: "Audio recitation with verse highlighting",
      icon: "headset-outline",
    },
    {
      mode: "read",
      title: "Read",
      subtitle: "Full-screen swipeable reading",
      icon: "book-outline",
    },
  ];
};

export const QuranModeSelectScreen: React.FC = () => {
  const navigation = useNavigation<QuranModeSelectNavigationProp>();
  const route = useRoute<QuranModeSelectRouteProp>();
  const { chapterId, chapterName, chapterArabicName, versesCount } = route.params;

  const modeOptions = getModeOptions();

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleSelectMode = (mode: QuranMode) => {
    if (mode === "listen") {
      navigation.replace("QuranChapter", {
        chapterId,
        chapterName,
        chapterArabicName,
      });
    } else {
      navigation.replace("QuranRead", {
        chapterId,
        chapterName,
        chapterArabicName,
        versesCount,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text.white} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          {chapterArabicName && (
            <Text style={styles.arabicName}>{chapterArabicName}</Text>
          )}
          <Text style={styles.chapterName}>{chapterName}</Text>
          {versesCount > 0 && (
            <Text style={styles.versesCount}>{versesCount} verses</Text>
          )}
        </View>
      </LinearGradient>

      {/* Mode Selection */}
      <View style={styles.content}>
        <Text style={styles.promptText}>How would you like to engage?</Text>

        <View style={styles.optionsContainer}>
          {modeOptions.map((option) => (
            <TouchableOpacity
              key={option.mode}
              style={styles.modeCard}
              onPress={() => handleSelectMode(option.mode)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  option.mode === "listen"
                    ? [colors.primary, colors.primaryLight]
                    : [colors.secondary, colors.secondaryLight]
                }
                style={styles.modeCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.modeIconContainer}>
                  <Ionicons
                    name={option.icon}
                    size={40}
                    color={colors.text.white}
                  />
                </View>
                <Text style={styles.modeTitle}>{option.title}</Text>
                <Text style={styles.modeSubtitle}>{option.subtitle}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
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
    marginBottom: spacing.lg,
  },
  headerContent: {
    alignItems: "center",
  },
  arabicName: {
    fontSize: 32,
    color: colors.text.white,
    marginBottom: spacing.xs,
  },
  chapterName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.white,
    marginBottom: spacing.xs,
  },
  versesCount: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
  },
  promptText: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  optionsContainer: {
    gap: spacing.lg,
  },
  modeCard: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  modeCardGradient: {
    padding: spacing.xl,
    alignItems: "center",
  },
  modeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.white,
    marginBottom: spacing.xs,
  },
  modeSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
});
