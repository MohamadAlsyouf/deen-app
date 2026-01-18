import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/Card";
import { colors, spacing, typography, borderRadius } from "@/theme";
import type { Pillar } from "@/types/pillars";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

type PillarCardProps = {
  pillar: Pillar;
  accentColor?: string;
};

export const PillarCard: React.FC<PillarCardProps> = ({
  pillar,
  accentColor = colors.primary,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <Card style={styles.card}>
      <TouchableOpacity
        onPress={handleToggleExpand}
        activeOpacity={0.85}
        style={styles.touchable}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          {/* Number Badge */}
          <View style={[styles.numberBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.numberText}>{pillar.number}</Text>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {/* Arabic Name */}
            <Text style={styles.arabicName}>{pillar.arabicName}</Text>

            {/* English Name & Meaning */}
            <Text style={styles.englishName}>{pillar.name}</Text>
            <Text style={styles.meaning}>{pillar.meaning}</Text>
          </View>

          {/* Icon & Expand Indicator */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconBadge, { backgroundColor: `${accentColor}15` }]}>
              <Ionicons
                name={pillar.icon as IoniconName}
                size={24}
                color={accentColor}
              />
            </View>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.text.secondary}
              style={styles.chevron}
            />
          </View>
        </View>

        {/* Expandable Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />

            {/* Description Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={accentColor}
                />
                <Text style={[styles.sectionTitle, { color: accentColor }]}>
                  What is it?
                </Text>
              </View>
              <Text style={styles.sectionText}>{pillar.description}</Text>
            </View>

            {/* Significance Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="sparkles" size={18} color={accentColor} />
                <Text style={[styles.sectionTitle, { color: accentColor }]}>
                  Why does it matter?
                </Text>
              </View>
              <Text style={styles.sectionText}>{pillar.significance}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    padding: 0,
    overflow: "hidden",
  },
  touchable: {
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  numberBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  numberText: {
    ...typography.h4,
    color: colors.text.white,
    fontWeight: "700",
  },
  contentContainer: {
    flex: 1,
  },
  arabicName: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 2,
    textAlign: "left",
  },
  englishName: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 2,
  },
  meaning: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  iconContainer: {
    alignItems: "center",
    marginLeft: spacing.sm,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.round,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  chevron: {
    marginTop: 2,
  },
  expandedContent: {
    marginTop: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: spacing.xs,
  },
  sectionText: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
});
