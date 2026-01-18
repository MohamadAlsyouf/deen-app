import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

type AudioPlayerBarProps = {
  onReciterPress: () => void;
};

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  onReciterPress,
}) => {
  const insets = useSafeAreaInsets();
  const {
    playbackState,
    currentPosition,
    duration,
    selectedReciter,
    play,
    pause,
  } = useAudioPlayer();

  const handlePlayPause = useCallback(async () => {
    if (playbackState === 'playing') {
      await pause();
    } else {
      await play();
    }
  }, [playbackState, play, pause]);

  const isLoading = playbackState === 'loading';
  const isPlaying = playbackState === 'playing';
  const isDisabled = playbackState === 'idle' || playbackState === 'error';

  const progress = duration > 0 ? (currentPosition / duration) * 100 : 0;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.xs) }]}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.content}>
        {/* Time display */}
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
          <Text style={styles.timeSeparator}>/</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        {/* Play/Pause button */}
        <TouchableOpacity
          style={[styles.playButton, isDisabled && styles.playButtonDisabled]}
          onPress={handlePlayPause}
          disabled={isDisabled || isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.text.white} />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color={colors.text.white}
              style={!isPlaying ? styles.playIcon : undefined}
            />
          )}
        </TouchableOpacity>

        {/* Reciter selector */}
        <TouchableOpacity
          style={styles.reciterButton}
          onPress={onReciterPress}
          activeOpacity={0.7}
        >
          <View style={styles.reciterInfo}>
            <Text style={styles.reciterLabel}>Reciter</Text>
            <Text style={styles.reciterName} numberOfLines={1}>
              {selectedReciter?.name ?? 'Select'}
            </Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={18}
            color={colors.text.secondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.medium,
  },
  progressContainer: {
    height: 3,
    backgroundColor: colors.border,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  timeText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  timeSeparator: {
    ...typography.caption,
    color: colors.text.disabled,
    marginHorizontal: 2,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  playButtonDisabled: {
    backgroundColor: colors.text.disabled,
  },
  playIcon: {
    marginLeft: 2, // Visual centering for play icon
  },
  reciterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  reciterInfo: {
    flex: 1,
  },
  reciterLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reciterName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});

