import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Header, Card } from "@/components";
import { PillarCard } from "@/components/pillars/PillarCard";
import { colors, spacing, typography, borderRadius } from "@/theme";
import { pillarsService } from "@/services/pillarsService";
import type { PillarType } from "@/types/pillars";

type ToggleOption = {
  value: PillarType;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

const TOGGLE_OPTIONS: ToggleOption[] = [
  { value: "islam", label: "5 Pillars of Islam", icon: "star-outline" },
  { value: "iman", label: "6 Pillars of Iman", icon: "heart-outline" },
];

export const PillarsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<PillarType>("islam");

  const pillarsQuery = useQuery({
    queryKey: ["pillars", activeTab],
    queryFn: () => pillarsService.getPillarsData(activeTab),
  });

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleTabChange = (value: PillarType) => {
    setActiveTab(value);
  };

  // Determine accent color based on active tab
  const accentColor = activeTab === "islam" ? colors.primary : colors.secondary;

  const renderToggle = () => (
    <View style={styles.toggleContainer}>
      {TOGGLE_OPTIONS.map((option) => {
        const isActive = activeTab === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.toggleButton,
              isActive && [styles.toggleButtonActive, { backgroundColor: accentColor }],
            ]}
            onPress={() => handleTabChange(option.value)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={option.icon}
              size={16}
              color={isActive ? colors.text.white : colors.text.secondary}
              style={styles.toggleIcon}
            />
            <Text
              style={[
                styles.toggleText,
                isActive && styles.toggleTextActive,
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderContent = () => {
    if (pillarsQuery.isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={styles.loadingText}>Loading pillars...</Text>
        </View>
      );
    }

    if (pillarsQuery.isError) {
      const message =
        (pillarsQuery.error as Error)?.message ||
        "Failed to load pillars. Please try again.";
      return (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{message}</Text>
        </View>
      );
    }

    const data = pillarsQuery.data;

    if (!data) {
      return (
        <View style={styles.center}>
          <Ionicons name="document-outline" size={48} color={colors.text.secondary} />
          <Text style={styles.errorTitle}>No data found</Text>
          <Text style={styles.errorText}>
            The pillars data has not been loaded yet. Please try again later.
          </Text>
        </View>
      );
    }

    return (
      <>
        {/* Introduction Card */}
        <Card style={[styles.introCard, { borderLeftColor: accentColor }]}>
          <View style={styles.introHeader}>
            <Ionicons
              name={activeTab === "islam" ? "star" : "heart"}
              size={20}
              color={accentColor}
            />
            <Text style={[styles.introTitle, { color: accentColor }]}>
              {data.title}
            </Text>
          </View>
          <Text style={styles.introDescription}>{data.description}</Text>
        </Card>

        {/* Pillar Cards */}
        {data.pillars.map((pillar) => (
          <PillarCard
            key={pillar.number}
            pillar={pillar}
            accentColor={accentColor}
          />
        ))}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Header
          title="Pillars"
          titleNumberOfLines={1}
          leftAction={{ iconName: "arrow-back", onPress: handleGoBack }}
        />
      </View>

      {/* Toggle Switch */}
      {renderToggle()}

      <ScrollView
        style={[
          styles.scrollView,
          Platform.OS === "web" && styles.webScrollView,
        ]}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {renderContent()}
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
  toggleContainer: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleIcon: {
    marginRight: 6,
  },
  toggleText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  toggleTextActive: {
    color: colors.text.white,
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
    paddingTop: 0,
    paddingBottom: spacing.xxl,
  },
  introCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderLeftWidth: 3,
  },
  introHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  introTitle: {
    ...typography.h4,
    marginLeft: spacing.xs,
  },
  introDescription: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    minHeight: 300,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  errorTitle: {
    ...typography.h4,
    color: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: "center",
  },
});
