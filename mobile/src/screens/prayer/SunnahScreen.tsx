import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Header, Card } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type RulingType = 'fardh' | 'recommended';

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
  intro: string;
  items: SunnahItem[];
};

const RULING_CONFIG: Record<RulingType, { label: string; color: string; bg: string; icon: IoniconName }> = {
  fardh: { label: 'Obligatory (Fardh)', color: '#C62828', bg: '#FFEBEE', icon: 'alert-circle' },
  recommended: { label: 'Recommended (Sunnah)', color: colors.primary, bg: '#E8F5E9', icon: 'star' },
};

const CATEGORIES: SunnahCategory[] = [
  {
    id: 'eating',
    label: 'Eating',
    icon: 'restaurant-outline',
    color: '#2E7D32',
    intro: 'The Prophet ﷺ taught us that eating is not merely sustenance but an act of worship when done with the right intention and manners.',
    items: [
      {
        title: 'Say Bismillah before eating',
        arabic: 'بِسْمِ ٱللَّهِ',
        description: 'Begin every meal by saying "Bismillah" (In the Name of Allah). If you forget at the start, say "Bismillahi awwalahu wa aakhirahu" (In the Name of Allah, at its beginning and its end).',
        ruling: 'recommended',
        reference: 'Abu Dawud 3767',
      },
      {
        title: 'Eat with the right hand',
        description: 'The Prophet ﷺ said: "Eat with your right hand and drink with your right hand, for the Shaytaan eats with his left hand and drinks with his left hand."',
        ruling: 'recommended',
        reference: 'Muslim 2020',
      },
      {
        title: 'Eat from what is nearest to you',
        description: 'When eating from a shared plate, eat from the portion closest to you. Do not reach across or pick from the middle of the dish.',
        ruling: 'recommended',
        reference: 'Bukhari 5376',
      },
      {
        title: 'Do not eat to excess',
        description: 'The Prophet ﷺ said: "A human being fills no worse vessel than his stomach. It is sufficient for a son of Adam to eat a few mouthfuls… But if he must, then one-third for food, one-third for drink, and one-third for air."',
        ruling: 'recommended',
        reference: 'Tirmidhi 2380',
      },
      {
        title: 'Say Alhamdulillah after eating',
        arabic: 'ٱلْحَمْدُ لِلَّهِ',
        description: 'After finishing a meal, praise Allah by saying "Alhamdulillah" (All praise is due to Allah). The Prophet ﷺ said Allah is pleased with His servant who praises Him after eating and drinking.',
        ruling: 'recommended',
        reference: 'Muslim 2734',
      },
      {
        title: 'Avoid eating haram (forbidden) foods',
        description: 'Consuming only halal food is an obligation. This includes avoiding pork, alcohol, blood, and any meat not slaughtered in Allah\'s name. This is a clear command in the Quran.',
        ruling: 'fardh',
        reference: 'Quran 2:173',
      },
    ],
  },
  {
    id: 'sleeping',
    label: 'Sleeping',
    icon: 'moon-outline',
    color: '#1565C0',
    intro: 'Sleep is a blessing from Allah. The Prophet ﷺ had a beautiful routine around sleep that combined remembrance of Allah with practical wisdom.',
    items: [
      {
        title: 'Perform wudu before sleeping',
        description: 'The Prophet ﷺ advised performing ablution (wudu) before going to bed. He said: "When you go to bed, perform wudu as you would for prayer."',
        ruling: 'recommended',
        reference: 'Bukhari 247',
      },
      {
        title: 'Sleep on your right side',
        description: 'Lie down on your right side when going to sleep. The Prophet ﷺ would place his right hand under his right cheek.',
        ruling: 'recommended',
        reference: 'Bukhari 6314',
      },
      {
        title: 'Recite Ayat al-Kursi',
        arabic: 'آية الكرسي',
        description: 'Reciting Ayat al-Kursi (Quran 2:255) before sleeping. The Prophet ﷺ said that whoever recites it, a guardian from Allah will protect them throughout the night.',
        ruling: 'recommended',
        reference: 'Bukhari 5010',
      },
      {
        title: 'Recite the last two verses of Surah Al-Baqarah',
        description: 'The Prophet ﷺ said: "Whoever recites the last two verses of Surah Al-Baqarah at night, they will be sufficient for him."',
        ruling: 'recommended',
        reference: 'Bukhari 5009',
      },
      {
        title: 'Dust off the bed three times',
        description: 'Before lying down, brush off your bed with the edge of your garment three times, as you do not know what may have come onto it after you left.',
        ruling: 'recommended',
        reference: 'Bukhari 6320',
      },
      {
        title: 'Recite morning adhkar upon waking',
        arabic: 'أَذْكَارُ الصَّبَاحِ',
        description: 'Upon waking, say: "Alhamdulillahilladhi ahyana ba\'da ma amatana wa ilayhin-nushoor" (Praise be to Allah who gave us life after death and unto Him is the resurrection).',
        ruling: 'recommended',
        reference: 'Bukhari 6324',
      },
    ],
  },
  {
    id: 'speaking',
    label: 'Speaking',
    icon: 'chatbubble-outline',
    color: '#6A1B9A',
    intro: 'The tongue can be the source of immense reward or great sin. The Prophet ﷺ emphasized guarding the tongue and speaking only good.',
    items: [
      {
        title: 'Speak the truth',
        description: 'The Prophet ﷺ said: "Truthfulness leads to righteousness and righteousness leads to Paradise." Lying is strictly forbidden except in specific cases (reconciling between people, in war, between spouses).',
        ruling: 'fardh',
        reference: 'Bukhari 6094',
      },
      {
        title: 'Speak good or remain silent',
        description: 'The Prophet ﷺ said: "Whoever believes in Allah and the Last Day, let him speak good or remain silent." This is a foundational principle of Islamic speech ethics.',
        ruling: 'recommended',
        reference: 'Bukhari 6018',
      },
      {
        title: 'Avoid backbiting (gheebah)',
        description: 'Backbiting — mentioning something about a person in their absence that they would dislike — is a major sin compared in the Quran to eating the flesh of your dead brother.',
        ruling: 'fardh',
        reference: 'Quran 49:12',
      },
      {
        title: 'Say Salam when greeting',
        arabic: 'ٱلسَّلَامُ عَلَيْكُمْ',
        description: 'Greet fellow Muslims with "Assalamu Alaikum" (Peace be upon you). The Prophet ﷺ said: "You will not enter Paradise until you believe, and you will not believe until you love one another. Shall I tell you of something that will make you love one another? Spread the Salam."',
        ruling: 'recommended',
        reference: 'Muslim 54',
      },
      {
        title: 'Say Yarhamuk Allah when someone sneezes',
        arabic: 'يَرْحَمُكَ ٱللَّهُ',
        description: 'When someone sneezes and says "Alhamdulillah," respond with "Yarhamuk Allah" (May Allah have mercy on you). They should then reply "Yahdikumullah" (May Allah guide you).',
        ruling: 'recommended',
        reference: 'Bukhari 6224',
      },
      {
        title: 'Avoid swearing and foul language',
        description: 'The Prophet ﷺ said: "The believer is not a slanderer, nor does he curse others, and nor is he immoral or shameless." Keeping one\'s speech clean is a sign of strong faith.',
        ruling: 'recommended',
        reference: 'Tirmidhi 1977',
      },
    ],
  },
  {
    id: 'traveling',
    label: 'Traveling',
    icon: 'airplane-outline',
    color: '#E65100',
    intro: 'The Prophet ﷺ traveled extensively and established beautiful practices for journeys — from the dua of departure to the etiquette of returning home.',
    items: [
      {
        title: 'Recite the travel dua',
        arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَـٰذَا',
        description: 'When mounting a vehicle or beginning a journey, recite: "Subhaanalladhi sakh-khara lanaa haadha wa maa kunnaa lahu muqrineen, wa innaa ilaa Rabbinaa lamunqaliboon" (Glory be to Him who has subjected this for us, for we could never have accomplished this by ourselves. Verily, unto our Lord we are returning).',
        ruling: 'recommended',
        reference: 'Muslim 1342',
      },
      {
        title: 'Pray two rakat before departing',
        description: 'It is recommended to pray two rakat (units of prayer) before setting out on a journey and two rakat upon returning home.',
        ruling: 'recommended',
        reference: 'Bukhari 1189',
      },
      {
        title: 'Shorten prayers while traveling (Qasr)',
        description: 'When traveling a qualifying distance, four-rakat prayers (Dhuhr, Asr, Isha) are shortened to two rakat. This is a strong Sunnah that the Prophet ﷺ consistently practiced.',
        ruling: 'recommended',
        reference: 'Quran 4:101',
      },
      {
        title: 'Appoint a leader for group travel',
        description: 'The Prophet ﷺ said: "When three people set out on a journey, let them appoint one of their number as their leader." This ensures organization and collective decision-making.',
        ruling: 'recommended',
        reference: 'Abu Dawud 2608',
      },
      {
        title: 'Make dua during travel',
        description: 'The supplication of a traveler is accepted. The Prophet ﷺ said there are three duas that are not rejected, and one of them is the dua of a traveler until they return.',
        ruling: 'recommended',
        reference: 'Tirmidhi 3448',
      },
      {
        title: 'Say the dua upon returning home',
        description: 'When returning from a journey, the Prophet ﷺ would say: "Aayiboona, taa\'iboona, \'aabidoona, li Rabbinaa haamidoon" (We are returning, repenting, worshipping, and praising our Lord).',
        ruling: 'recommended',
        reference: 'Bukhari 1797',
      },
    ],
  },
];

const SunnahItemCard: React.FC<{ item: SunnahItem; accentColor: string }> = ({ item, accentColor }) => {
  const [expanded, setExpanded] = useState(false);
  const ruling = RULING_CONFIG[item.ruling];

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <Card style={styles.itemCard}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.85} style={styles.itemTouchable}>
        <View style={styles.itemHeader}>
          <View style={[styles.rulingBadge, { backgroundColor: ruling.bg }]}>
            <Ionicons name={ruling.icon} size={14} color={ruling.color} />
          </View>
          <View style={styles.itemContent}>
            {item.arabic && <Text style={styles.itemArabic}>{item.arabic}</Text>}
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={[styles.rulingLabel, { color: ruling.color }]}>{ruling.label}</Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.text.secondary}
          />
        </View>

        {expanded && (
          <View style={styles.itemExpanded}>
            <View style={styles.itemDivider} />
            <Text style={styles.itemDescription}>{item.description}</Text>
            {item.reference && (
              <View style={styles.referenceRow}>
                <Ionicons name="bookmark-outline" size={14} color={accentColor} />
                <Text style={[styles.referenceText, { color: accentColor }]}>{item.reference}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Card>
  );
};

export const SunnahScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);

  const category = CATEGORIES.find(c => c.id === activeCategory)!;

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Header
          title="Sunnah"
          leftAction={{ iconName: 'arrow-back', onPress: () => navigation.goBack() }}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
        style={styles.tabBarScroll}
      >
        {CATEGORIES.map(cat => {
          const isActive = cat.id === activeCategory;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.tab, isActive && { backgroundColor: cat.color }]}
              onPress={() => setActiveCategory(cat.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={cat.icon}
                size={16}
                color={isActive ? colors.text.white : colors.text.secondary}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={[styles.introCard, { borderLeftColor: category.color }]}>
          <View style={styles.introHeader}>
            <Ionicons name={category.icon} size={20} color={category.color} />
            <Text style={[styles.introTitle, { color: category.color }]}>
              Sunnahs of {category.label}
            </Text>
          </View>
          <Text style={styles.introDescription}>{category.intro}</Text>
        </Card>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: RULING_CONFIG.fardh.color }]} />
            <Text style={styles.legendText}>Fardh (Obligatory)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: RULING_CONFIG.recommended.color }]} />
            <Text style={styles.legendText}>Sunnah (Recommended)</Text>
          </View>
        </View>

        {category.items.map((item, i) => (
          <SunnahItemCard key={i} item={item} accentColor={category.color} />
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
  tabBarScroll: {
    flexGrow: 0,
  },
  tabBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    gap: 6,
  },
  tabText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.text.white,
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  introCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderLeftWidth: 3,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  legendRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  itemCard: {
    marginBottom: spacing.sm,
    padding: 0,
    overflow: 'hidden',
  },
  itemTouchable: {
    padding: spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rulingBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  itemArabic: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  itemTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  rulingLabel: {
    ...typography.caption,
    fontWeight: '500',
  },
  itemExpanded: {
    marginTop: spacing.md,
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  itemDescription: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 4,
  },
  referenceText: {
    ...typography.caption,
    fontWeight: '600',
  },
});
