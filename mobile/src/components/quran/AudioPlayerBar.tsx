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
    errorMessage,
    play,
    pause,
    clearError,
  } = useAudioPlayer();

  const handlePlayPause = useCallback(async () => {
    if (playbackState === 'playing') {
      await pause();
    } else {
      await play();
    }
  }, [playbackState, play, pause]);

  const handleReciterPress = useCallback(() => {
    // Clear any error when opening reciter selection
    if (playbackState === 'error') {
      clearError();
    }
    onReciterPress();
  }, [playbackState, clearError, onReciterPress]);

  const isLoading = playbackState === 'loading';
  const isPlaying = playbackState === 'playing';
  const isError = playbackState === 'error';
  const isDisabled = playbackState === 'idle' || isError;

  const progress = duration > 0 ? (currentPosition / duration) * 100 : 0;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.xs) }]}>
      {/* Error message banner */}
      {isError && errorMessage && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <Text style={styles.errorText} numberOfLines={1}>{errorMessage}</Text>
        </View>
      )}

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressFill, isError && styles.progressFillError, { width: `${progress}%` }]} />
      </View>

      <View style={styles.content}>
        {/* Time display */}
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, isError && styles.timeTextError]}>
            {formatTime(currentPosition)}
          </Text>
          <Text style={styles.timeSeparator}>/</Text>
          <Text style={[styles.timeText, isError && styles.timeTextError]}>
            {formatTime(duration)}
          </Text>
        </View>

        {/* Play/Pause button */}
        <TouchableOpacity
          style={[styles.playButton, isDisabled && styles.playButtonDisabled, isError && styles.playButtonError]}
          onPress={handlePlayPause}
          disabled={isDisabled || isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.text.white} />
          ) : isError ? (
            <Ionicons name="alert" size={20} color={colors.text.white} />
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
          style={[styles.reciterButton, isError && styles.reciterButtonError]}
          onPress={handleReciterPress}
          activeOpacity={0.7}
        >
          <View style={styles.reciterInfo}>
            <Text style={[styles.reciterLabel, isError && styles.reciterLabelError]}>
              {isError ? 'Select Different Reciter' : 'Reciter'}
            </Text>
            <Text style={[styles.reciterName, isError && styles.reciterNameError]} numberOfLines={1}>
              {selectedReciter?.name ?? 'Select'}
            </Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={18}
            color={isError ? colors.error : colors.text.secondary}
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3F3',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
  },
  progressContainer: {
    height: 3,
    backgroundColor: colors.border,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressFillError: {
    backgroundColor: colors.error,
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
  playButtonError: {
    backgroundColor: colors.error,
  },
  timeTextError: {
    color: colors.error,
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
  reciterButtonError: {
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: '#FFF3F3',
  },
  reciterLabelError: {
    color: colors.error,
  },
  reciterNameError: {
    color: colors.error,
  },
});

