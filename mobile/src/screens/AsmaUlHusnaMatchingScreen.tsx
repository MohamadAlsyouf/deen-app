import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { asmaUlHusnaService } from '@/services/asmaUlHusnaService';
import type { AsmaUlHusnaName } from '@/types/asmaUlHusna';

const PAIRS_PER_ROUND = 8;

type TileType = 'arabic' | 'english';
type Tile = {
  id: string;
  nameNumber: number;
  type: TileType;
  display: string;
};

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildTiles(names: AsmaUlHusnaName[]): { arabic: Tile[]; english: Tile[] } {
  const selected = shuffleArray(names).slice(0, PAIRS_PER_ROUND);
  const arabic: Tile[] = selected.map((name) => ({
    id: `ar-${name.number}`,
    nameNumber: name.number,
    type: 'arabic' as TileType,
    display: name.name,
  }));
  const english: Tile[] = selected.map((name) => ({
    id: `en-${name.number}`,
    nameNumber: name.number,
    type: 'english' as TileType,
    display: name.translation,
  }));
  return { arabic: shuffleArray(arabic), english: shuffleArray(english) };
}

// --- Results helpers ---

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  colors.islamic.gold, colors.accentLight, '#FFD700', colors.secondary,
  colors.secondaryLight, '#FF8C42', '#87CEEB', '#DDA0DD',
];

type ParticleConfig = {
  startX: number;
  color: string;
  width: number;
  height: number;
  delay: number;
  duration: number;
  driftX: number;
  rotations: number;
};

function createParticleConfigs(count: number): ParticleConfig[] {
  return Array.from({ length: count }, () => ({
    startX: Math.random() * SCREEN_WIDTH,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    width: 4 + Math.random() * 10,
    height: Math.random() > 0.5 ? 4 + Math.random() * 6 : 8 + Math.random() * 12,
    delay: Math.random() * 1500,
    duration: 2500 + Math.random() * 2500,
    driftX: (Math.random() - 0.5) * 200,
    rotations: 2 + Math.random() * 6,
  }));
}

function getEfficiency(moves: number): number {
  return Math.min(100, Math.round((PAIRS_PER_ROUND / moves) * 100));
}

function getScoreGradient(eff: number): [string, string] {
  if (eff >= 80) return [colors.islamic.gold, colors.accentLight];
  if (eff >= 60) return [colors.primary, colors.secondary];
  if (eff >= 40) return [colors.info, '#7C4DFF'];
  return ['#9C27B0', '#E91E63'];
}

function getBackgroundGradient(eff: number): [string, string, string] {
  if (eff >= 80) return ['#FFF8E1', '#FFFDE7', colors.background];
  if (eff >= 60) return ['#E8F5E9', '#F1F8E9', colors.background];
  if (eff >= 40) return ['#E3F2FD', '#E8EAF6', colors.background];
  return ['#F3E5F5', '#EDE7F6', colors.background];
}

function getResultsConfig(eff: number) {
  if (eff === 100) return { title: 'Perfect Match!', icon: 'trophy' as const, iconColor: colors.islamic.gold };
  if (eff >= 80) return { title: 'Outstanding!', icon: 'star' as const, iconColor: colors.islamic.gold };
  if (eff >= 60) return { title: 'Great Job!', icon: 'ribbon' as const, iconColor: colors.primary };
  if (eff >= 40) return { title: 'Good Effort!', icon: 'thumbs-up' as const, iconColor: colors.info };
  return { title: 'Keep Practicing!', icon: 'book' as const, iconColor: '#9C27B0' };
}

const ConfettiOverlay: React.FC = React.memo(() => {
  const configs = useRef(createParticleConfigs(50)).current;
  const anims = useRef(configs.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel(
      anims.map((a, i) =>
        Animated.timing(a, {
          toValue: 1,
          duration: configs[i].duration,
          delay: configs[i].delay,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {configs.map((cfg, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: cfg.startX,
            top: -20,
            width: cfg.width,
            height: cfg.height,
            borderRadius: Math.min(cfg.width, cfg.height) / 2,
            backgroundColor: cfg.color,
            opacity: anims[i].interpolate({
              inputRange: [0, 0.05, 0.7, 1],
              outputRange: [0, 1, 0.8, 0],
            }),
            transform: [
              {
                translateY: anims[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, SCREEN_HEIGHT + 40],
                }),
              },
              {
                translateX: anims[i].interpolate({
                  inputRange: [0, 0.3, 0.7, 1],
                  outputRange: [0, cfg.driftX * 0.4, cfg.driftX, cfg.driftX * 0.6],
                }),
              },
              {
                rotate: anims[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', `${cfg.rotations * 360}deg`],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
});

// --- Main component ---

export const AsmaUlHusnaMatchingScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const dataQuery = useQuery({
    queryKey: ['asmaUlHusna'],
    queryFn: () => asmaUlHusnaService.getData(),
  });

  const names = dataQuery.data?.names ?? [];

  const [arabicTiles, setArabicTiles] = useState<Tile[]>([]);
  const [englishTiles, setEnglishTiles] = useState<Tile[]>([]);
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);
  const [moves, setMoves] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [displayEfficiency, setDisplayEfficiency] = useState(0);

  const resultsFade = useRef(new Animated.Value(0)).current;
  const scoreSlide = useRef(new Animated.Value(-60)).current;
  const scoreScale = useRef(new Animated.Value(0.3)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;
  const statsFade = useRef(new Animated.Value(0)).current;
  const statsSlide = useRef(new Animated.Value(30)).current;
  const buttonsFade = useRef(new Animated.Value(0)).current;
  const percentCounter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isFinished) return;

    const eff = getEfficiency(moves);

    resultsFade.setValue(0);
    scoreSlide.setValue(-60);
    scoreScale.setValue(0.3);
    titleFade.setValue(0);
    subtitleFade.setValue(0);
    statsFade.setValue(0);
    statsSlide.setValue(30);
    buttonsFade.setValue(0);
    percentCounter.setValue(0);
    setDisplayEfficiency(0);

    Animated.timing(resultsFade, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(scoreSlide, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.spring(scoreScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(scoreScale, { toValue: 1.08, duration: 200, useNativeDriver: true }),
        Animated.timing(scoreScale, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
    ]).start();

    const listener = percentCounter.addListener(({ value }) => {
      setDisplayEfficiency(Math.round(value));
    });
    Animated.timing(percentCounter, {
      toValue: eff, duration: 1000, delay: 500,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();

    Animated.timing(titleFade, { toValue: 1, duration: 400, delay: 700, useNativeDriver: true }).start();
    Animated.timing(subtitleFade, { toValue: 1, duration: 400, delay: 900, useNativeDriver: true }).start();
    Animated.parallel([
      Animated.timing(statsFade, { toValue: 1, duration: 400, delay: 1100, useNativeDriver: true }),
      Animated.timing(statsSlide, { toValue: 0, duration: 400, delay: 1100, useNativeDriver: true }),
    ]).start();
    Animated.timing(buttonsFade, { toValue: 1, duration: 400, delay: 1300, useNativeDriver: true }).start();

    return () => percentCounter.removeListener(listener);
  }, [isFinished, moves]);

  const allTiles = useMemo(() => [...arabicTiles, ...englishTiles], [arabicTiles, englishTiles]);

  const startNewRound = useCallback(() => {
    if (names.length < PAIRS_PER_ROUND) return;
    const { arabic, english } = buildTiles(names);
    setArabicTiles(arabic);
    setEnglishTiles(english);
    setSelectedTile(null);
    setMatchedPairs(new Set());
    setWrongPair(null);
    setMoves(0);
    setElapsedSeconds(0);
    setIsFinished(false);
  }, [names]);

  const handleReplaySame = useCallback(() => {
    setSelectedTile(null);
    setMatchedPairs(new Set());
    setWrongPair(null);
    setMoves(0);
    setElapsedSeconds(0);
    setIsFinished(false);
  }, []);

  useEffect(() => {
    if (names.length >= PAIRS_PER_ROUND && arabicTiles.length === 0) {
      startNewRound();
    }
  }, [names, arabicTiles.length, startNewRound]);

  useEffect(() => {
    if (arabicTiles.length > 0 && !isFinished) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [arabicTiles.length, isFinished]);

  const handleTilePress = useCallback((tileId: string) => {
    if (wrongPair) return;

    const tile = allTiles.find((t) => t.id === tileId);
    if (!tile || matchedPairs.has(tile.nameNumber)) return;

    if (!selectedTile) {
      setSelectedTile(tileId);
      return;
    }

    if (selectedTile === tileId) {
      setSelectedTile(null);
      return;
    }

    const firstTile = allTiles.find((t) => t.id === selectedTile);
    if (!firstTile) return;

    if (firstTile.type === tile.type) {
      setSelectedTile(tileId);
      return;
    }

    setMoves((m) => m + 1);

    if (firstTile.nameNumber === tile.nameNumber) {
      const newMatched = new Set(matchedPairs);
      newMatched.add(tile.nameNumber);
      setMatchedPairs(newMatched);
      setSelectedTile(null);
      if (newMatched.size === PAIRS_PER_ROUND) {
        setIsFinished(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    } else {
      setWrongPair([selectedTile, tileId]);
      setTimeout(() => {
        setWrongPair(null);
        setSelectedTile(null);
      }, 800);
    }
  }, [selectedTile, allTiles, matchedPairs, wrongPair]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getTileStyle = (tile: Tile) => {
    if (matchedPairs.has(tile.nameNumber)) return styles.tileMatched;
    if (wrongPair && (wrongPair[0] === tile.id || wrongPair[1] === tile.id)) return styles.tileWrong;
    if (selectedTile === tile.id) return styles.tileSelected;
    return styles.tileDefault;
  };

  const getTileTextStyle = (tile: Tile) => {
    if (matchedPairs.has(tile.nameNumber)) return styles.tileTextMatched;
    if (wrongPair && (wrongPair[0] === tile.id || wrongPair[1] === tile.id)) return styles.tileTextWrong;
    if (selectedTile === tile.id) return styles.tileTextSelected;
    return tile.type === 'arabic' ? styles.tileTextArabic : styles.tileTextEnglish;
  };

  // --- Loading ---
  if (dataQuery.isLoading || names.length < PAIRS_PER_ROUND) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <Header
            title="Matching"
            leftAction={{ iconName: 'arrow-back', onPress: () => navigation.goBack() }}
          />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  // --- Results ---
  if (isFinished) {
    const efficiency = getEfficiency(moves);
    const showConfetti = efficiency >= 80;
    const { title: tierTitle, icon: tierIcon, iconColor: tierIconColor } = getResultsConfig(efficiency);
    const bgGradient = getBackgroundGradient(efficiency);
    const ringGradient = getScoreGradient(efficiency);

    return (
      <View style={styles.container}>
        <LinearGradient colors={bgGradient} style={StyleSheet.absoluteFill} />
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <Header
            title="Results"
            leftAction={{ iconName: 'arrow-back', onPress: () => navigation.goBack() }}
          />
        </View>

        <Animated.ScrollView
          style={{ flex: 1, opacity: resultsFade }}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              transform: [{ translateY: scoreSlide }, { scale: scoreScale }],
              marginBottom: spacing.lg,
            }}
          >
            <LinearGradient
              colors={ringGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scoreRing}
            >
              <View style={styles.scoreInner}>
                <Text style={[styles.scorePercentLarge, { color: ringGradient[0] }]}>
                  {displayEfficiency}%
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View style={{ opacity: titleFade, alignItems: 'center', marginBottom: spacing.sm }}>
            <View style={[styles.tierIconBadge, { backgroundColor: tierIconColor + '20' }]}>
              <Ionicons name={tierIcon} size={28} color={tierIconColor} />
            </View>
            <Text style={styles.resultsTitleLarge}>{tierTitle}</Text>
          </Animated.View>

          <Animated.Text style={[styles.resultsSubtitleText, { opacity: subtitleFade }]}>
            Completed in {moves} moves and {formatTime(elapsedSeconds)}
          </Animated.Text>

          <Animated.View
            style={[
              styles.resultsStatsRow,
              { opacity: statsFade, transform: [{ translateY: statsSlide }] },
            ]}
          >
            <View style={[styles.resultsStatCard, { borderTopColor: colors.primary }]}>
              <Ionicons name="swap-horizontal" size={22} color={colors.primary} />
              <Text style={styles.resultsStatValue}>{moves}</Text>
              <Text style={styles.resultsStatLabel}>Moves</Text>
            </View>
            <View style={[styles.resultsStatCard, { borderTopColor: colors.accent }]}>
              <Ionicons name="time-outline" size={22} color={colors.accent} />
              <Text style={styles.resultsStatValue}>{formatTime(elapsedSeconds)}</Text>
              <Text style={styles.resultsStatLabel}>Time</Text>
            </View>
            <View style={[styles.resultsStatCard, { borderTopColor: colors.info }]}>
              <Ionicons name="analytics" size={22} color={colors.info} />
              <Text style={styles.resultsStatValue}>{efficiency}%</Text>
              <Text style={styles.resultsStatLabel}>Efficiency</Text>
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: buttonsFade, width: '100%', alignItems: 'center' }}>
            <TouchableOpacity
              style={styles.newRoundButton}
              onPress={startNewRound}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.newRoundGradient}
              >
                <Ionicons name="shuffle" size={20} color={colors.text.white} />
                <Text style={styles.newRoundText}>New Round</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.replayButton}
              onPress={handleReplaySame}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={18} color={colors.primary} />
              <Text style={styles.replayButtonText}>Replay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Text style={styles.backButtonText}>Back to Games</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.ScrollView>

        {showConfetti && <ConfettiOverlay />}
      </View>
    );
  }

  // --- Gameplay ---
  const progress = matchedPairs.size / PAIRS_PER_ROUND;

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Header
          title="Matching"
          leftAction={{ iconName: 'arrow-back', onPress: () => navigation.goBack() }}
        />
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statPill}>
          <Ionicons name="swap-horizontal" size={14} color={colors.primary} />
          <Text style={styles.statPillText}>{moves} moves</Text>
        </View>
        <View style={styles.statPill}>
          <Ionicons name="checkmark-done" size={14} color={colors.success} />
          <Text style={styles.statPillText}>{matchedPairs.size}/{PAIRS_PER_ROUND}</Text>
        </View>
        <View style={styles.statPill}>
          <Ionicons name="time-outline" size={14} color={colors.accent} />
          <Text style={styles.statPillText}>{formatTime(elapsedSeconds)}</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.instructions}>
          Match each Arabic name with its English meaning
        </Text>

        <View style={styles.headerRow}>
          <View style={styles.columnHeaderWrap}>
            <Ionicons name="language" size={14} color={colors.text.tertiary} />
            <Text style={styles.columnHeader}>Arabic</Text>
          </View>
          <View style={styles.columnHeaderWrap}>
            <Ionicons name="text" size={14} color={colors.text.tertiary} />
            <Text style={styles.columnHeader}>English</Text>
          </View>
        </View>

        {arabicTiles.map((arTile, i) => {
          const enTile = englishTiles[i];
          const arMatched = matchedPairs.has(arTile.nameNumber);
          const enMatched = matchedPairs.has(enTile.nameNumber);

          return (
            <View key={arTile.id} style={styles.tileRow}>
              <TouchableOpacity
                style={[styles.tile, getTileStyle(arTile)]}
                onPress={() => handleTilePress(arTile.id)}
                activeOpacity={0.7}
                disabled={arMatched}
              >
                {arMatched && (
                  <View style={styles.matchedBadge}>
                    <Ionicons name="checkmark" size={10} color={colors.text.white} />
                  </View>
                )}
                <Text style={[styles.tileText, getTileTextStyle(arTile)]}>{arTile.display}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tile, getTileStyle(enTile)]}
                onPress={() => handleTilePress(enTile.id)}
                activeOpacity={0.7}
                disabled={enMatched}
              >
                {enMatched && (
                  <View style={styles.matchedBadge}>
                    <Ionicons name="checkmark" size={10} color={colors.text.white} />
                  </View>
                )}
                <Text style={[styles.tileText, getTileTextStyle(enTile)]} numberOfLines={2}>{enTile.display}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statPillText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },

  // Progress bar
  progressBar: {
    height: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
  },

  // Instructions & headers
  instructions: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  headerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  columnHeaderWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  columnHeader: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Tiles
  tileRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tile: {
    flex: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderWidth: 1.5,
  },
  tileDefault: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  tileSelected: {
    backgroundColor: '#E1F5FE',
    borderColor: colors.info,
    borderWidth: 2,
  },
  tileMatched: {
    backgroundColor: '#E8F5E9',
    borderColor: colors.success,
    opacity: 0.65,
  },
  tileWrong: {
    backgroundColor: '#FFEBEE',
    borderColor: colors.error,
  },
  tileText: {
    textAlign: 'center',
  },
  tileTextArabic: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.primary,
  },
  tileTextEnglish: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '500',
  },
  tileTextSelected: {
    color: colors.info,
    fontWeight: '700',
  },
  tileTextMatched: {
    color: colors.success,
    fontWeight: '600',
  },
  tileTextWrong: {
    color: colors.error,
    fontWeight: '600',
  },
  matchedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Results screen
  resultsContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  scoreRing: {
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreInner: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorePercentLarge: {
    fontSize: 44,
    fontWeight: '800',
    textAlign: 'center',
  },
  tierIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  resultsTitleLarge: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  resultsSubtitleText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  resultsStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    width: '100%',
  },
  resultsStatCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderTopWidth: 3,
    gap: 4,
  },
  resultsStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
  },
  resultsStatLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  newRoundButton: {
    width: '100%',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  newRoundGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  newRoundText: {
    ...typography.button,
    color: colors.text.white,
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  replayButtonText: {
    ...typography.button,
    color: colors.primary,
  },
  backButton: {
    paddingVertical: spacing.md,
  },
  backButtonText: {
    ...typography.button,
    color: colors.primary,
  },
});
