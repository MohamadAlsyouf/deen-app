import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
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

  useEffect(() => {
    if (names.length >= PAIRS_PER_ROUND && arabicTiles.length === 0) {
      startNewRound();
    }
  }, [names, arabicTiles.length, startNewRound]);

  // Timer
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

  if (isFinished) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <Header
            title="Matching"
            leftAction={{ iconName: 'arrow-back', onPress: () => navigation.goBack() }}
          />
        </View>
        <View style={styles.resultsContainer}>
          <Ionicons name="trophy" size={64} color={colors.accent} />
          <Text style={styles.resultsTitle}>Round Complete!</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{moves}</Text>
              <Text style={styles.statLabel}>Moves</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(elapsedSeconds)}</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{PAIRS_PER_ROUND}</Text>
              <Text style={styles.statLabel}>Pairs</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.restartButton} onPress={startNewRound} activeOpacity={0.8}>
            <Ionicons name="refresh" size={20} color={colors.text.white} />
            <Text style={styles.restartButtonText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.backButtonText}>Back to Games</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Header
          title="Matching"
          leftAction={{ iconName: 'arrow-back', onPress: () => navigation.goBack() }}
        />
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <Text style={styles.statsBarText}>
          <Ionicons name="swap-horizontal" size={14} color={colors.text.secondary} /> {moves} moves
        </Text>
        <Text style={styles.statsBarText}>
          {matchedPairs.size}/{PAIRS_PER_ROUND} matched
        </Text>
        <Text style={styles.statsBarText}>
          <Ionicons name="time-outline" size={14} color={colors.text.secondary} /> {formatTime(elapsedSeconds)}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.instructions}>
          Match each Arabic name with its English meaning. Tap one from each column.
        </Text>

        {/* Column headers */}
        <View style={styles.headerRow}>
          <Text style={styles.columnHeader}>Arabic</Text>
          <Text style={styles.columnHeader}>English</Text>
        </View>

        {/* Paired rows — Arabic left, English right, always aligned */}
        {arabicTiles.map((arTile, i) => {
          const enTile = englishTiles[i];
          return (
            <View key={arTile.id} style={styles.tileRow}>
              <TouchableOpacity
                style={[styles.tile, getTileStyle(arTile)]}
                onPress={() => handleTilePress(arTile.id)}
                activeOpacity={0.7}
                disabled={matchedPairs.has(arTile.nameNumber)}
              >
                <Text style={[styles.tileText, getTileTextStyle(arTile)]}>{arTile.display}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tile, getTileStyle(enTile)]}
                onPress={() => handleTilePress(enTile.id)}
                activeOpacity={0.7}
                disabled={matchedPairs.has(enTile.nameNumber)}
              >
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
  statsBarText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
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
  columnHeader: {
    ...typography.caption,
    flex: 1,
    color: colors.text.tertiary,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
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
    minHeight: 52,
    borderWidth: 1.5,
  },
  tileDefault: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  tileSelected: {
    backgroundColor: '#E1F5FE',
    borderColor: colors.info,
  },
  tileMatched: {
    backgroundColor: '#E8F5E9',
    borderColor: colors.success,
    opacity: 0.6,
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
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  resultsTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  statValue: {
    ...typography.h3,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.md,
    width: '100%',
  },
  restartButtonText: {
    ...typography.button,
    color: colors.text.white,
  },
  backButton: {
    paddingVertical: spacing.md,
  },
  backButtonText: {
    ...typography.button,
    color: colors.primary,
  },
});
