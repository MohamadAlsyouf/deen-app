/**
 * WebSunnahContent - Web version of the Sunnah screen
 * Prophetic practices organized by category with expand/collapse cards
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

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];
type RulingType = "fardh" | "recommended";

type SunnahItem = {
  title: string;
  arabic?: string;
  description: string;
  ruling: RulingType;
  reference?: string;
};

type SunnahCategory = {
  id: string;
  label: string;
  icon: IoniconName;
  color: string;
  gradient: [string, string];
  intro: string;
  items: SunnahItem[];
};

const RULING_CONFIG: Record<
  RulingType,
  { label: string; color: string; bg: string; icon: IoniconName }
> = {
  fardh: {
    label: "Obligatory (Fardh)",
    color: "#C62828",
    bg: "#FFEBEE",
    icon: "alert-circle",
  },
  recommended: {
    label: "Recommended (Sunnah)",
    color: colors.primary,
    bg: "#E8F5E9",
    icon: "star",
  },
};

const CATEGORIES: SunnahCategory[] = [
  {
    id: "eating",
    label: "Eating",
    icon: "restaurant-outline",
    color: "#2E7D32",
    gradient: ["#1B5E20", "#2E7D32"],
    intro:
      "The Prophet \uFDFA taught us that eating is not merely sustenance but an act of worship when done with the right intention and manners.",
    items: [
      {
        title: "Say Bismillah before eating",
        arabic: "\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064E\u0647\u0650",
        description:
          'Begin every meal by saying "Bismillah" (In the Name of Allah). If you forget at the start, say "Bismillahi awwalahu wa aakhirahu" (In the Name of Allah, at its beginning and its end).',
        ruling: "recommended",
        reference: "Abu Dawud 3767",
      },
      {
        title: "Eat with the right hand",
        description:
          'The Prophet \uFDFA said: "Eat with your right hand and drink with your right hand, for the Shaytaan eats with his left hand and drinks with his left hand."',
        ruling: "recommended",
        reference: "Muslim 2020",
      },
      {
        title: "Eat from what is nearest to you",
        description:
          "When eating from a shared plate, eat from the portion closest to you. Do not reach across or pick from the middle of the dish.",
        ruling: "recommended",
        reference: "Bukhari 5376",
      },
      {
        title: "Do not eat to excess",
        description:
          'The Prophet \uFDFA said: "A human being fills no worse vessel than his stomach. It is sufficient for a son of Adam to eat a few mouthfuls\u2026 But if he must, then one-third for food, one-third for drink, and one-third for air."',
        ruling: "recommended",
        reference: "Tirmidhi 2380",
      },
      {
        title: "Say Alhamdulillah after eating",
        arabic: "\u0671\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u0651\u064E\u0647\u0650",
        description:
          'After finishing a meal, praise Allah by saying "Alhamdulillah" (All praise is due to Allah). The Prophet \uFDFA said Allah is pleased with His servant who praises Him after eating and drinking.',
        ruling: "recommended",
        reference: "Muslim 2734",
      },
      {
        title: "Avoid eating haram (forbidden) foods",
        description:
          "Consuming only halal food is an obligation. This includes avoiding pork, alcohol, blood, and any meat not slaughtered in Allah's name. This is a clear command in the Quran.",
        ruling: "fardh",
        reference: "Quran 2:173",
      },
    ],
  },
  {
    id: "sleeping",
    label: "Sleeping",
    icon: "moon-outline",
    color: "#1565C0",
    gradient: ["#0D47A1", "#1565C0"],
    intro:
      "Sleep is a blessing from Allah. The Prophet \uFDFA had a beautiful routine around sleep that combined remembrance of Allah with practical wisdom.",
    items: [
      {
        title: "Perform wudu before sleeping",
        description:
          'The Prophet \uFDFA advised performing ablution (wudu) before going to bed. He said: "When you go to bed, perform wudu as you would for prayer."',
        ruling: "recommended",
        reference: "Bukhari 247",
      },
      {
        title: "Sleep on your right side",
        description:
          "Lie down on your right side when going to sleep. The Prophet \uFDFA would place his right hand under his right cheek.",
        ruling: "recommended",
        reference: "Bukhari 6314",
      },
      {
        title: "Recite Ayat al-Kursi",
        arabic: "\u0622\u064A\u0629 \u0627\u0644\u0643\u0631\u0633\u064A",
        description:
          'Reciting Ayat al-Kursi (Quran 2:255) before sleeping. The Prophet \uFDFA said that whoever recites it, a guardian from Allah will protect them throughout the night.',
        ruling: "recommended",
        reference: "Bukhari 5010",
      },
      {
        title: "Recite the last two verses of Surah Al-Baqarah",
        description:
          'The Prophet \uFDFA said: "Whoever recites the last two verses of Surah Al-Baqarah at night, they will be sufficient for him."',
        ruling: "recommended",
        reference: "Bukhari 5009",
      },
      {
        title: "Dust off the bed three times",
        description:
          "Before lying down, brush off your bed with the edge of your garment three times, as you do not know what may have come onto it after you left.",
        ruling: "recommended",
        reference: "Bukhari 6320",
      },
      {
        title: "Recite morning adhkar upon waking",
        arabic: "\u0623\u0630\u0643\u0627\u0631 \u0627\u0644\u0635\u0628\u0627\u062D",
        description:
          "Upon waking, say: \"Alhamdulillahilladhi ahyana ba'da ma amatana wa ilayhin-nushoor\" (Praise be to Allah who gave us life after death and unto Him is the resurrection).",
        ruling: "recommended",
        reference: "Bukhari 6324",
      },
    ],
  },
  {
    id: "speaking",
    label: "Speaking",
    icon: "chatbubble-outline",
    color: "#6A1B9A",
    gradient: ["#4A148C", "#6A1B9A"],
    intro:
      "The tongue can be the source of immense reward or great sin. The Prophet \uFDFA emphasized guarding the tongue and speaking only good.",
    items: [
      {
        title: "Speak the truth",
        description:
          'The Prophet \uFDFA said: "Truthfulness leads to righteousness and righteousness leads to Paradise." Lying is strictly forbidden except in specific cases (reconciling between people, in war, between spouses).',
        ruling: "fardh",
        reference: "Bukhari 6094",
      },
      {
        title: "Speak good or remain silent",
        description:
          'The Prophet \uFDFA said: "Whoever believes in Allah and the Last Day, let him speak good or remain silent." This is a foundational principle of Islamic speech ethics.',
        ruling: "recommended",
        reference: "Bukhari 6018",
      },
      {
        title: "Avoid backbiting (gheebah)",
        description:
          "Backbiting \u2014 mentioning something about a person in their absence that they would dislike \u2014 is a major sin compared in the Quran to eating the flesh of your dead brother.",
        ruling: "fardh",
        reference: "Quran 49:12",
      },
      {
        title: "Say Salam when greeting",
        arabic: "\u0671\u0644\u0633\u0651\u064E\u0644\u0627\u0645\u064F \u0639\u064E\u0644\u064E\u064A\u0652\u0643\u064F\u0645\u0652",
        description:
          'Greet fellow Muslims with "Assalamu Alaikum" (Peace be upon you). The Prophet \uFDFA said: "You will not enter Paradise until you believe, and you will not believe until you love one another. Shall I tell you of something that will make you love one another? Spread the Salam."',
        ruling: "recommended",
        reference: "Muslim 54",
      },
      {
        title: "Say Yarhamuk Allah when someone sneezes",
        arabic: "\u064A\u064E\u0631\u0652\u062D\u064E\u0645\u064F\u0643\u064E \u0671\u0644\u0644\u0651\u064E\u0647\u064F",
        description:
          'When someone sneezes and says "Alhamdulillah," respond with "Yarhamuk Allah" (May Allah have mercy on you). They should then reply "Yahdikumullah" (May Allah guide you).',
        ruling: "recommended",
        reference: "Bukhari 6224",
      },
      {
        title: "Avoid swearing and foul language",
        description:
          'The Prophet \uFDFA said: "The believer is not a slanderer, nor does he curse others, and nor is he immoral or shameless." Keeping one\'s speech clean is a sign of strong faith.',
        ruling: "recommended",
        reference: "Tirmidhi 1977",
      },
    ],
  },
  {
    id: "traveling",
    label: "Traveling",
    icon: "airplane-outline",
    color: "#E65100",
    gradient: ["#BF360C", "#E65100"],
    intro:
      "The Prophet \uFDFA traveled extensively and established beautiful practices for journeys \u2014 from the dua of departure to the etiquette of returning home.",
    items: [
      {
        title: "Recite the travel dua",
        arabic: "\u0633\u064F\u0628\u0652\u062D\u064E\u0627\u0646\u064E \u0627\u0644\u0651\u064E\u0630\u0650\u064A \u0633\u064E\u062E\u0651\u064E\u0631\u064E \u0644\u064E\u0646\u064E\u0627 \u0647\u064E\u0640\u0670\u0630\u064E\u0627",
        description:
          'When mounting a vehicle or beginning a journey, recite: "Subhaanalladhi sakh-khara lanaa haadha wa maa kunnaa lahu muqrineen, wa innaa ilaa Rabbinaa lamunqaliboon" (Glory be to Him who has subjected this for us, for we could never have accomplished this by ourselves. Verily, unto our Lord we are returning).',
        ruling: "recommended",
        reference: "Muslim 1342",
      },
      {
        title: "Pray two rakat before departing",
        description:
          "It is recommended to pray two rakat (units of prayer) before setting out on a journey and two rakat upon returning home.",
        ruling: "recommended",
        reference: "Bukhari 1189",
      },
      {
        title: "Shorten prayers while traveling (Qasr)",
        description:
          "When traveling a qualifying distance, four-rakat prayers (Dhuhr, Asr, Isha) are shortened to two rakat. This is a strong Sunnah that the Prophet \uFDFA consistently practiced.",
        ruling: "recommended",
        reference: "Quran 4:101",
      },
      {
        title: "Appoint a leader for group travel",
        description:
          'The Prophet \uFDFA said: "When three people set out on a journey, let them appoint one of their number as their leader." This ensures organization and collective decision-making.',
        ruling: "recommended",
        reference: "Abu Dawud 2608",
      },
      {
        title: "Make dua during travel",
        description:
          "The supplication of a traveler is accepted. The Prophet \uFDFA said there are three duas that are not rejected, and one of them is the dua of a traveler until they return.",
        ruling: "recommended",
        reference: "Tirmidhi 3448",
      },
      {
        title: "Say the dua upon returning home",
        description:
          'When returning from a journey, the Prophet \uFDFA would say: "Aayiboona, taa\'iboona, \'aabidoona, li Rabbinaa haamidoon" (We are returning, repenting, worshipping, and praising our Lord).',
        ruling: "recommended",
        reference: "Bukhari 1797",
      },
    ],
  },
];

const CategoryTab: React.FC<{
  category: SunnahCategory;
  isActive: boolean;
  onPress: () => void;
}> = ({ category, isActive, onPress }) => {
  const hover = useWebHover({
    hoverStyle: isActive
      ? {}
      : {
          backgroundColor: colors.surface,
          transform: "translateY(-2px)",
        },
    transition: "all 0.2s ease-out",
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[
        styles.categoryTab,
        isActive && { backgroundColor: category.color },
        !isActive && hover.style,
      ]}
    >
      <Ionicons
        name={category.icon}
        size={18}
        color={isActive ? "#fff" : colors.text.secondary}
      />
      <Text
        style={[
          styles.categoryTabText,
          isActive && styles.categoryTabTextActive,
        ]}
      >
        {category.label}
      </Text>
      <Text
        style={[
          styles.categoryTabCount,
          isActive && styles.categoryTabCountActive,
        ]}
      >
        {category.items.length}
      </Text>
    </TouchableOpacity>
  );
};

const SunnahItemCard: React.FC<{
  item: SunnahItem;
  accentColor: string;
  index: number;
}> = ({ item, accentColor, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ruling = RULING_CONFIG[item.ruling];

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const hover = useWebHover({
    hoverStyle: {
      transform: "translateY(-3px)",
      boxShadow: "0 12px 36px rgba(0, 0, 0, 0.1)",
    },
    transition: "all 0.25s ease-out",
  });

  const handleToggle = () => setExpanded((prev) => !prev);

  return (
    <TouchableOpacity
      onPress={handleToggle}
      activeOpacity={0.95}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[
        styles.itemCard,
        hover.style,
        mounted && {
          // @ts-ignore
          animation: `fadeInUp 0.4s ease-out ${0.1 + index * 0.06}s forwards`,
          opacity: 0,
        },
      ]}
    >
      <View style={styles.itemHeader}>
        <View style={[styles.rulingBadge, { backgroundColor: ruling.bg }]}>
          <Ionicons name={ruling.icon} size={16} color={ruling.color} />
        </View>
        <View style={styles.itemContent}>
          {item.arabic && (
            <Text style={styles.itemArabic}>{item.arabic}</Text>
          )}
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={[styles.rulingLabel, { color: ruling.color }]}>
            {ruling.label}
          </Text>
        </View>
        <View
          style={[
            styles.expandIcon,
            expanded && styles.expandIconActive,
          ]}
        >
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={expanded ? accentColor : colors.text.tertiary}
          />
        </View>
      </View>

      {expanded && (
        <View style={styles.itemExpanded}>
          <View style={[styles.itemDivider, { backgroundColor: `${accentColor}20` }]} />
          <Text style={styles.itemDescription}>{item.description}</Text>
          {item.reference && (
            <View style={[styles.referenceRow, { backgroundColor: `${accentColor}10` }]}>
              <Ionicons name="bookmark" size={14} color={accentColor} />
              <Text style={[styles.referenceText, { color: accentColor }]}>
                {item.reference}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export const WebSunnahContent: React.FC = () => {
  const { width } = useWindowDimensions();
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [itemKey, setItemKey] = useState(0);

  const category = CATEGORIES.find((c) => c.id === activeCategory)!;

  const handleCategoryChange = (id: string) => {
    setActiveCategory(id);
    setItemKey((k) => k + 1);
  };

  const fardhCount = category.items.filter((i) => i.ruling === "fardh").length;
  const sunnahCount = category.items.filter(
    (i) => i.ruling === "recommended"
  ).length;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerGradientWrap}>
          <LinearGradient
            colors={["#0D2818", "#1B4332", "#2D6A4F"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.headerPattern} />
          <View style={styles.headerContent}>
            <View style={styles.headerBadge}>
              <Ionicons name="sunny" size={16} color={colors.accent} />
              <Text style={styles.headerBadgeText}>Prophetic Traditions</Text>
            </View>
            <Text style={styles.headerTitle}>Sunnah</Text>
            <Text style={styles.headerSubtitle}>
              Discover the beautiful practices of the Prophet Muhammad {"\uFDFA"}{" "}
              for daily life, organized by category with hadith references.
            </Text>
            <View style={styles.headerStats}>
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>
                  {CATEGORIES.length}
                </Text>
                <Text style={styles.headerStatLabel}>Categories</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>
                  {CATEGORIES.reduce((sum, c) => sum + c.items.length, 0)}
                </Text>
                <Text style={styles.headerStatLabel}>Practices</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStat}>
                <Text style={styles.headerStatValue}>
                  {CATEGORIES.reduce(
                    (sum, c) =>
                      sum + c.items.filter((i) => i.reference).length,
                    0
                  )}
                </Text>
                <Text style={styles.headerStatLabel}>References</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryTabs}>
        {CATEGORIES.map((cat) => (
          <CategoryTab
            key={cat.id}
            category={cat}
            isActive={cat.id === activeCategory}
            onPress={() => handleCategoryChange(cat.id)}
          />
        ))}
      </View>

      {/* Category Intro Card */}
      <View
        style={[styles.introCard, { borderLeftColor: category.color }]}
      >
        <View style={styles.introHeader}>
          <View
            style={[
              styles.introIconWrap,
              { backgroundColor: `${category.color}15` },
            ]}
          >
            <Ionicons name={category.icon} size={22} color={category.color} />
          </View>
          <View style={styles.introTextWrap}>
            <Text style={[styles.introTitle, { color: category.color }]}>
              Sunnahs of {category.label}
            </Text>
            <Text style={styles.introCount}>
              {category.items.length} practices
            </Text>
          </View>
        </View>
        <Text style={styles.introDescription}>{category.intro}</Text>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: RULING_CONFIG.fardh.color },
            ]}
          />
          <Text style={styles.legendText}>
            Fardh / Obligatory ({fardhCount})
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: RULING_CONFIG.recommended.color },
            ]}
          />
          <Text style={styles.legendText}>
            Sunnah / Recommended ({sunnahCount})
          </Text>
        </View>
      </View>

      {/* Items Grid */}
      <View
        key={itemKey}
        style={[
          styles.itemsGrid,
          width >= 1200 && styles.itemsGridWide,
        ]}
      >
        {category.items.map((item, i) => (
          <SunnahItemCard
            key={`${activeCategory}-${i}`}
            item={item}
            accentColor={category.color}
            index={i}
          />
        ))}
      </View>

      <View style={styles.spacer} />
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
  headerSection: {
    marginBottom: 32,
  },
  headerGradientWrap: {
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    // @ts-ignore
    boxShadow: "0 16px 48px rgba(27, 67, 50, 0.2)",
  },
  headerPattern: {
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
  headerContent: {
    padding: 48,
    paddingVertical: 40,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: "rgba(212, 163, 115, 0.15)",
    marginBottom: 16,
  },
  headerBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent,
    letterSpacing: 0.5,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: "600",
    color: colors.text.white,
    letterSpacing: -1,
    marginBottom: 12,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 26,
    maxWidth: 640,
    marginBottom: 28,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  headerStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  headerStat: {
    alignItems: "center",
  },
  headerStatValue: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.accent,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  headerStatLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  headerStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  categoryTabs: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
    flexWrap: "wrap",
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 100,
    backgroundColor: colors.background,
    gap: 8,
    // @ts-ignore
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.06)",
    cursor: "pointer",
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  categoryTabTextActive: {
    color: "#fff",
  },
  categoryTabCount: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text.tertiary,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  categoryTabCountActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    color: "#fff",
  },
  introCard: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 28,
    marginBottom: 24,
    borderLeftWidth: 4,
    // @ts-ignore
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
  },
  introHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 14,
  },
  introIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  introTextWrap: {
    flex: 1,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  introCount: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 2,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  introDescription: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 26,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  legendRow: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: "500",
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  itemsGrid: {
    flexDirection: "column",
    gap: 16,
  },
  itemsGridWide: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  itemCard: {
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: 24,
    // @ts-ignore
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
    cursor: "pointer",
    flex: 1,
    minWidth: 340,
    maxWidth: 600,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  rulingBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemArabic: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 4,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 4,
    lineHeight: 22,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  rulingLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  expandIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  expandIconActive: {
    backgroundColor: `${colors.primary}10`,
  },
  itemExpanded: {
    marginTop: 20,
  },
  itemDivider: {
    height: 1,
    marginBottom: 16,
    borderRadius: 1,
  },
  itemDescription: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 26,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  referenceRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  referenceText: {
    fontSize: 13,
    fontWeight: "700",
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  spacer: {
    height: 40,
  },
});
