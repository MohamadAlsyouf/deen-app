import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { Card } from '@/components/common/Card';
import { colors, spacing, typography, borderRadius } from '@/theme';
import type { AsmaUlHusnaName } from '@/types/asmaUlHusna';

type AsmaUlHusnaNameCardProps = {
  name: AsmaUlHusnaName;
};

const AUDIO_BASE_URL = 'https://islamicapi.com';

export const AsmaUlHusnaNameCard: React.FC<AsmaUlHusnaNameCardProps> = ({ name }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const hasSetAudioMode = useRef(false);

  const audioUrl = name.audio ? `${AUDIO_BASE_URL}${name.audio}` : null;

  // Create audio player with the source (or null if no audio)
  const player = useAudioPlayer(audioUrl ? { uri: audioUrl } : null);
  const status = useAudioPlayerStatus(player);

  // Update isPlaying state based on player status
  useEffect(() => {
    if (status) {
      setIsPlaying(status.playing);
    }
  }, [status?.playing]);

  const handlePlayAudio = useCallback(async () => {
    if (!audioUrl || !player) {
      return;
    }

    try {
      if (isPlaying) {
        player.pause();
        player.seekTo(0);
        setIsPlaying(false);
        return;
      }

      // Set audio mode once
      if (!hasSetAudioMode.current) {
        await setAudioModeAsync({ playsInSilentMode: true });
        hasSetAudioMode.current = true;
      }

      player.seekTo(0);
      player.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  }, [audioUrl, isPlaying, player]);

  const hasAudio = Boolean(audioUrl);

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{name.number}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.arabicName}>{name.name}</Text>
          <Text style={styles.transliteration}>{name.transliteration}</Text>
          <Text style={styles.translationText}>{name.translation}</Text>
          <Text style={styles.meaning}>{name.meaning}</Text>
        </View>

        {hasAudio && (
          <TouchableOpacity
            onPress={handlePlayAudio}
            style={styles.audioButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isPlaying ? 'stop-circle-outline' : 'volume-high-outline'}
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  badgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  arabicName: {
    fontSize: 22,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'left',
  },
  transliteration: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: 2,
  },
  translationText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  meaning: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  audioButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
});

