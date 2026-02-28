import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity, Dimensions, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ProfileDrawer } from '@/components/common/ProfileDrawer';
import type { TabParamList } from '@/navigation/TabNavigator';
import { WebHomeScreen } from './WebHomeScreen';
import { FeatureKey } from '@/types/user';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = spacing.md;
const GRID_PADDING = spacing.lg;
const CARD_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

type GridCard = {
  key: FeatureKey;
  title: string;
  subtitle: string;
  icon: IoniconName;
  gradientColors: [string, string];
  screen: string;
};

const GridCardItem: React.FC<{ card: GridCard & { onPress: () => void }; size: number }> = ({ card, size }) => (
  <TouchableOpacity onPress={card.onPress} activeOpacity={0.85} style={{ width: size }}>
    <LinearGradient
      colors={card.gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gridCard, { width: size, height: size }]}
    >
      <View style={styles.gridCardIconWrap}>
        <Ionicons name={card.icon} size={30} color="rgba(255,255,255,0.95)" />
      </View>
      <Text style={styles.gridCardTitle}>{card.title}</Text>
      <Text style={styles.gridCardSubtitle} numberOfLines={2}>{card.subtitle}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

// All available feature cards with their keys
const ALL_CARDS: GridCard[] = [
  {
    key: 'quran',
    title: 'Quran',
    subtitle: 'Browse chapters & read verses',
    icon: 'book-outline',
    gradientColors: [colors.primary, colors.secondaryDark],
    screen: 'QuranChapters',
  },
  {
    key: 'prayer',
    title: 'Prayer Guide',
    subtitle: 'Step-by-step daily prayers',
    icon: 'hand-left-outline',
    gradientColors: ['#2D6A4F', '#52B788'],
    screen: 'PrayerGuide',
  },
  {
    key: 'pillars',
    title: 'Pillars of Islam',
    subtitle: '5 Pillars of Islam & 6 of Iman',
    icon: 'compass-outline',
    gradientColors: ['#40916C', '#74C69D'],
    screen: 'Pillars',
  },
  {
    key: 'names',
    title: '99 Names',
    subtitle: 'Learn the names of Allah',
    icon: 'star-outline',
    gradientColors: [colors.accentDark, colors.islamic.gold],
    screen: 'AsmaUlHusnaMenu',
  },
  {
    key: 'dua',
    title: 'Dua & Dhikr',
    subtitle: 'Daily supplications',
    icon: 'heart-outline',
    gradientColors: ['#667eea', '#764ba2'],
    screen: 'Dua',
  },
  {
    key: 'sunnah',
    title: 'Sunnah',
    subtitle: 'Prophetic practices for daily life',
    icon: 'sunny-outline',
    gradientColors: ['#5D4037', '#8D6E63'],
    screen: 'Sunnah',
  },
];

export const HomeScreen: React.FC = () => {
  if (Platform.OS === 'web') {
    return <WebHomeScreen />;
  }

  const navigation = useNavigation<BottomTabNavigationProp<TabParamList, 'Home'>>();
  const { user, signOut } = useAuth();
  const { userProfile, loading: profileLoading } = useUserProfile();
  const insets = useSafeAreaInsets();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to sign out');
    }
  };

  const nav = (screen: string) => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) parentNavigation.navigate(screen as never);
  };

  // Filter cards based on user's focusFeatures preferences
  // If no preferences set (legacy users or no profile), show all cards
  const displayCards = useMemo(() => {
    if (!userProfile?.focusFeatures || userProfile.focusFeatures.length === 0) {
      // No preferences set - show all cards
      return ALL_CARDS;
    }

    // Filter to only show selected features, maintaining the original order
    return ALL_CARDS.filter(card => userProfile.focusFeatures.includes(card.key));
  }, [userProfile?.focusFeatures]);

  const displayName = user?.displayName || 'Muslim User';

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={() => setDrawerVisible(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.headerAvatarRing}>
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.headerAvatar} />
              ) : (
                <View style={styles.headerAvatarPlaceholder}>
                  <Ionicons name="person" size={18} color={colors.text.tertiary} />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Home</Text>
          <View style={styles.headerRight} />
        </View>
      </View>

      <LinearGradient
        colors={['#E8F5E9', '#F1F8E9', colors.background]}
        locations={[0, 0.5, 1]}
        style={styles.bgGradient}
      >
        {profileLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.greeting}>Assalamu Alaikum{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}</Text>
            <Text style={styles.greetingSub}>
              {displayCards.length < ALL_CARDS.length
                ? 'Your personalized learning journey'
                : 'Choose a section to begin learning'}
            </Text>

            <View style={styles.grid}>
              {displayCards.map((card) => (
                <GridCardItem
                  key={card.key}
                  card={{ ...card, onPress: () => nav(card.screen) }}
                  size={CARD_SIZE}
                />
              ))}
            </View>

            {displayCards.length < ALL_CARDS.length && (
              <TouchableOpacity
                style={styles.showAllButton}
                onPress={() => nav('Profile')}
                activeOpacity={0.7}
              >
                <Ionicons name="apps-outline" size={18} color={colors.primary} />
                <Text style={styles.showAllText}>Manage your features in Profile</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </LinearGradient>

      <ProfileDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        user={user}
        onSignOut={handleSignOut}
        onNavigate={nav}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    backgroundColor: '#E8F5E9',
    paddingTop: 0,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerAvatarRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 42,
  },
  bgGradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: GRID_PADDING,
    paddingBottom: spacing.xxl,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  greetingSub: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    marginBottom: spacing.lg,
  },
  gridCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  gridCardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  gridCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.white,
    marginBottom: 3,
  },
  gridCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 16,
  },
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  showAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});
