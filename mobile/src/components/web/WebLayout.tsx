/**
 * Web-specific layout with sidebar navigation and enhanced styling
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { webShadows, glass, transitions, gradients } from '@/theme/web';
import { useWebHover } from '@/hooks/useWebHover';

interface NavItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  active?: boolean;
}

interface WebLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  navItems?: NavItem[];
  rightAction?: {
    label: string;
    icon?: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
  showSidebar?: boolean;
}

const NavButton: React.FC<NavItem> = ({ label, icon, onPress, active }) => {
  const hover = useWebHover({
    hoverStyle: {
      backgroundColor: active ? undefined : 'rgba(27, 67, 50, 0.08)',
      transform: 'translateX(4px)',
    },
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      // @ts-ignore - web event handlers
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[
        styles.navButton,
        active && styles.navButtonActive,
        Platform.OS === 'web' && hover.style,
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? colors.text.white : colors.primary}
      />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export const WebLayout: React.FC<WebLayoutProps> = ({
  children,
  title,
  subtitle,
  navItems = [],
  rightAction,
  showSidebar = true,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const showDesktopSidebar = isDesktop && showSidebar && navItems.length > 0;

  // On mobile/tablet, use standard layout
  if (Platform.OS !== 'web' || !isDesktop) {
    return <View style={styles.container}>{children}</View>;
  }

  return (
    <View style={styles.webContainer}>
      {/* Sidebar */}
      {showDesktopSidebar && (
        <View style={styles.sidebar}>
          <LinearGradient
            colors={[colors.gradient.start, colors.gradient.middle]}
            style={styles.sidebarGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {/* Logo */}
            <View style={styles.sidebarHeader}>
              <View style={styles.logoIcon}>
                <Ionicons name="moon" size={24} color={colors.accent} />
              </View>
              <Text style={styles.logoText}>Deen Learning</Text>
            </View>

            {/* Navigation */}
            <View style={styles.navContainer}>
              {navItems.map((item) => (
                <NavButton key={item.id} {...item} />
              ))}
            </View>

            {/* Footer */}
            <View style={styles.sidebarFooter}>
              <Text style={styles.sidebarFooterText}>
                Learn. Grow. Succeed.
              </Text>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Main Content */}
      <View style={[styles.mainContent, !showDesktopSidebar && styles.mainContentFull]}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Text style={styles.pageTitle}>{title}</Text>
            {subtitle && <Text style={styles.pageSubtitle}>{subtitle}</Text>}
          </View>
          {rightAction && (
            <TouchableOpacity
              onPress={rightAction.onPress}
              style={styles.topBarAction}
              activeOpacity={0.8}
            >
              {rightAction.icon && (
                <Ionicons
                  name={rightAction.icon}
                  size={18}
                  color={colors.primary}
                  style={styles.topBarActionIcon}
                />
              )}
              <Text style={styles.topBarActionText}>{rightAction.label}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content Area */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
  },

  // Sidebar
  sidebar: {
    width: 260,
    // @ts-ignore
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
  },
  sidebarGradient: {
    flex: 1,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.sm,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.white,
    letterSpacing: -0.5,
  },
  navContainer: {
    flex: 1,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    // @ts-ignore
    transition: transitions.fast,
  },
  navButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  navLabel: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: spacing.md,
    fontWeight: '500',
  },
  navLabelActive: {
    color: colors.text.white,
    fontWeight: '600',
  },
  sidebarFooter: {
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  sidebarFooterText: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },

  // Main Content
  mainContent: {
    flex: 1,
    marginLeft: 260,
    backgroundColor: colors.backgroundAlt,
  },
  mainContentFull: {
    marginLeft: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    // @ts-ignore
    boxShadow: webShadows.subtle,
  },
  topBarLeft: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: 2,
  },
  topBarAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.round,
    // @ts-ignore
    transition: transitions.fast,
  },
  topBarActionIcon: {
    marginRight: spacing.xs,
  },
  topBarActionText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl * 2,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
});
