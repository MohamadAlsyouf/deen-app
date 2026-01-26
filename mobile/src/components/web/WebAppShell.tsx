/**
 * WebAppShell - Persistent sidebar shell for the entire web app
 * Manages navigation state and renders themed content areas
 * Uses URL hash-based routing for persistence on reload
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import { useWebHover } from '@/hooks/useWebHover';
import { useAuth } from '@/hooks/useAuth';

// Content components
import { WebDashboardContent } from './content/WebDashboardContent';
import { WebQuranContent } from './content/WebQuranContent';
import { WebPillarsContent } from './content/WebPillarsContent';
import { WebNamesContent } from './content/WebNamesContent';
import { WebAboutContent } from './content/WebAboutContent';
import { WebContactContent } from './content/WebContactContent';

// URL Routing helpers
const parseHashRoute = (): { tab: string; subScreen: string | null; subScreenData: any } => {
  if (typeof window === 'undefined') {
    return { tab: 'home', subScreen: null, subScreenData: null };
  }

  const hash = window.location.hash.slice(1) || '/'; // Remove #
  const parts = hash.split('/').filter(Boolean);

  if (parts.length === 0) {
    return { tab: 'home', subScreen: null, subScreenData: null };
  }

  const tab = parts[0] || 'home';

  // Handle Quran chapter sub-routes: #/quran/chapter/1/Al-Fatihah/الفاتحة
  if (tab === 'quran' && parts[1] === 'chapter' && parts[2]) {
    const chapterId = parseInt(parts[2], 10);
    const chapterName = parts[3] ? decodeURIComponent(parts[3]) : '';
    const chapterArabicName = parts[4] ? decodeURIComponent(parts[4]) : '';
    return {
      tab: 'quran',
      subScreen: 'chapter',
      subScreenData: { chapterId, chapterName, chapterArabicName },
    };
  }

  return { tab, subScreen: null, subScreenData: null };
};

const buildHashRoute = (tab: string, subScreen: string | null, subScreenData: any): string => {
  if (tab === 'quran' && subScreen === 'chapter' && subScreenData) {
    const { chapterId, chapterName, chapterArabicName } = subScreenData;
    return `#/quran/chapter/${chapterId}/${encodeURIComponent(chapterName || '')}/${encodeURIComponent(chapterArabicName || '')}`;
  }
  return `#/${tab}`;
};

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  activeIcon: React.ComponentProps<typeof Ionicons>['name'];
};

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Dashboard', icon: 'grid-outline', activeIcon: 'grid' },
  { id: 'quran', label: 'Quran', icon: 'book-outline', activeIcon: 'book' },
  { id: 'pillars', label: 'Pillars', icon: 'compass-outline', activeIcon: 'compass' },
  { id: 'names', label: '99 Names', icon: 'heart-outline', activeIcon: 'heart' },
  { id: 'about', label: 'About', icon: 'information-circle-outline', activeIcon: 'information-circle' },
  { id: 'contact', label: 'Contact', icon: 'mail-outline', activeIcon: 'mail' },
];

// Inject web fonts and global styles
const injectWebStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('deen-web-shell-styles')) return;

  const style = document.createElement('style');
  style.id = 'deen-web-shell-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Amiri:wght@400;700&display=swap');

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);
};

const NavItemButton: React.FC<{
  item: NavItem;
  isActive: boolean;
  onPress: () => void;
  isCollapsed: boolean;
}> = ({ item, isActive, onPress, isCollapsed }) => {
  const hover = useWebHover({
    hoverStyle: {
      backgroundColor: isActive ? undefined : 'rgba(255, 255, 255, 0.08)',
      transform: 'translateX(4px)',
    },
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[
        styles.navItem,
        isActive && styles.navItemActive,
        !isActive && hover.style,
        isCollapsed && styles.navItemCollapsed,
      ]}
    >
      <View style={[styles.navIconWrap, isActive && styles.navIconWrapActive]}>
        <Ionicons
          name={isActive ? item.activeIcon : item.icon}
          size={20}
          color={isActive ? colors.accent : 'rgba(255, 255, 255, 0.7)'}
        />
      </View>
      {!isCollapsed && (
        <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
          {item.label}
        </Text>
      )}
      {isActive && !isCollapsed && (
        <View style={styles.activeIndicator} />
      )}
    </TouchableOpacity>
  );
};

type WebAppShellProps = {
  initialScreen?: string;
};

export const WebAppShell: React.FC<WebAppShellProps> = ({ initialScreen = 'home' }) => {
  const { width } = useWindowDimensions();
  const { signOut, user } = useAuth();
  
  // Initialize state from URL hash
  const initialRoute = useMemo(() => parseHashRoute(), []);
  const [activeTab, setActiveTab] = useState(initialRoute.tab || initialScreen);
  const [isCollapsed, setIsCollapsed] = useState(width < 1200);
  const [mounted, setMounted] = useState(false);
  const [subScreen, setSubScreen] = useState<string | null>(initialRoute.subScreen);
  const [subScreenData, setSubScreenData] = useState<any>(initialRoute.subScreenData);

  // Inject web styles and set up hash change listener
  useEffect(() => {
    injectWebStyles();
    requestAnimationFrame(() => setMounted(true));

    // Listen for browser back/forward navigation
    const handleHashChange = () => {
      const route = parseHashRoute();
      setActiveTab(route.tab);
      setSubScreen(route.subScreen);
      setSubScreenData(route.subScreenData);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', handleHashChange);
      
      // Set initial hash if none exists
      if (!window.location.hash || window.location.hash === '#') {
        window.history.replaceState(null, '', buildHashRoute(activeTab, subScreen, subScreenData));
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('hashchange', handleHashChange);
      }
    };
  }, []);

  useEffect(() => {
    setIsCollapsed(width < 1200);
  }, [width]);

  // Update URL when navigation changes
  const updateUrl = useCallback((tab: string, sub: string | null, data: any) => {
    if (typeof window !== 'undefined') {
      const newHash = buildHashRoute(tab, sub, data);
      if (window.location.hash !== newHash) {
        window.history.pushState(null, '', newHash);
      }
    }
  }, []);

  const handleNavigate = useCallback((id: string) => {
    setActiveTab(id);
    setSubScreen(null);
    setSubScreenData(null);
    updateUrl(id, null, null);
  }, [updateUrl]);

  const handleSubNavigate = useCallback((screen: string, data?: any) => {
    setSubScreen(screen);
    setSubScreenData(data);
    updateUrl(activeTab, screen, data);
  }, [activeTab, updateUrl]);

  const handleBack = useCallback(() => {
    setSubScreen(null);
    setSubScreenData(null);
    updateUrl(activeTab, null, null);
  }, [activeTab, updateUrl]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <WebDashboardContent
            onNavigate={handleNavigate}
            userName={user?.email?.split('@')[0]}
          />
        );
      case 'quran':
        return (
          <WebQuranContent
            subScreen={subScreen}
            subScreenData={subScreenData}
            onSubNavigate={handleSubNavigate}
            onBack={handleBack}
          />
        );
      case 'pillars':
        return <WebPillarsContent />;
      case 'names':
        return <WebNamesContent />;
      case 'about':
        return <WebAboutContent />;
      case 'contact':
        return <WebContactContent />;
      default:
        return (
          <WebDashboardContent
            onNavigate={handleNavigate}
            userName={user?.email?.split('@')[0]}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View
        style={[
          styles.sidebar,
          isCollapsed && styles.sidebarCollapsed,
          mounted && {
            // @ts-ignore
            animation: 'slideInLeft 0.5s ease-out forwards',
          },
        ]}
      >
        <LinearGradient
          colors={['#0D2818', '#1B4332', '#0D2818']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Logo */}
        <View style={[styles.logoSection, isCollapsed && styles.logoSectionCollapsed]}>
          <View style={styles.logoMark}>
            <Ionicons name="moon" size={24} color={colors.accent} />
          </View>
          {!isCollapsed && (
            <View style={styles.logoText}>
              <Text style={styles.logoTitle}>Deen</Text>
              <Text style={styles.logoSubtitle}>Learning</Text>
            </View>
          )}
        </View>

        {/* Navigation */}
        <ScrollView
          style={styles.navScrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.navContent}
        >
          <Text style={[styles.navSectionTitle, isCollapsed && styles.hidden]}>
            EXPLORE
          </Text>
          {NAV_ITEMS.slice(0, 4).map((item, index) => (
            <View
              key={item.id}
              style={mounted ? {
                // @ts-ignore
                animation: `fadeIn 0.4s ease-out ${0.1 + index * 0.05}s forwards`,
                opacity: 0,
              } : {}}
            >
              <NavItemButton
                item={item}
                isActive={activeTab === item.id}
                onPress={() => handleNavigate(item.id)}
                isCollapsed={isCollapsed}
              />
            </View>
          ))}

          <View style={styles.navDivider} />

          <Text style={[styles.navSectionTitle, isCollapsed && styles.hidden]}>
            MORE
          </Text>
          {NAV_ITEMS.slice(4).map((item, index) => (
            <View
              key={item.id}
              style={mounted ? {
                // @ts-ignore
                animation: `fadeIn 0.4s ease-out ${0.3 + index * 0.05}s forwards`,
                opacity: 0,
              } : {}}
            >
              <NavItemButton
                item={item}
                isActive={activeTab === item.id}
                onPress={() => handleNavigate(item.id)}
                isCollapsed={isCollapsed}
              />
            </View>
          ))}
        </ScrollView>

        {/* User Section */}
        <View style={[styles.userSection, isCollapsed && styles.userSectionCollapsed]}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={18} color={colors.primary} />
          </View>
          {!isCollapsed && (
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.email?.split('@')[0] || 'Welcome'}
              </Text>
              <TouchableOpacity onPress={handleSignOut} activeOpacity={0.7}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Collapse Toggle */}
        <TouchableOpacity
          style={styles.collapseButton}
          onPress={() => setIsCollapsed(!isCollapsed)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isCollapsed ? 'chevron-forward' : 'chevron-back'}
            size={16}
            color="rgba(255, 255, 255, 0.5)"
          />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Pattern Background */}
        <View style={styles.patternOverlay} />
        
        {/* Content Area */}
        <View
          style={[
            styles.contentArea,
            mounted && {
              // @ts-ignore
              animation: 'fadeIn 0.4s ease-out forwards',
            },
          ]}
        >
          {renderContent()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FAFBFA',
  },
  sidebar: {
    width: 260,
    backgroundColor: colors.primary,
    position: 'relative',
    // @ts-ignore
    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 100,
  },
  sidebarCollapsed: {
    width: 80,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoSectionCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 163, 115, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    marginLeft: 12,
  },
  logoTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.white,
    letterSpacing: -0.5,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  logoSubtitle: {
    fontSize: 13,
    color: colors.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: -2,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  navScrollView: {
    flex: 1,
  },
  navContent: {
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  navSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1.5,
    paddingHorizontal: 16,
    marginBottom: 12,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  hidden: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
    // @ts-ignore
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  navItemActive: {
    backgroundColor: 'rgba(212, 163, 115, 0.15)',
  },
  navIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    // @ts-ignore
    transition: 'all 0.2s ease-out',
  },
  navIconWrapActive: {
    backgroundColor: 'rgba(212, 163, 115, 0.2)',
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 12,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  navLabelActive: {
    color: colors.text.white,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  navDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 20,
    marginHorizontal: 16,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  userSectionCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.white,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  signOutText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
    // @ts-ignore
    cursor: 'pointer',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  collapseButton: {
    position: 'absolute',
    right: -12,
    top: '50%',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FAFBFA',
    // @ts-ignore
    cursor: 'pointer',
    zIndex: 10,
  },
  mainContent: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
    // @ts-ignore
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='none' stroke='%231B433208' stroke-width='1'/%3E%3Cpath d='M30 15L45 30L30 45L15 30z' fill='none' stroke='%231B433205' stroke-width='1'/%3E%3C/svg%3E")`,
    backgroundSize: '60px 60px',
    pointerEvents: 'none',
  },
  contentArea: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
});
