/**
 * WebDashboardContent - Dashboard home content
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, borderRadius } from "@/theme";
import { useWebHover } from "@/hooks/useWebHover";
import { HomeStreakBanner } from "@/components/home/HomeStreakBanner";
import { useQuery } from "@tanstack/react-query";
import { getLocalDayKey } from "@/services/streakService";
import { verseOfDayService } from "@/services/verseOfDayService";

type FeatureCardData = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  stats?: { label: string; value: string }[];
};

// Green gradient palette based on #1B4332 (darkest to lightest)
const GRADIENT_PALETTE = [
  "#0D2818", // darkest
  "#1B4332",
  "#2D6A4F",
  "#40916C",
  "#52B788",
  "#74C69D",
  "#95D5B2", // lightest
];

// Calculate gradient colors for a card based on its position in the grid
const getCardGradient = (index: number, totalCards: number): [string, string] => {
  const maxIndex = GRADIENT_PALETTE.length - 1;
  // Calculate position in gradient (0 to 1)
  const startPos = totalCards > 1 ? (index / (totalCards - 1)) * (maxIndex - 1) : 0;
  const endPos = Math.min(startPos + 1.5, maxIndex);

  const startColorIndex = Math.floor(startPos);
  const endColorIndex = Math.min(Math.ceil(endPos), maxIndex);

  return [GRADIENT_PALETTE[startColorIndex], GRADIENT_PALETTE[endColorIndex]];
};

// Determine if card should use dark text based on its position (lighter backgrounds need dark text)
const shouldUseDarkText = (index: number, totalCards: number): boolean => {
  // Cards in the latter half of the grid have lighter backgrounds
  const threshold = totalCards > 1 ? (totalCards - 1) * 0.5 : 1;
  return index >= threshold;
};

// Dark green color for text on light backgrounds
const DARK_TEXT_COLOR = "#0D2818";

const FEATURE_CARDS: FeatureCardData[] = [
  {
    id: "quran",
    title: "The Holy Quran",
    subtitle: "114 Surahs",
    description:
      "Explore the divine revelation with translations, transliterations, and beautiful recitations from renowned Qaris.",
    icon: "book",
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
  totalCards: number;
}> = ({ data, onPress, index, totalCards }) => {
  const [mounted, setMounted] = useState(false);
  const gradient = getCardGradient(index, totalCards);
  const useDarkText = shouldUseDarkText(index, totalCards);

  // Dynamic colors based on background brightness
  const textColor = useDarkText ? DARK_TEXT_COLOR : colors.text.white;
  const subtitleColor = useDarkText ? "#1B4332" : colors.accent;
  const descriptionColor = useDarkText ? "rgba(13, 40, 24, 0.85)" : "rgba(255, 255, 255, 0.85)";
  const statValueColor = useDarkText ? "#1B4332" : colors.accent;
  const statLabelColor = useDarkText ? "rgba(13, 40, 24, 0.7)" : "rgba(255, 255, 255, 0.7)";
  const iconBgColor = useDarkText ? "rgba(13, 40, 24, 0.12)" : "rgba(255, 255, 255, 0.15)";
  const ctaBgColor = useDarkText ? "rgba(13, 40, 24, 0.12)" : "rgba(255, 255, 255, 0.15)";
  const patternColor = useDarkText ? "%230D2818" : "white"; // URL encoded for SVG

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
        colors={gradient as [string, string, ...string[]]}
        style={styles.featureCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View
        style={[
          styles.featureCardPattern,
          // @ts-ignore
          { backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='none' stroke='${patternColor}' stroke-width='1'/%3E%3C/svg%3E")` },
        ]}
      />
      <View style={styles.featureCardContent}>
        <View style={styles.featureCardHeader}>
          <View style={[styles.featureCardIcon, iconHover.style, { backgroundColor: iconBgColor }]}>
            <Ionicons name={data.icon} size={28} color={subtitleColor} />
          </View>
          <View style={styles.featureCardTitleWrap}>
            <Text style={[styles.featureCardSubtitle, { color: subtitleColor }]}>{data.subtitle}</Text>
            <Text style={[styles.featureCardTitle, { color: textColor }]}>{data.title}</Text>
          </View>
        </View>
        <Text style={[styles.featureCardDescription, { color: descriptionColor }]}>{data.description}</Text>
        {data.stats && (
          <View style={styles.featureCardStats}>
            {data.stats.map((stat, i) => (
              <View key={i} style={styles.featureCardStat}>
                <Text style={[styles.featureCardStatValue, { color: statValueColor }]}>{stat.value}</Text>
                <Text style={[styles.featureCardStatLabel, { color: statLabelColor }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={[styles.featureCardCTA, { backgroundColor: ctaBgColor }]}>
          <Text style={[styles.featureCardCTAText, { color: textColor }]}>Explore</Text>
          <Ionicons name="arrow-forward" size={18} color={textColor} />
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

const VerseOfDayCard: React.FC<{
  arabicText: string;
  verseKey: string;
  chapterName: string;
  onPress: () => void;
}> = ({ arabicText, verseKey, chapterName, onPress }) => {
  const hover = useWebHover({
    hoverStyle: {
      transform: "translateY(-6px)",
      boxShadow: "0 30px 60px rgba(27, 67, 50, 0.18)",
    },
    transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.95}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[styles.verseOfDayCard, hover.style]}
    >
      <LinearGradient
        colors={["#0D2818", "#1B4332", "#2D6A4F"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.verseOfDayPattern} />

      <View style={styles.verseOfDayColumn}>
        <View style={styles.verseOfDayBadge}>
          <Text style={styles.verseOfDayBadgeText}>Verse of the Day</Text>
        </View>
        <Text style={styles.verseOfDayCardTitle}>A daily ayah to reflect on</Text>
        <Text style={styles.verseOfDayCardSubtitle}>
          Tap to open today&apos;s verse in a focused reading view.
        </Text>
      </View>

      <View style={styles.verseOfDayColumnWide}>
        <Text style={styles.verseOfDayArabic} numberOfLines={4}>
          {arabicText}
        </Text>
      </View>

      <View style={styles.verseOfDayFooter}>
        <Text style={styles.verseOfDayReference}>{verseKey}</Text>
        <Text style={styles.verseOfDayChapter}>{chapterName}</Text>
        <View style={styles.verseOfDayOpen}>
          <Text style={styles.verseOfDayOpenText}>Open</Text>
          <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.85)" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

type WebDashboardContentProps = {
  onNavigate: (id: string) => void;
  onOpenVerseOfDay: () => void;
  userName?: string;
  streakCount: number;
  showStreakBanner: boolean;
  onHideStreakBanner: () => void;
  streakCelebrationKey: number;
};

export const WebDashboardContent: React.FC<WebDashboardContentProps> = ({
  onNavigate,
  onOpenVerseOfDay,
  userName,
  streakCount,
  showStreakBanner,
  onHideStreakBanner,
  streakCelebrationKey,
}) => {
  const { width } = useWindowDimensions();
  const isWide = width >= 1400;
  const dayKey = getLocalDayKey();
  const streakHover = useWebHover({
    hoverStyle: {
      transform: "translateY(-1px)",
      boxShadow: "0 14px 30px rgba(212, 163, 115, 0.18)",
    },
    transition: "all 0.25s ease-out",
  });
  const iconScale = useRef(new Animated.Value(1)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const countScale = useRef(new Animated.Value(1)).current;

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const verseOfDayQuery = useQuery({
    queryKey: ["verseOfDay", dayKey],
    queryFn: () => verseOfDayService.getVerseOfDay(dayKey),
  });

  useEffect(() => {
    if (streakCelebrationKey === 0) {
      return;
    }

    iconScale.setValue(0.9);
    iconRotate.setValue(0);
    countScale.setValue(0.85);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(iconRotate, {
          toValue: 1,
          duration: 520,
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 100,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(iconScale, {
          toValue: 1.18,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(120),
        Animated.timing(countScale, {
          toValue: 1.22,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(countScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [countScale, iconRotate, iconScale, streakCelebrationKey]);

  const iconSpin = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <HomeStreakBanner
        visible={showStreakBanner}
        streakCount={streakCount}
        topInset={16}
        onHide={onHideStreakBanner}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeHeaderRow}>
            <View style={styles.welcomeHeader}>
              <Text style={styles.welcomeDate}>{currentDate}</Text>
              <Text style={styles.welcomeTitle}>
                Assalamu Alaikum{userName ? `, ${userName}` : ""}
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Continue your journey of Islamic knowledge and spiritual growth.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={1}
              // @ts-ignore
              onMouseEnter={streakHover.handlers.onMouseEnter}
              onMouseLeave={streakHover.handlers.onMouseLeave}
              style={streakHover.style}
            >
              <Animated.View
                style={[
                  styles.streakPill,
                  {
                    transform: [{ scale: countScale }],
                  },
                ]}
              >
                <View style={styles.streakPillShimmer} />
                <Animated.View
                  style={{
                    transform: [{ scale: iconScale }, { rotate: iconSpin }],
                  }}
                >
                  <Ionicons name="trophy" size={18} color={colors.accentDark} />
                </Animated.View>
                <Text style={styles.streakText}>{streakCount}</Text>
              </Animated.View>
            </TouchableOpacity>
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
              totalCards={FEATURE_CARDS.length}
            />
          ))}
        </View>

        {/* Verse of the Day */}
        {verseOfDayQuery.data ? (
          <VerseOfDayCard
            arabicText={verseOfDayQuery.data.arabicText}
            verseKey={verseOfDayQuery.data.verseKey}
            chapterName={verseOfDayQuery.data.chapterName}
            onPress={onOpenVerseOfDay}
          />
        ) : verseOfDayQuery.isLoading ? (
          <View style={styles.verseOfDayLoading}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.verseOfDayLoadingText}>Preparing today's verse...</Text>
          </View>
        ) : verseOfDayQuery.isError ? (
          <TouchableOpacity
            onPress={onOpenVerseOfDay}
            activeOpacity={0.95}
            style={[styles.verseOfDayLoading, styles.verseOfDayFallback]}
          >
            <Ionicons name="sparkles-outline" size={22} color={colors.primary} />
            <Text style={styles.verseOfDayLoadingText}>Verse of the Day is ready to open</Text>
          </TouchableOpacity>
        ) : null}

        {/* Quick Links */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
        </View>

        <View style={styles.quickLinksGrid}>
          <QuickLinkCard
            title="Bookmarks"
            icon="bookmark-outline"
            onPress={() => onNavigate("bookmarks")}
            index={0}
          />
          <QuickLinkCard
            title="My Profile"
            icon="person-outline"
            onPress={() => onNavigate("profile")}
            index={1}
          />
          <QuickLinkCard
            title="About Us"
            icon="information-circle-outline"
            onPress={() => onNavigate("about")}
            index={2}
          />
          <QuickLinkCard
            title="Contact"
            icon="mail-outline"
            onPress={() => onNavigate("contact")}
            index={3}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with love for the Ummah</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
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
  welcomeHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 32,
  },
  welcomeHeader: {
    flex: 1,
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
  streakPill: {
    minWidth: 72,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: borderRadius.round,
    backgroundColor: "rgba(212, 163, 115, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(212, 163, 115, 0.35)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
    // @ts-ignore
    boxShadow: "0 8px 24px rgba(212, 163, 115, 0.14)",
  },
  streakPillShimmer: {
    position: "absolute",
    top: -10,
    bottom: -10,
    left: -24,
    width: 24,
    transform: [{ rotate: "20deg" }],
    backgroundColor: "rgba(255,255,255,0.28)",
    // @ts-ignore
    animation: "shimmer 2.8s ease-in-out infinite",
  },
  streakText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.accentDark,
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
  verseOfDayCard: {
    minHeight: 260,
    borderRadius: 28,
    overflow: "hidden",
    padding: 28,
    marginBottom: 42,
    position: "relative",
    // @ts-ignore
    cursor: "pointer",
  },
  verseOfDayPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.09,
    // @ts-ignore
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='84' height='84' viewBox='0 0 84 84' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M42 0L84 42L42 84L0 42z' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,
    backgroundSize: "84px 84px",
  },
  verseOfDayColumn: {
    maxWidth: 360,
    marginBottom: 24,
  },
  verseOfDayColumnWide: {
    marginBottom: 28,
  },
  verseOfDayBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.round,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginBottom: 18,
  },
  verseOfDayBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text.white,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  verseOfDayCardTitle: {
    fontSize: 34,
    fontWeight: "600",
    color: colors.text.white,
    marginBottom: 10,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  verseOfDayCardSubtitle: {
    fontSize: 16,
    lineHeight: 26,
    color: "rgba(255,255,255,0.78)",
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  verseOfDayArabic: {
    fontSize: 34,
    lineHeight: 58,
    color: colors.text.white,
    textAlign: "right",
    // @ts-ignore
    fontFamily: "'Amiri', serif",
    direction: "rtl",
  },
  verseOfDayFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginTop: "auto",
  },
  verseOfDayReference: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.78)",
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  verseOfDayChapter: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.white,
    textAlign: "center",
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  verseOfDayOpen: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  verseOfDayOpenText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.82)",
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  verseOfDayLoading: {
    minHeight: 140,
    borderRadius: 24,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 42,
  },
  verseOfDayFallback: {
    // @ts-ignore
    cursor: "pointer",
  },
  verseOfDayLoadingText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: "500",
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
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
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    marginBottom: 48,
    justifyContent: "center",
  },
  featureCardsGridWide: {
    // No changes needed - base style handles it
  },
  featureCard: {
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    minHeight: 280,
    // @ts-ignore
    boxShadow: "0 8px 32px rgba(27, 67, 50, 0.12)",
    cursor: "pointer",
    width: "calc(33.333% - 16px)",
    minWidth: 300,
    maxWidth: 400,
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
