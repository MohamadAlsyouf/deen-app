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
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Header, Card } from "@/components";
import { colors, spacing, typography, borderRadius } from "@/theme";
import { asmaUlHusnaService } from "@/services/asmaUlHusnaService";
import { AsmaUlHusnaNameCard } from "@/components/asmaUlHusna/AsmaUlHusnaNameCard";

export const AsmaUlHusnaScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const dataQuery = useQuery({
    queryKey: ["asmaUlHusna"],
    queryFn: () => asmaUlHusnaService.getData(),
  });

  const handleGoBack = () => {
    navigation.goBack();
  };

  if (dataQuery.isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <Header
            title="99 Names"
            leftAction={{ iconName: "arrow-back", onPress: handleGoBack }}
          />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading names…</Text>
        </View>
      </View>
    );
  }

  if (dataQuery.isError) {
    const message =
      (dataQuery.error as any)?.message ||
      "Failed to load names. Please try again.";
    return (
      <View style={styles.container}>
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <Header
            title="99 Names"
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

  const data = dataQuery.data;

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Header
          title="99 Names of Allah"
          titleNumberOfLines={1}
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
          <Text style={styles.headerTitle}>Asma ul Husna</Text>
          <Text style={styles.headerSubtitle}>
            The beautiful names of Allah. Tap the speaker icon to hear the
            pronunciation.
          </Text>
        </View>

        {data?.recitation_benefits || data?.hadith ? (
          <Card style={styles.infoCard}>
            {data?.recitation_benefits ? (
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="sparkles" size={18} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Benefits of Recitation</Text>
                  <Text style={styles.infoText}>
                    {data.recitation_benefits}
                  </Text>
                </View>
              </View>
            ) : null}

            {data?.recitation_benefits && data?.hadith ? (
              <View style={styles.divider} />
            ) : null}

            {data?.hadith ? (
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="book" size={18} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Hadith</Text>
                  <Text style={styles.infoText}>{data.hadith}</Text>
                </View>
              </View>
            ) : null}
          </Card>
        ) : null}

        {data?.names?.map((name) => (
          <AsmaUlHusnaNameCard key={name.number} name={name} />
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
    marginBottom: spacing.md,
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
  infoCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoText: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
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
