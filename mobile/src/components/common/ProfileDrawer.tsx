import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@/theme';
import type { User } from '@/types/user';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.82;

type MenuItem = {
  icon: IoniconName;
  label: string;
  subtitle?: string;
  onPress: () => void;
  color?: string;
  bold?: boolean;
};

interface ProfileDrawerProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  onSignOut: () => void;
  onNavigate: (screen: string) => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  visible,
  onClose,
  user,
  onSignOut,
  onNavigate,
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  useEffect(() => {
    if (visible && !isOpen.current) {
      isOpen.current = true;
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!visible && isOpen.current) {
      isOpen.current = false;
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, overlayAnim]);

  const displayName = user?.displayName || 'Muslim User';
  const email = user?.email || '';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('');

  const menuItems: MenuItem[] = [
    {
      icon: 'person-outline',
      label: 'My Profile',
      subtitle: 'View and edit your info',
      onPress: () => onNavigate('Profile'),
    },
    {
      icon: 'trophy-outline',
      label: 'High Scores',
      subtitle: 'Your game achievements',
      onPress: () => {},
    },
    {
      icon: 'stats-chart-outline',
      label: 'Learning Progress',
      subtitle: 'Track your journey',
      onPress: () => {},
    },
    {
      icon: 'bookmark-outline',
      label: 'Bookmarks',
      subtitle: 'Saved verses & duas',
      onPress: () => onNavigate('Bookmarks'),
    },
    {
      icon: 'notifications-outline',
      label: 'Reminders',
      subtitle: 'Prayer & dhikr notifications',
      onPress: () => {},
    },
    {
      icon: 'settings-outline',
      label: 'Settings',
      subtitle: 'App preferences',
      onPress: () => {},
    },
  ];

  const pointerEvents = visible ? 'auto' as const : 'none' as const;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={pointerEvents}>
      <Animated.View
        style={[styles.overlay, { opacity: overlayAnim }]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          { width: DRAWER_WIDTH, transform: [{ translateX: slideAnim }], paddingTop: insets.top },
        ]}
      >
        <View style={styles.profileSection}>
          <View style={styles.profileRow}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          {email ? <Text style={styles.profileEmail}>{email}</Text> : null}
        </View>

        <View style={styles.divider} />

        <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.menuItem}
              onPress={() => { onClose(); item.onPress(); }}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                {item.subtitle && <Text style={styles.menuSub}>{item.subtitle}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.bottomSection}>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={() => { onClose(); onSignOut(); }}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>Deen App v1.0</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  profileSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  closeBtn: {
    padding: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  profileEmail: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  menuScroll: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: `${colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  menuSub: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 1,
  },
  bottomSection: {
    paddingBottom: spacing.xl,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
    marginLeft: spacing.sm,
  },
  versionText: {
    ...typography.caption,
    color: colors.text.disabled,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
