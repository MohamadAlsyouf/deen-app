import React, { useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, borderRadius, shadows } from "@/theme";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

type AudioPlayerBarProps = {
  onSettingsPress: () => void;
  onPreviousChapter: () => void;
  onNextChapter: () => void;
  isChapterTransitioning?: boolean;
};

const formatTime = (ms: number): string => {
  if (!ms || isNaN(ms) || !isFinite(ms) || ms < 0) {
    return "0:00";
  }
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  onSettingsPress,
  onPreviousChapter,
  onNextChapter,
  isChapterTransitioning = false,
}) => {
  const insets = useSafeAreaInsets();
  const {
    playbackState,
    currentPosition,
    duration,
    audioFile,
    errorMessage,
    play,
    pause,
    seekTo,
    clearError,
  } = useAudioPlayer();

  const lastSkipToStartTime = useRef<number>(0);

  // Get duration from audioFile if context duration is 0 or invalid
  const effectiveDuration = useMemo(() => {
    if (duration && duration > 0 && isFinite(duration)) {
      return duration;
    }
    if (audioFile?.verse_timings && audioFile.verse_timings.length > 0) {
      const lastTiming =
        audioFile.verse_timings[audioFile.verse_timings.length - 1];
      if (lastTiming?.timestamp_to && lastTiming.timestamp_to > 0) {
        return lastTiming.timestamp_to;
      }
    }
    return 0;
  }, [duration, audioFile]);

  const handlePlayPause = useCallback(async () => {
    if (playbackState === "playing") {
      await pause();
    } else {
      await play();
    }
  }, [playbackState, play, pause]);

  const handleRewind = useCallback(async () => {
    const newPosition = Math.max(0, currentPosition - 10000);
    await seekTo(newPosition);
  }, [currentPosition, seekTo]);

  const handleFastForward = useCallback(async () => {
    const newPosition = Math.min(effectiveDuration, currentPosition + 10000);
    await seekTo(newPosition);
  }, [currentPosition, effectiveDuration, seekTo]);

  const handleSkipToStart = useCallback(async () => {
    const now = Date.now();
    if (now - lastSkipToStartTime.current < 2000) {
      // Double tap within 2 seconds - go to previous chapter
      onPreviousChapter();
    } else {
      // Single tap - go to start
      await seekTo(0);
    }
    lastSkipToStartTime.current = now;
  }, [seekTo, onPreviousChapter]);

  const handleSettingsPress = useCallback(() => {
    // Clear any error when opening settings
    if (playbackState === "error") {
      clearError();
    }
    onSettingsPress();
  }, [playbackState, clearError, onSettingsPress]);

  const isLoading = playbackState === "loading" && !isChapterTransitioning;
  const isPlaying = playbackState === "playing";
  const isError = playbackState === "error";
  const isDisabled = playbackState === "idle" || isError;

  const progress =
    effectiveDuration > 0 ? (currentPosition / effectiveDuration) * 100 : 0;

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom - spacing.lg, 0) },
      ]}
    >
      {/* Error message banner */}
      {isError && errorMessage && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <Text style={styles.errorText} numberOfLines={1}>
            {errorMessage}
          </Text>
        </View>
      )}

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressFill,
            isError && styles.progressFillError,
            { width: `${progress}%` },
          ]}
        />
      </View>

      <View style={styles.content}>
        {/* Center controls */}
        <View style={styles.controlsCenter}>
          {/* Skip to start / Previous chapter */}
          <TouchableOpacity
            onPress={handleSkipToStart}
            disabled={isDisabled}
            style={[
              styles.controlButton,
              isDisabled && styles.controlButtonDisabled,
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="play-skip-back"
              size={22}
              color={isDisabled ? colors.text.disabled : colors.primary}
            />
          </TouchableOpacity>

          {/* Rewind 10s */}
          <TouchableOpacity
            onPress={handleRewind}
            disabled={isDisabled}
            style={[
              styles.controlButton,
              isDisabled && styles.controlButtonDisabled,
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.skipButtonContent}>
              <Ionicons
                name="play-back"
                size={22}
                color={isDisabled ? colors.text.disabled : colors.primary}
              />
              <Text
                style={[styles.skipText, isDisabled && styles.skipTextDisabled]}
              >
                10
              </Text>
            </View>
          </TouchableOpacity>

          {/* Play/Pause button */}
          <TouchableOpacity
            style={[
              styles.playButton,
              isDisabled && styles.playButtonDisabled,
              isError && styles.playButtonError,
            ]}
            onPress={handlePlayPause}
            disabled={isDisabled || isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.text.white} />
            ) : isError ? (
              <Ionicons name="alert" size={28} color={colors.text.white} />
            ) : (
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={28}
                color={colors.text.white}
                style={!isPlaying ? styles.playIcon : undefined}
              />
            )}
          </TouchableOpacity>

          {/* Fast forward 10s */}
          <TouchableOpacity
            onPress={handleFastForward}
            disabled={isDisabled}
            style={[
              styles.controlButton,
              isDisabled && styles.controlButtonDisabled,
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.skipButtonContent}>
              <Ionicons
                name="play-forward"
                size={22}
                color={isDisabled ? colors.text.disabled : colors.primary}
              />
              <Text
                style={[styles.skipText, isDisabled && styles.skipTextDisabled]}
              >
                10
              </Text>
            </View>
          </TouchableOpacity>

          {/* Skip to end / Next chapter */}
          <TouchableOpacity
            onPress={onNextChapter}
            disabled={isDisabled}
            style={[
              styles.controlButton,
              isDisabled && styles.controlButtonDisabled,
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="play-skip-forward"
              size={22}
              color={isDisabled ? colors.text.disabled : colors.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, isError && styles.timeTextError]}>
            {formatTime(currentPosition)}
          </Text>
          <Text style={styles.timeSeparator}>/</Text>
          <Text style={[styles.timeText, isError && styles.timeTextError]}>
            {formatTime(effectiveDuration)}
          </Text>
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3F3",
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
    height: "100%",
    backgroundColor: colors.primary,
  },
  progressFillError: {
    backgroundColor: colors.error,
  },
  content: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 0,
    gap: spacing.xs,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontVariant: ["tabular-nums"],
    fontSize: 12,
  },
  timeSeparator: {
    ...typography.caption,
    color: colors.text.disabled,
    marginHorizontal: 2,
    fontSize: 12,
  },
  timeTextError: {
    color: colors.error,
  },
  controlsCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.round,
    backgroundColor: `${colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonDisabled: {
    backgroundColor: colors.surface,
  },
  skipButtonContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.primary,
    marginTop: -3,
  },
  skipTextDisabled: {
    color: colors.text.disabled,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.sm,
    ...shadows.small,
  },
  playButtonDisabled: {
    backgroundColor: colors.text.disabled,
  },
  playButtonError: {
    backgroundColor: colors.error,
  },
  playIcon: {
    marginLeft: 3,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: `${colors.primary}10`,
    alignItems: "center",
    justifyContent: "center",
  },
});
