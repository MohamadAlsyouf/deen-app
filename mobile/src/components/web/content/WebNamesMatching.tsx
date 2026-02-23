/**
 * WebNamesMatching - Tile matching game with hover effects, timer, and transitions
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors } from '@/theme';
import { useWebHover } from '@/hooks/useWebHover';
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

const shuffleArray = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const buildTiles = (names: AsmaUlHusnaName[]): { arabic: Tile[]; english: Tile[] } => {
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
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

type TileButtonProps = {
  tile: Tile;
  isSelected: boolean;
  isMatched: boolean;
  isWrong: boolean;
  onPress: () => void;
  disabled: boolean;
};

const TileButton: React.FC<TileButtonProps> = ({
  tile, isSelected, isMatched, isWrong, onPress, disabled,
}) => {
  const hover = useWebHover({
    hoverStyle: disabled ? {} : {
      transform: 'translateY(-3px) scale(1.02)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    },
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  const getTileStyle = () => {
    if (isMatched) return styles.tileMatched;
    if (isWrong) return styles.tileWrong;
    if (isSelected) return styles.tileSelected;
    return styles.tileDefault;
  };

  const getTextStyle = () => {
    if (isMatched) return styles.tileTextMatched;
    if (isWrong) return styles.tileTextWrong;
    if (isSelected) return styles.tileTextSelected;
    return tile.type === 'arabic' ? styles.tileTextArabic : styles.tileTextEnglish;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[
        styles.tile,
        getTileStyle(),
        !disabled && hover.style,
        {
          // @ts-ignore
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      ]}
    >
      <Text style={[styles.tileText, getTextStyle()]} numberOfLines={2}>
        {tile.display}
      </Text>
      {isMatched && (
        <View style={styles.matchedBadge}>
          <Ionicons name="checkmark" size={14} color={colors.success} />
        </View>
      )}
    </TouchableOpacity>
  );
};

type WebNamesMatchingProps = {
  onBack: () => void;
};

export const WebNamesMatching: React.FC<WebNamesMatchingProps> = ({ onBack }) => {
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

  const backHover = useWebHover({
    hoverStyle: { backgroundColor: `${colors.primary}15` },
    transition: 'all 0.2s ease-out',
  });

  const playAgainHover = useWebHover({
    hoverStyle: { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(27,67,50,0.3)' },
    transition: 'all 0.2s ease-out',
  });

  if (dataQuery.isLoading || names.length < PAIRS_PER_ROUND) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading matching game...</Text>
        </View>
      </View>
    );
  }

  if (isFinished) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            // @ts-ignore
            onMouseEnter={backHover.handlers.onMouseEnter}
            onMouseLeave={backHover.handlers.onMouseLeave}
            style={[styles.backButton, backHover.style]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Matching</Text>
          <View style={{ width: 80 }} />
        </View>

        <View style={styles.resultsContainer}>
          <View
            style={[
              styles.trophyCircle,
              {
                // @ts-ignore
                animation: 'score-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s forwards',
                opacity: 0,
              },
            ]}
          >
            <Ionicons name="trophy" size={56} color={colors.accent} />
          </View>

          <Text
            style={[
              styles.resultsTitle,
              {
                // @ts-ignore
                animation: 'fadeInUp 0.4s ease-out 0.5s forwards',
                opacity: 0,
              },
            ]}
          >
            Round Complete!
          </Text>

          <View
            style={[
              styles.statsRow,
              {
                // @ts-ignore
                animation: 'stat-slide-up 0.4s ease-out 0.8s forwards',
                opacity: 0,
              },
            ]}
          >
            <View style={styles.statItem}>
              <Ionicons name="swap-horizontal" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{moves}</Text>
              <Text style={styles.statLabel}>Moves</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={24} color={colors.info} />
              <Text style={styles.statValue}>{formatTime(elapsedSeconds)}</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="layers-outline" size={24} color={colors.accent} />
              <Text style={styles.statValue}>{PAIRS_PER_ROUND}</Text>
              <Text style={styles.statLabel}>Pairs</Text>
            </View>
          </View>

          <View
            style={[
              styles.resultsButtons,
              {
                // @ts-ignore
                animation: 'stat-slide-up 0.4s ease-out 1.1s forwards',
                opacity: 0,
              },
            ]}
          >
            <TouchableOpacity
              onPress={startNewRound}
              activeOpacity={0.8}
              // @ts-ignore
              onMouseEnter={playAgainHover.handlers.onMouseEnter}
              onMouseLeave={playAgainHover.handlers.onMouseLeave}
              style={[styles.playAgainButton, playAgainHover.style]}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.playAgainText}>Play Again</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onBack} activeOpacity={0.8} style={styles.textButton}>
              <Text style={styles.textButtonText}>Back to Games</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          // @ts-ignore
          onMouseEnter={backHover.handlers.onMouseEnter}
          onMouseLeave={backHover.handlers.onMouseLeave}
          style={[styles.backButton, backHover.style]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Matching</Text>
        <View style={{ width: 80 }} />
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statsBarItem}>
          <Ionicons name="swap-horizontal" size={16} color={colors.text.secondary} />
          <Text style={styles.statsBarText}>{moves} moves</Text>
        </View>
        <View style={styles.statsBarItem}>
          <Text style={styles.statsBarTextHighlight}>{matchedPairs.size}/{PAIRS_PER_ROUND}</Text>
          <Text style={styles.statsBarText}>matched</Text>
        </View>
        <View style={styles.statsBarItem}>
          <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.statsBarText}>{formatTime(elapsedSeconds)}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.matchProgressBar}>
        <View
          style={[
            styles.matchProgressFill,
            {
              width: `${(matchedPairs.size / PAIRS_PER_ROUND) * 100}%`,
              // @ts-ignore
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            },
          ]}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.instructions}>
          Match each Arabic name with its English meaning. Tap one from each column.
        </Text>

        {/* Column Headers */}
        <View style={styles.headerRow}>
          <Text style={styles.columnHeader}>Arabic</Text>
          <Text style={styles.columnHeader}>English</Text>
        </View>

        {/* Tile Rows */}
        {arabicTiles.map((arTile, i) => {
          const enTile = englishTiles[i];
          const isArSelected = selectedTile === arTile.id;
          const isEnSelected = selectedTile === enTile.id;
          const isArMatched = matchedPairs.has(arTile.nameNumber);
          const isEnMatched = matchedPairs.has(enTile.nameNumber);
          const isArWrong = !!wrongPair && (wrongPair[0] === arTile.id || wrongPair[1] === arTile.id);
          const isEnWrong = !!wrongPair && (wrongPair[0] === enTile.id || wrongPair[1] === enTile.id);

          return (
            <View
              key={arTile.id}
              style={[
                styles.tileRow,
                {
                  // @ts-ignore
                  animation: `fadeInUp 0.3s ease-out ${i * 0.05}s forwards`,
                  opacity: 0,
                },
              ]}
            >
              <TileButton
                tile={arTile}
                isSelected={isArSelected}
                isMatched={isArMatched}
                isWrong={isArWrong}
                onPress={() => handleTilePress(arTile.id)}
                disabled={isArMatched}
              />
              <TileButton
                tile={enTile}
                isSelected={isEnSelected}
                isMatched={isEnMatched}
                isWrong={isEnWrong}
                onPress={() => handleTilePress(enTile.id)}
                disabled={isEnMatched}
              />
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
    // @ts-ignore
    maxWidth: 800,
    marginHorizontal: 'auto',
    width: '100%',
    padding: 32,
  },
  center: {
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    // @ts-ignore
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  statsBarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsBarText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '600',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  statsBarTextHighlight: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  matchProgressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginBottom: 20,
    overflow: 'hidden',
  },
  matchProgressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  content: {
    paddingBottom: 40,
  },
  instructions: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  columnHeader: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.tertiary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  tileRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  tile: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    borderWidth: 1.5,
    position: 'relative',
    // @ts-ignore
    cursor: 'pointer',
  },
  tileDefault: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  tileSelected: {
    backgroundColor: '#E1F5FE',
    borderColor: colors.info,
    // @ts-ignore
    boxShadow: '0 4px 16px rgba(2,136,209,0.15)',
  },
  tileMatched: {
    backgroundColor: '#E8F5E9',
    borderColor: colors.success,
    opacity: 0.7,
    // @ts-ignore
    cursor: 'default',
  },
  tileWrong: {
    backgroundColor: '#FFEBEE',
    borderColor: colors.error,
    // @ts-ignore
    animation: 'shake 0.3s ease-out',
  },
  tileText: {
    textAlign: 'center',
  },
  tileTextArabic: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  tileTextEnglish: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
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
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  trophyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 28,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    // @ts-ignore
    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 28,
    gap: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: colors.border,
  },
  resultsButtons: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  playAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    gap: 8,
    width: '100%',
    marginBottom: 12,
    // @ts-ignore
    cursor: 'pointer',
  },
  playAgainText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  textButton: {
    paddingVertical: 12,
    // @ts-ignore
    cursor: 'pointer',
  },
  textButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
});
