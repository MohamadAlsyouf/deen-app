/**
 * WebNamesContent - 99 Names of Allah hub with browse, games menu, and game sub-screens
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useQuery } from '@tanstack/react-query';
import { colors } from '@/theme';
import { useWebHover } from '@/hooks/useWebHover';
import { asmaUlHusnaService } from '@/services/asmaUlHusnaService';
import type { AsmaUlHusnaName } from '@/types/asmaUlHusna';
import { WebNamesFlashcards } from './WebNamesFlashcards';
import { WebNamesMultipleChoice } from './WebNamesMultipleChoice';
import { WebNamesMatching } from './WebNamesMatching';

const AUDIO_BASE_URL = 'https://islamicapi.com';

// ─── Inject game-related keyframes ──────────────────────────────────────────
const injectNamesStyles = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById('deen-names-styles')) return;
  const style = document.createElement('style');
  style.id = 'deen-names-styles';
  style.textContent = `
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInScale {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes score-pop {
      0% { transform: scale(0.3); opacity: 0; }
      60% { transform: scale(1.1); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes stat-slide-up {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      50% { transform: translateX(4px); }
      75% { transform: translateX(-4px); }
    }
    @keyframes confetti-fall {
      0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
      5% { opacity: 1; }
      70% { opacity: 0.8; }
      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }
    @keyframes confetti-drift {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(30px); }
      75% { transform: translateX(-30px); }
    }
    @keyframes counter-pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.08); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
};

// ─── Menu Card Component ────────────────────────────────────────────────────
type MenuCardProps = {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accentColor: string;
  accentBg: string;
  onPress: () => void;
  index: number;
};

const MenuCard: React.FC<MenuCardProps> = ({
  title, subtitle, icon, accentColor, accentBg, onPress, index,
}) => {
  const hover = useWebHover({
    hoverStyle: {
      transform: 'translateY(-6px) scale(1.01)',
      boxShadow: '0 20px 48px rgba(0, 0, 0, 0.12)',
    },
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.95}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[
        menuStyles.card,
        hover.style,
        {
          // @ts-ignore
          animation: `fadeInUp 0.5s ease-out ${index * 0.15}s forwards`,
          opacity: 0,
        },
      ]}
    >
      <View style={[menuStyles.iconCircle, { backgroundColor: accentBg }]}>
        <Ionicons name={icon} size={32} color={accentColor} />
      </View>
      <Text style={menuStyles.cardTitle}>{title}</Text>
      <Text style={menuStyles.cardSubtitle}>{subtitle}</Text>
      <View style={[menuStyles.arrowCircle, { backgroundColor: accentBg }]}>
        <Ionicons name="arrow-forward" size={18} color={accentColor} />
      </View>
    </TouchableOpacity>
  );
};

// ─── Game Mode Card Component ───────────────────────────────────────────────
type GameCardProps = {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  bgColor: string;
  onPress: () => void;
  index: number;
};

const GameCard: React.FC<GameCardProps> = ({
  title, subtitle, icon, color, bgColor, onPress, index,
}) => {
  const hover = useWebHover({
    hoverStyle: {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.1)',
    },
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.95}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[
        gamesStyles.card,
        hover.style,
        {
          // @ts-ignore
          animation: `fadeInUp 0.4s ease-out ${index * 0.12}s forwards`,
          opacity: 0,
        },
      ]}
    >
      <View style={[gamesStyles.iconBox, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <View style={gamesStyles.cardText}>
        <Text style={gamesStyles.cardTitle}>{title}</Text>
        <Text style={gamesStyles.cardSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
    </TouchableOpacity>
  );
};

// ─── Browse Name Card ───────────────────────────────────────────────────────
const NameCard: React.FC<{
  name: AsmaUlHusnaName;
  index: number;
}> = ({ name, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const audioUrl = name.audio ? `${AUDIO_BASE_URL}${name.audio}` : null;

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  const handlePlayAudio = useCallback(async (e: any) => {
    e.stopPropagation();
    if (!audioUrl) return;

    try {
      if (isPlaying && soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsPlaying(false);
        return;
      }

      setIsLoadingAudio(true);
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setIsPlaying(true);
      setIsLoadingAudio(false);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch {
      setIsPlaying(false);
      setIsLoadingAudio(false);
    }
  }, [audioUrl, isPlaying]);

  const hover = useWebHover({
    hoverStyle: {
      transform: 'translateY(-4px) scale(1.01)',
      boxShadow: '0 16px 40px rgba(27, 67, 50, 0.15)',
    },
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  const audioHover = useWebHover({
    hoverStyle: {
      transform: 'scale(1.1)',
      backgroundColor: expanded ? 'rgba(255,255,255,0.25)' : `${colors.primary}25`,
    },
    transition: 'all 0.2s ease-out',
  });

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.95}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[
        browseStyles.nameCard,
        hover.style,
        {
          // @ts-ignore
          animation: `fadeInUp 0.4s ease-out ${0.02 * Math.min(index, 20)}s forwards`,
          opacity: 0,
        },
      ]}
    >
      <LinearGradient
        colors={expanded ? [colors.primary, colors.primaryLight] : ['transparent', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={browseStyles.nameHeader}>
        <View style={[browseStyles.nameNumber, expanded && browseStyles.nameNumberExpanded]}>
          <Text style={[browseStyles.nameNumberText, expanded && browseStyles.nameNumberTextExpanded]}>
            {name.number}
          </Text>
        </View>
        <View style={browseStyles.nameTitleWrap}>
          <Text style={[browseStyles.nameArabic, expanded && browseStyles.nameArabicExpanded]}>
            {name.name}
          </Text>
          <Text style={[browseStyles.nameEnglish, expanded && browseStyles.nameEnglishExpanded]}>
            {name.transliteration}
          </Text>
          <Text style={[browseStyles.nameMeaning, expanded && browseStyles.nameMeaningExpanded]}>
            {name.meaning}
          </Text>
        </View>

        {audioUrl && (
          <TouchableOpacity
            onPress={handlePlayAudio}
            activeOpacity={0.7}
            // @ts-ignore
            onMouseEnter={audioHover.handlers.onMouseEnter}
            onMouseLeave={audioHover.handlers.onMouseLeave}
            style={[
              browseStyles.audioButton,
              expanded && browseStyles.audioButtonExpanded,
              audioHover.style,
            ]}
          >
            {isLoadingAudio ? (
              <ActivityIndicator size="small" color={expanded ? colors.text.white : colors.primary} />
            ) : (
              <Ionicons
                name={isPlaying ? 'stop-circle' : 'volume-high'}
                size={22}
                color={expanded ? colors.text.white : colors.primary}
              />
            )}
          </TouchableOpacity>
        )}
      </View>

      {expanded && (name.translation || name.meaning) && (
        <View style={browseStyles.nameExpanded}>
          <View style={browseStyles.nameDivider} />
          {name.translation && (
            <Text style={browseStyles.nameTranslation}>{name.translation}</Text>
          )}
          {name.meaning && name.meaning !== name.translation && (
            <Text style={browseStyles.nameExplanation}>{name.meaning}</Text>
          )}
        </View>
      )}

      <View style={browseStyles.nameExpandHint}>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={expanded ? 'rgba(255,255,255,0.6)' : colors.text.tertiary}
        />
      </View>
    </TouchableOpacity>
  );
};

// ─── Menu View ──────────────────────────────────────────────────────────────
const MenuView: React.FC<{
  onNavigate: (screen: string) => void;
}> = ({ onNavigate }) => {
  return (
    <ScrollView
      style={menuStyles.scrollView}
      contentContainerStyle={menuStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={menuStyles.header}>
        <View style={menuStyles.headerIcon}>
          <Ionicons name="heart" size={36} color={colors.accent} />
        </View>
        <Text style={menuStyles.title}>Asma ul Husna</Text>
        <Text style={menuStyles.arabicTitle}>أَسْمَاءُ اللَّهِ الْحُسْنَى</Text>
        <Text style={menuStyles.subtitle}>
          Explore the beautiful names of Allah — listen to their pronunciation or challenge yourself with interactive games.
        </Text>
      </View>

      <View style={menuStyles.cardsRow}>
        <MenuCard
          title="Browse & Listen"
          subtitle="View all 99 names with meanings, transliterations, and audio pronunciations"
          icon="headset-outline"
          accentColor={colors.primary}
          accentBg="#E8F5E9"
          onPress={() => onNavigate('browse')}
          index={0}
        />
        <MenuCard
          title="Memorization Games"
          subtitle="Test your knowledge with flashcards, matching, multiple choice, and more"
          icon="game-controller-outline"
          accentColor={colors.accent}
          accentBg="#FFF8E1"
          onPress={() => onNavigate('games')}
          index={1}
        />
      </View>
    </ScrollView>
  );
};

// ─── Games Menu View ────────────────────────────────────────────────────────
const GamesMenuView: React.FC<{
  onNavigate: (screen: string) => void;
  onBack: () => void;
}> = ({ onNavigate, onBack }) => {
  const backHover = useWebHover({
    hoverStyle: { backgroundColor: `${colors.primary}15` },
    transition: 'all 0.2s ease-out',
  });

  return (
    <ScrollView
      style={gamesStyles.scrollView}
      contentContainerStyle={gamesStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={gamesStyles.header}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          // @ts-ignore
          onMouseEnter={backHover.handlers.onMouseEnter}
          onMouseLeave={backHover.handlers.onMouseLeave}
          style={[gamesStyles.backButton, backHover.style]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={gamesStyles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={gamesStyles.intro}>
        <View style={gamesStyles.introBadge}>
          <Ionicons name="trophy-outline" size={20} color={colors.accent} />
          <Text style={gamesStyles.introBadgeText}>Challenge Yourself</Text>
        </View>
        <Text style={gamesStyles.introTitle}>Memorization Games</Text>
        <Text style={gamesStyles.introText}>
          Choose a game mode to test and strengthen your knowledge of the 99 Names of Allah.
        </Text>
      </View>

      <View style={gamesStyles.cardsList}>
        <GameCard
          title="Flashcards"
          subtitle="Flip through cards to learn and review names one by one"
          icon="albums-outline"
          color={colors.primary}
          bgColor="#E8F5E9"
          onPress={() => onNavigate('flashcards')}
          index={0}
        />
        <GameCard
          title="Multiple Choice"
          subtitle="Pick the correct answer from four options to test recall"
          icon="list-outline"
          color={colors.info}
          bgColor="#E1F5FE"
          onPress={() => onNavigate('multiple-choice')}
          index={1}
        />
        <GameCard
          title="Matching"
          subtitle="Match Arabic names to their English meanings against the clock"
          icon="git-compare-outline"
          color={colors.accent}
          bgColor="#FFF8E1"
          onPress={() => onNavigate('matching')}
          index={2}
        />
      </View>

      <View style={gamesStyles.tip}>
        <Ionicons name="bulb-outline" size={20} color={colors.accent} />
        <Text style={gamesStyles.tipText}>
          Tip: Start with flashcards to familiarize yourself, then test your knowledge with multiple choice and matching.
        </Text>
      </View>
    </ScrollView>
  );
};

// ─── Browse View ────────────────────────────────────────────────────────────
const BrowseView: React.FC<{
  onBack: () => void;
}> = ({ onBack }) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 700;
  const isMedium = width >= 700 && width < 1100;
  const isWide = width >= 1100;

  const dataQuery = useQuery({
    queryKey: ['asmaUlHusna'],
    queryFn: () => asmaUlHusnaService.getData(),
  });

  const backHover = useWebHover({
    hoverStyle: { backgroundColor: `${colors.primary}15` },
    transition: 'all 0.2s ease-out',
  });

  return (
    <ScrollView
      style={browseStyles.scrollView}
      contentContainerStyle={browseStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Back + Header */}
      <View style={browseStyles.topBar}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          // @ts-ignore
          onMouseEnter={backHover.handlers.onMouseEnter}
          onMouseLeave={backHover.handlers.onMouseLeave}
          style={[browseStyles.backButton, backHover.style]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={browseStyles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={browseStyles.pageHeader}>
        <View style={browseStyles.pageHeaderIcon}>
          <Ionicons name="heart" size={32} color={colors.accent} />
        </View>
        <Text style={browseStyles.pageTitle}>Asma ul Husna</Text>
        <Text style={browseStyles.pageArabicTitle}>أَسْمَاءُ اللَّهِ الْحُسْنَى</Text>
        <Text style={browseStyles.pageSubtitle}>
          The 99 Beautiful Names of Allah - learn, memorize, and reflect on the divine attributes
        </Text>
      </View>

      {dataQuery.isLoading ? (
        <View style={browseStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={browseStyles.loadingText}>Loading the beautiful names...</Text>
        </View>
      ) : dataQuery.isError ? (
        <View style={browseStyles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={browseStyles.errorTitle}>Failed to load names</Text>
        </View>
      ) : dataQuery.data ? (
        <>
          {(dataQuery.data.recitation_benefits || dataQuery.data.hadith) && (
            <View style={browseStyles.infoCardsContainer}>
              {dataQuery.data.recitation_benefits && (
                <View style={browseStyles.infoCard}>
                  <View style={browseStyles.infoCardHeader}>
                    <Ionicons name="sparkles" size={20} color={colors.accent} />
                    <Text style={browseStyles.infoCardTitle}>Benefits of Recitation</Text>
                  </View>
                  <Text style={browseStyles.infoCardText}>
                    {dataQuery.data.recitation_benefits}
                  </Text>
                </View>
              )}
              {dataQuery.data.hadith && (
                <View style={browseStyles.infoCard}>
                  <View style={browseStyles.infoCardHeader}>
                    <Ionicons name="book" size={20} color={colors.primary} />
                    <Text style={browseStyles.infoCardTitle}>Hadith</Text>
                  </View>
                  <Text style={browseStyles.infoCardText}>
                    {dataQuery.data.hadith}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={[
            browseStyles.namesGrid,
            isCompact && browseStyles.namesGridCompact,
            isMedium && browseStyles.namesGridMedium,
            isWide && browseStyles.namesGridWide,
          ]}>
            {dataQuery.data.names?.map((name, index) => (
              <NameCard key={name.number} name={name} index={index} />
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
};

// ─── Main Content Orchestrator ──────────────────────────────────────────────
type WebNamesContentProps = {
  subScreen: string | null;
  onSubNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
};

export const WebNamesContent: React.FC<WebNamesContentProps> = ({
  subScreen,
  onSubNavigate,
  onBack,
}) => {
  useEffect(() => {
    injectNamesStyles();
  }, []);

  const handleNavigate = useCallback((screen: string) => {
    onSubNavigate(screen);
  }, [onSubNavigate]);

  const handleBackToMenu = useCallback(() => {
    onBack();
  }, [onBack]);

  const handleBackToGames = useCallback(() => {
    onSubNavigate('games');
  }, [onSubNavigate]);

  switch (subScreen) {
    case 'browse':
      return <BrowseView onBack={handleBackToMenu} />;
    case 'games':
      return <GamesMenuView onNavigate={handleNavigate} onBack={handleBackToMenu} />;
    case 'flashcards':
      return <WebNamesFlashcards onBack={handleBackToGames} />;
    case 'multiple-choice':
      return <WebNamesMultipleChoice onBack={handleBackToGames} />;
    case 'matching':
      return <WebNamesMatching onBack={handleBackToGames} />;
    default:
      return <MenuView onNavigate={handleNavigate} />;
  }
};

// ─── Menu Styles ────────────────────────────────────────────────────────────
const menuStyles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 40,
    paddingBottom: 80,
    // @ts-ignore
    maxWidth: 900,
    marginHorizontal: 'auto',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  headerIcon: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: `${colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    // @ts-ignore
    animation: 'fadeInScale 0.5s ease-out forwards',
  },
  title: {
    fontSize: 40,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  arabicTitle: {
    fontSize: 36,
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 520,
    lineHeight: 28,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  cardsRow: {
    // @ts-ignore
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 24,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 32,
    position: 'relative',
    // @ts-ignore
    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.06)',
    cursor: 'pointer',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 24,
    marginBottom: 20,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Games Menu Styles ──────────────────────────────────────────────────────
const gamesStyles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 32,
    paddingBottom: 80,
    // @ts-ignore
    maxWidth: 700,
    marginHorizontal: 'auto',
    width: '100%',
  },
  header: {
    marginBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
    // @ts-ignore
    cursor: 'pointer',
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  intro: {
    alignItems: 'center',
    marginBottom: 32,
  },
  introBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    marginBottom: 16,
    gap: 8,
  },
  introBadgeText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '600',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  introTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 10,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  introText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 480,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  cardsList: {
    gap: 14,
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    // @ts-ignore
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
    cursor: 'pointer',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardText: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 20,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#F0E6C8',
  },
  tipText: {
    fontSize: 13,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 22,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
});

// ─── Browse Styles ──────────────────────────────────────────────────────────
const browseStyles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 32,
    paddingBottom: 80,
    // @ts-ignore
    maxWidth: 1400,
    marginHorizontal: 'auto',
    width: '100%',
  },
  topBar: {
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
    // @ts-ignore
    cursor: 'pointer',
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  pageHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  pageHeaderIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  pageArabicTitle: {
    fontSize: 32,
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  pageSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 500,
    lineHeight: 26,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  infoCardsContainer: {
    gap: 20,
    marginBottom: 40,
    // @ts-ignore
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  },
  infoCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    // @ts-ignore
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  infoCardText: {
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 26,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  namesGrid: {
    gap: 20,
    // @ts-ignore
    display: 'grid',
    gridTemplateColumns: '1fr',
  },
  namesGridCompact: {
    // @ts-ignore
    gridTemplateColumns: '1fr',
  },
  namesGridMedium: {
    // @ts-ignore
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
  namesGridWide: {
    // @ts-ignore
    gridTemplateColumns: 'repeat(3, 1fr)',
  },
  nameCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    // @ts-ignore
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
    cursor: 'pointer',
    width: '100%',
  },
  nameHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nameNumber: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  nameNumberExpanded: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  nameNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  nameNumberTextExpanded: {
    color: colors.text.white,
  },
  nameTitleWrap: {
    flex: 1,
  },
  nameArabic: {
    fontSize: 28,
    color: colors.text.primary,
    marginBottom: 4,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  nameArabicExpanded: {
    color: colors.accent,
  },
  nameEnglish: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  nameEnglishExpanded: {
    color: colors.text.white,
  },
  nameMeaning: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  nameMeaningExpanded: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  nameExpanded: {
    marginTop: 16,
  },
  nameDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
  },
  nameTranslation: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.white,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  nameExplanation: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  audioButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    // @ts-ignore
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
  },
  audioButtonExpanded: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  nameExpandHint: {
    position: 'absolute',
    bottom: 8,
    right: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  loadingText: {
    fontSize: 15,
    color: colors.text.secondary,
    marginTop: 16,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.error,
    marginTop: 16,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
});
