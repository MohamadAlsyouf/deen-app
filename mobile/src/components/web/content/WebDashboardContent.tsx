/**
 * WebDashboardContent - Dashboard home content
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { useWebHover } from "@/hooks/useWebHover";

type FeatureCardData = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  gradient: [string, string];
  stats?: { label: string; value: string }[];
};

const FEATURE_CARDS: FeatureCardData[] = [
  {
    id: "quran",
    title: "The Holy Quran",
    subtitle: "114 Surahs",
    description:
      "Explore the divine revelation with translations, transliterations, and beautiful recitations from renowned Qaris.",
    icon: "book",
    gradient: ["#1B4332", "#2D6A4F"],
    stats: [
      { label: "Chapters", value: "114" },
      { label: "Verses", value: "6,236" },
    ],
  },
  {
    id: "prayer",
    title: "Prayer Guide",
    subtitle: "Step by Step",
    description:
      "Learn to perform the 5 daily prayers with complete step-by-step instructions, Arabic text, and translations.",
    icon: "hand-left",
    gradient: ["#2D6A4F", "#52B788"],
    stats: [
      { label: "Prayers", value: "5" },
      { label: "Daily", value: "17+" },
    ],
  },
  {
    id: "pillars",
    title: "Pillars of Faith",
    subtitle: "Islam & Iman",
    description:
      "Understand the 5 Pillars of Islam and 6 Pillars of Iman with comprehensive explanations and reflections.",
    icon: "compass",
    gradient: ["#2D6A4F", "#40916C"],
    stats: [
      { label: "Islam", value: "5" },
      { label: "Iman", value: "6" },
    ],
  },
  {
    id: "names",
    title: "Asma ul Husna",
    subtitle: "99 Names of Allah",
    description:
      "Learn and memorize the beautiful names of Allah with meanings, benefits, and audio pronunciations.",
    icon: "heart",
    gradient: ["#40916C", "#52B788"],
    stats: [
      { label: "Names", value: "99" },
      { label: "Attributes", value: "∞" },
    ],
  },
  {
    id: "dua",
    title: "Dua & Dhikr",
    subtitle: "Daily Supplications",
    description:
      "Morning, evening, and daily duas with Arabic text, transliteration, translation, and benefits.",
    icon: "hand-left",
    gradient: ["#1B4332", "#40916C"],
    stats: [
      { label: "Categories", value: "4" },
      { label: "Duas", value: "25+" },
    ],
  },
  {
    id: "sunnah",
    title: "Sunnah",
    subtitle: "Prophetic Practices",
    description:
      "Discover the beautiful daily practices of the Prophet Muhammad \uFDFA for eating, sleeping, speaking, and traveling.",
    icon: "sunny",
    gradient: ["#5D4037", "#8D6E63"],
    stats: [
      { label: "Categories", value: "4" },
      { label: "Practices", value: "24" },
    ],
  },
];

const FeatureCard: React.FC<{
  data: FeatureCardData;
  onPress: () => void;
  index: number;
}> = ({ data, onPress, index }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const hover = useWebHover({
    hoverStyle: {
      transform: "translateY(-8px) scale(1.01)",
      boxShadow: "0 24px 60px rgba(27, 67, 50, 0.2)",
    },
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  });

  const iconHover = useWebHover({
    hoverStyle: {
      transform: "scale(1.1) rotate(5deg)",
    },
    transition: "all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.95}
      // @ts-ignore
      onMouseEnter={() => {
        hover.handlers.onMouseEnter();
        iconHover.handlers.onMouseEnter();
      }}
      onMouseLeave={() => {
        hover.handlers.onMouseLeave();
        iconHover.handlers.onMouseLeave();
      }}
      style={[
        styles.featureCard,
        hover.style,
        mounted && {
          // @ts-ignore
          animation: `fadeInUp 0.6s ease-out ${0.2 + index * 0.15}s forwards`,
          opacity: 0,
        },
      ]}
    >
      <LinearGradient
        colors={data.gradient as [string, string, ...string[]]}
        style={styles.featureCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.featureCardPattern} />
      <View style={styles.featureCardContent}>
        <View style={styles.featureCardHeader}>
          <View style={[styles.featureCardIcon, iconHover.style]}>
            <Ionicons name={data.icon} size={28} color={colors.accent} />
          </View>
          <View style={styles.featureCardTitleWrap}>
            <Text style={styles.featureCardSubtitle}>{data.subtitle}</Text>
            <Text style={styles.featureCardTitle}>{data.title}</Text>
          </View>
        </View>
        <Text style={styles.featureCardDescription}>{data.description}</Text>
        {data.stats && (
          <View style={styles.featureCardStats}>
            {data.stats.map((stat, i) => (
              <View key={i} style={styles.featureCardStat}>
                <Text style={styles.featureCardStatValue}>{stat.value}</Text>
                <Text style={styles.featureCardStatLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.featureCardCTA}>
          <Text style={styles.featureCardCTAText}>Explore</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.text.white} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const QuickLinkCard: React.FC<{
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  index: number;
}> = ({ title, icon, onPress, index }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const hover = useWebHover({
    hoverStyle: {
      transform: "translateY(-4px)",
      boxShadow: "0 12px 40px rgba(27, 67, 50, 0.15)",
    },
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[
        styles.quickLinkCard,
        hover.style,
        mounted && {
          // @ts-ignore
          animation: `fadeInUp 0.5s ease-out ${0.6 + index * 0.1}s forwards`,
          opacity: 0,
        },
      ]}
    >
      <View style={styles.quickLinkIcon}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={styles.quickLinkTitle}>{title}</Text>
      <Ionicons name="arrow-forward" size={16} color={colors.text.tertiary} />
    </TouchableOpacity>
  );
};

type WebDashboardContentProps = {
  onNavigate: (id: string) => void;
  userName?: string;
};

export const WebDashboardContent: React.FC<WebDashboardContentProps> = ({
  onNavigate,
  userName,
}) => {
  const { width } = useWindowDimensions();
  const isWide = width >= 1400;

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeHeader}>
          <Text style={styles.welcomeDate}>{currentDate}</Text>
          <Text style={styles.welcomeTitle}>
            Assalamu Alaikum{userName ? `, ${userName}` : ""}
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Continue your journey of Islamic knowledge and spiritual growth.
          </Text>
        </View>

        {/* Bismillah Card */}
        <View style={styles.bismillahCard}>
          <LinearGradient
            colors={["#0D2818", "#1B4332"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.bismillahPattern} />
          <View style={styles.bismillahContent}>
            <Text style={styles.bismillahArabic}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </Text>
            <Text style={styles.bismillahTranslation}>
              In the name of Allah, the Most Gracious, the Most Merciful
            </Text>
          </View>
        </View>
      </View>

      {/* Feature Cards */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Explore Your Faith</Text>
        <Text style={styles.sectionSubtitle}>
          Dive into the core aspects of Islamic learning
        </Text>
      </View>

      <View
        style={[styles.featureCardsGrid, isWide && styles.featureCardsGridWide]}
      >
        {FEATURE_CARDS.map((card, index) => (
          <FeatureCard
            key={card.id}
            data={card}
            onPress={() => onNavigate(card.id)}
            index={index}
          />
        ))}
      </View>

      {/* Quick Links */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
      </View>

      <View style={styles.quickLinksGrid}>
        <QuickLinkCard
          title="My Profile"
          icon="person-outline"
          onPress={() => onNavigate("profile")}
          index={0}
        />
        <QuickLinkCard
          title="About Us"
          icon="information-circle-outline"
          onPress={() => onNavigate("about")}
          index={1}
        />
        <QuickLinkCard
          title="Contact"
          icon="mail-outline"
          onPress={() => onNavigate("contact")}
          index={2}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with love for the Ummah</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 40,
    paddingBottom: 60,
  },
  welcomeSection: {
    marginBottom: 48,
  },
  welcomeHeader: {
    marginBottom: 32,
  },
  welcomeDate: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text.tertiary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  welcomeTitle: {
    fontSize: 42,
    fontWeight: "600",
    color: colors.text.primary,
    letterSpacing: -1,
    marginBottom: 12,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  welcomeSubtitle: {
    fontSize: 17,
    color: colors.text.secondary,
    lineHeight: 28,
    maxWidth: 600,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  bismillahCard: {
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    // @ts-ignore
    boxShadow: "0 16px 48px rgba(27, 67, 50, 0.2)",
  },
  bismillahPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    // @ts-ignore
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40z' fill='none' stroke='%23D4A373' stroke-width='1'/%3E%3C/svg%3E")`,
    backgroundSize: "80px 80px",
  },
  bismillahContent: {
    padding: 48,
    alignItems: "center",
  },
  bismillahArabic: {
    fontSize: 36,
    fontWeight: "700",
    color: colors.accent,
    textAlign: "center",
    marginBottom: 16,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  bismillahTranslation: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    fontStyle: "italic",
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  sectionSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  featureCardsGrid: {
    flexDirection: "column",
    gap: 24,
    marginBottom: 48,
  },
  featureCardsGridWide: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  featureCard: {
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    minHeight: 280,
    // @ts-ignore
    boxShadow: "0 8px 32px rgba(27, 67, 50, 0.12)",
    cursor: "pointer",
    flex: 1,
    minWidth: 320,
    maxWidth: 500,
  },
  featureCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  featureCardPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08,
    // @ts-ignore
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,
    backgroundSize: "60px 60px",
  },
  featureCardContent: {
    padding: 32,
    flex: 1,
    justifyContent: "space-between",
    position: "relative",
    zIndex: 1,
  },
  featureCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  featureCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    // @ts-ignore
    transition: "all 0.3s ease-out",
  },
  featureCardTitleWrap: {
    flex: 1,
  },
  featureCardSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.accent,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  featureCardTitle: {
    fontSize: 26,
    fontWeight: "600",
    color: colors.text.white,
    letterSpacing: -0.5,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  featureCardDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 24,
    marginBottom: 24,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  featureCardStats: {
    flexDirection: "row",
    gap: 32,
    marginBottom: 24,
  },
  featureCardStat: {
    alignItems: "flex-start",
  },
  featureCardStatValue: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.accent,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  featureCardStatLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  featureCardCTA: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    gap: 8,
  },
  featureCardCTAText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.white,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  quickLinksGrid: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 48,
    flexWrap: "wrap",
  },
  quickLinkCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    paddingRight: 24,
    gap: 16,
    // @ts-ignore
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
    cursor: "pointer",
    minWidth: 200,
  },
  quickLinkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${colors.primary}10`,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLinkTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  footer: {
    alignItems: "center",
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 14,
    color: colors.text.tertiary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
});
