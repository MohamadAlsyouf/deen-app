/**
 * WebNamesContent - 99 Names of Allah with luxury styling and audio
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

const AUDIO_BASE_URL = 'https://islamicapi.com';

const NameCard: React.FC<{
  name: AsmaUlHusnaName;
  index: number;
}> = ({ name, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const audioUrl = name.audio ? `${AUDIO_BASE_URL}${name.audio}` : null;

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  const handlePlayAudio = useCallback(async (e: any) => {
    // Prevent card expansion when clicking audio button
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
    } catch (error) {
      console.error('Error playing audio:', error);
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

  const hasAudio = Boolean(audioUrl);

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.95}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[
        styles.nameCard,
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
      
      <View style={styles.nameHeader}>
        <View style={[styles.nameNumber, expanded && styles.nameNumberExpanded]}>
          <Text style={[styles.nameNumberText, expanded && styles.nameNumberTextExpanded]}>
            {name.number}
          </Text>
        </View>
        <View style={styles.nameTitleWrap}>
          <Text style={[styles.nameArabic, expanded && styles.nameArabicExpanded]}>
            {name.name}
          </Text>
          <Text style={[styles.nameEnglish, expanded && styles.nameEnglishExpanded]}>
            {name.transliteration}
          </Text>
          <Text style={[styles.nameMeaning, expanded && styles.nameMeaningExpanded]}>
            {name.meaning}
          </Text>
        </View>
        
        {/* Audio Button */}
        {hasAudio && (
          <TouchableOpacity
            onPress={handlePlayAudio}
            activeOpacity={0.7}
            // @ts-ignore
            onMouseEnter={audioHover.handlers.onMouseEnter}
            onMouseLeave={audioHover.handlers.onMouseLeave}
            style={[
              styles.audioButton,
              expanded && styles.audioButtonExpanded,
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
        <View style={styles.nameExpanded}>
          <View style={styles.nameDivider} />
          {name.translation && (
            <Text style={styles.nameTranslation}>{name.translation}</Text>
          )}
          {name.meaning && name.meaning !== name.translation && (
            <Text style={styles.nameExplanation}>{name.meaning}</Text>
          )}
        </View>
      )}

      <View style={styles.nameExpandHint}>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={expanded ? 'rgba(255,255,255,0.6)' : colors.text.tertiary}
        />
      </View>
    </TouchableOpacity>
  );
};

export const WebNamesContent: React.FC = () => {
  const { width } = useWindowDimensions();
  const isWide = width >= 1400;
  const isMedium = width >= 1000;

  const dataQuery = useQuery({
    queryKey: ['asmaUlHusna'],
    queryFn: () => asmaUlHusnaService.getData(),
  });

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderIcon}>
          <Ionicons name="heart" size={32} color={colors.accent} />
        </View>
        <Text style={styles.pageTitle}>Asma ul Husna</Text>
        <Text style={styles.pageArabicTitle}>أَسْمَاءُ اللَّهِ الْحُسْنَى</Text>
        <Text style={styles.pageSubtitle}>
          The 99 Beautiful Names of Allah - learn, memorize, and reflect on the divine attributes
        </Text>
      </View>

      {dataQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading the beautiful names...</Text>
        </View>
      ) : dataQuery.isError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Failed to load names</Text>
        </View>
      ) : dataQuery.data ? (
        <>
          {/* Info Cards */}
          {(dataQuery.data.recitation_benefits || dataQuery.data.hadith) && (
            <View style={styles.infoCardsContainer}>
              {dataQuery.data.recitation_benefits && (
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <Ionicons name="sparkles" size={20} color={colors.accent} />
                    <Text style={styles.infoCardTitle}>Benefits of Recitation</Text>
                  </View>
                  <Text style={styles.infoCardText}>
                    {dataQuery.data.recitation_benefits}
                  </Text>
                </View>
              )}
              {dataQuery.data.hadith && (
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <Ionicons name="book" size={20} color={colors.primary} />
                    <Text style={styles.infoCardTitle}>Hadith</Text>
                  </View>
                  <Text style={styles.infoCardText}>
                    {dataQuery.data.hadith}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Names Grid */}
          <View style={[
            styles.namesGrid,
            isMedium && styles.namesGridMedium,
            isWide && styles.namesGridWide,
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

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 40,
    paddingBottom: 60,
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
    flexDirection: 'row',
    gap: 20,
    marginBottom: 40,
    flexWrap: 'wrap',
  },
  infoCard: {
    flex: 1,
    minWidth: 300,
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
    gap: 16,
  },
  namesGridMedium: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  namesGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    // @ts-ignore
    flex: '0 0 calc(33.333% - 11px)',
    minWidth: 280,
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
