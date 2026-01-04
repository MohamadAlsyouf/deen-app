import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Card } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/theme';
import type { AsmaUlHusnaName } from '@/types/asmaUlHusna';

type AsmaUlHusnaNameCardProps = {
  name: AsmaUlHusnaName;
};

const AUDIO_BASE_URL = 'https://islamicapi.com';

export const AsmaUlHusnaNameCard: React.FC<AsmaUlHusnaNameCardProps> = ({ name }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const audioUrl = name.audio ? `${AUDIO_BASE_URL}${name.audio}` : null;

  const handlePlayAudio = useCallback(async () => {
    if (!audioUrl) {
      return;
    }

    try {
      if (isPlaying && sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          newSound.unloadAsync();
          setSound(null);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  }, [audioUrl, isPlaying, sound]);

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

