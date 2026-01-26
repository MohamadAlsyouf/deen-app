/**
 * WebQuranContent - Quran chapters and verses with luxury styling
 * Includes audio player, reciter selection, verse highlighting, auto-scroll, view mode toggle, and verse range/loop settings
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { colors } from '@/theme';
import { useWebHover } from '@/hooks/useWebHover';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { quranService } from '@/services/quranService';
import type { QuranChapter, QuranVerse, NormalizedReciter } from '@/types/quran';

const PER_PAGE = 50;

// View mode type
type ViewMode = 'all' | 'arabic' | 'english';

// Strip HTML tags from translation text (e.g., <sup foot_note=123>1</sup>)
const stripHtmlTags = (text: string): string => {
  if (!text) return '';
  // Remove all HTML tags including their content for sup tags
  return text
    .replace(/<sup[^>]*>.*?<\/sup>/gi, '') // Remove <sup>...</sup> entirely
    .replace(/<[^>]+>/g, '') // Remove any other HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

// Transform QuranVerse to include transliteration and translation as direct properties
type TransformedVerse = QuranVerse & {
  transliteration?: string;
  translation?: string;
};

const transformVerse = (verse: QuranVerse): TransformedVerse => {
  // Extract transliteration from words
  const transliteration = verse.words
    ?.filter(w => w.char_type_name !== 'end')
    ?.map(w => w.transliteration?.text)
    ?.filter(Boolean)
    ?.join(' ') || '';

  // Extract translation from translations array and strip HTML tags
  const rawTranslation = verse.translations?.[0]?.text || '';
  const translation = stripHtmlTags(rawTranslation);

  return {
    ...verse,
    transliteration,
    translation,
  };
};

type WebQuranContentProps = {
  subScreen: string | null;
  subScreenData: any;
  onSubNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
};

const ChapterCard: React.FC<{
  chapter: QuranChapter;
  onPress: () => void;
  index: number;
}> = ({ chapter, onPress, index }) => {
  const hover = useWebHover({
    hoverStyle: {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 32px rgba(27, 67, 50, 0.15)',
    },
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[
        styles.chapterCard,
        hover.style,
        {
          // @ts-ignore
          animation: `fadeInUp 0.4s ease-out ${0.05 * Math.min(index, 10)}s forwards`,
          opacity: 0,
        },
      ]}
    >
      <View style={styles.chapterNumber}>
        <Text style={styles.chapterNumberText}>{chapter.id}</Text>
      </View>
      <View style={styles.chapterInfo}>
        <Text style={styles.chapterName}>{chapter.name_simple}</Text>
        <Text style={styles.chapterMeaning}>{chapter.translated_name?.name}</Text>
        <Text style={styles.chapterMeta}>
          {chapter.verses_count} verses • {chapter.revelation_place}
        </Text>
      </View>
      <View style={styles.chapterArabic}>
        <Text style={styles.chapterArabicText}>{chapter.name_arabic}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
    </TouchableOpacity>
  );
};

// Format time in mm:ss - handles NaN and invalid values
const formatTime = (ms: number): string => {
  if (!ms || isNaN(ms) || !isFinite(ms) || ms < 0) {
    return '0:00';
  }
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// View Mode Toggle Component
const ViewModeToggle: React.FC<{
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}> = ({ viewMode, onViewModeChange }) => {
  const modes: { key: ViewMode; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'arabic', label: 'عربي' },
    { key: 'english', label: 'English' },
  ];

  return (
    <View style={styles.viewModeContainer}>
      <View style={styles.viewModeToggle}>
        {modes.map((mode) => {
          const isActive = viewMode === mode.key;
          return (
            <TouchableOpacity
              key={mode.key}
              style={[
                styles.viewModeButton,
                isActive && styles.viewModeButtonActive,
              ]}
              onPress={() => onViewModeChange(mode.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.viewModeText,
                  isActive && styles.viewModeTextActive,
                  mode.key === 'arabic' && styles.viewModeArabicText,
                ]}
              >
                {mode.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const VerseCard: React.FC<{
  verse: TransformedVerse;
  index: number;
  highlightStatus?: 'none' | 'current' | 'completed';
  highlightedWordPosition?: number | null;
  viewMode?: ViewMode;
}> = ({ verse, index, highlightStatus = 'none', highlightedWordPosition, viewMode = 'all' }) => {
  const hover = useWebHover({
    hoverStyle: {
      backgroundColor: highlightStatus === 'current' ? '#D4EDDA' : '#FAFBFA',
      borderColor: colors.primary,
    },
    transition: 'all 0.2s ease-out',
  });

  const isHighlighted = highlightStatus === 'current';
  const isCompleted = highlightStatus === 'completed';

  // Determine what to show based on view mode
  const showArabic = viewMode === 'all' || viewMode === 'arabic';
  const showTransliteration = viewMode === 'all';
  const showTranslation = viewMode === 'all' || viewMode === 'english';

  // Render Arabic text with word-level highlighting
  const renderArabicWithHighlight = () => {
    const arabicStyle = [
      styles.verseArabic,
      isHighlighted && styles.verseArabicHighlighted,
      viewMode === 'arabic' && styles.verseArabicOnly,
    ];

    if (!isHighlighted || !verse.words || highlightedWordPosition === null || highlightedWordPosition === undefined) {
      return (
        <Text style={arabicStyle}>
          {verse.text_uthmani}
        </Text>
      );
    }

    // Filter out end markers and render words with highlighting
    const wordsToRender = verse.words.filter(w => w.char_type_name !== 'end');
    
    return (
      <Text style={arabicStyle}>
        {wordsToRender.map((word, idx) => {
          const isCurrentWord = word.position === highlightedWordPosition;
          return (
            <Text
              key={word.id || idx}
              style={isCurrentWord ? styles.highlightedWord : undefined}
            >
              {word.text_uthmani}{' '}
            </Text>
          );
        })}
      </Text>
    );
  };

  // English-only mode renders differently
  if (viewMode === 'english') {
    return (
      <View
        // @ts-ignore
        onMouseEnter={hover.handlers.onMouseEnter}
        onMouseLeave={hover.handlers.onMouseLeave}
        style={[
          styles.verseCard,
          styles.verseCardEnglishOnly,
          hover.style,
          isHighlighted && styles.verseCardHighlighted,
          isCompleted && styles.verseCardCompleted,
          {
            // @ts-ignore
            animation: `fadeInUp 0.4s ease-out ${0.03 * Math.min(index, 15)}s forwards`,
            opacity: 0,
          },
        ]}
      >
        {isHighlighted && (
          <View style={styles.playingIndicator}>
            <View style={styles.playingDot} />
            <View style={[styles.playingDot, styles.playingDot2]} />
            <View style={[styles.playingDot, styles.playingDot3]} />
          </View>
        )}
        <View style={[styles.verseNumber, isHighlighted && styles.verseNumberHighlighted]}>
          <Text style={[styles.verseNumberText, isHighlighted && styles.verseNumberTextHighlighted]}>
            {verse.verse_number}
          </Text>
        </View>
        <View style={styles.verseContent}>
          {verse.translation && (
            <Text style={[styles.verseTranslationOnly, isHighlighted && styles.verseTranslationHighlighted]}>
              {verse.translation}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View
      // @ts-ignore
      onMouseEnter={hover.handlers.onMouseEnter}
      onMouseLeave={hover.handlers.onMouseLeave}
      style={[
        styles.verseCard,
        viewMode === 'arabic' && styles.verseCardArabicOnly,
        hover.style,
        isHighlighted && styles.verseCardHighlighted,
        isCompleted && styles.verseCardCompleted,
        {
          // @ts-ignore
          animation: `fadeInUp 0.4s ease-out ${0.03 * Math.min(index, 15)}s forwards`,
          opacity: 0,
        },
      ]}
    >
      {/* Playing indicator */}
      {isHighlighted && (
        <View style={styles.playingIndicator}>
          <View style={styles.playingDot} />
          <View style={[styles.playingDot, styles.playingDot2]} />
          <View style={[styles.playingDot, styles.playingDot3]} />
        </View>
      )}
      <View style={[styles.verseNumber, isHighlighted && styles.verseNumberHighlighted]}>
        <Text style={[styles.verseNumberText, isHighlighted && styles.verseNumberTextHighlighted]}>
          {verse.verse_number}
        </Text>
      </View>
      <View style={styles.verseContent}>
        {showArabic && renderArabicWithHighlight()}
        {showTransliteration && verse.transliteration && (
          <Text style={[styles.verseTransliteration, isHighlighted && styles.verseTransliterationHighlighted]}>
            {verse.transliteration}
          </Text>
        )}
        {showTranslation && verse.translation && (
          <Text style={styles.verseTranslation}>{verse.translation}</Text>
        )}
      </View>
    </View>
  );
};

// Web Audio Player Bar
const WebAudioPlayerBar: React.FC<{
  onReciterPress: () => void;
}> = ({ onReciterPress }) => {
  const {
    playbackState,
    currentPosition,
    duration,
    selectedReciter,
    audioFile,
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

  // Get duration from audioFile if context duration is 0 or invalid
  // The audioFile contains verse_timings with timestamp_to for each verse
  const effectiveDuration = useMemo(() => {
    // First try the duration from context
    if (duration && duration > 0 && isFinite(duration)) {
      return duration;
    }
    // Fallback: calculate from audioFile's verse_timings
    if (audioFile?.verse_timings && audioFile.verse_timings.length > 0) {
      const lastTiming = audioFile.verse_timings[audioFile.verse_timings.length - 1];
      if (lastTiming?.timestamp_to && lastTiming.timestamp_to > 0) {
        return lastTiming.timestamp_to;
      }
    }
    return 0;
  }, [duration, audioFile]);

  const isLoading = playbackState === 'loading';
  const isPlaying = playbackState === 'playing';
  const isDisabled = playbackState === 'idle' || playbackState === 'error';
  const progress = effectiveDuration > 0 ? (currentPosition / effectiveDuration) * 100 : 0;

  const playButtonHover = useWebHover({
    hoverStyle: {
      transform: 'scale(1.1)',
      boxShadow: '0 8px 24px rgba(27, 67, 50, 0.3)',
    },
    transition: 'all 0.2s ease-out',
  });

  return (
    <View style={styles.audioPlayerBar}>
      {/* Progress bar */}
      <View style={styles.audioProgressContainer}>
        <View style={[styles.audioProgressFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.audioPlayerContent}>
        {/* Time display */}
        <View style={styles.audioTimeContainer}>
          <Text style={styles.audioTimeText}>{formatTime(currentPosition)}</Text>
          <Text style={styles.audioTimeSeparator}>/</Text>
          <Text style={styles.audioTimeText}>{formatTime(effectiveDuration)}</Text>
        </View>

        {/* Play/Pause button */}
        <TouchableOpacity
          onPress={handlePlayPause}
          disabled={isDisabled || isLoading}
          activeOpacity={0.9}
          // @ts-ignore
          onMouseEnter={playButtonHover.handlers.onMouseEnter}
          onMouseLeave={playButtonHover.handlers.onMouseLeave}
          style={[
            styles.audioPlayButton,
            isDisabled && styles.audioPlayButtonDisabled,
            playButtonHover.style,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.text.white} />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={22}
              color={colors.text.white}
              style={!isPlaying ? { marginLeft: 3 } : undefined}
            />
          )}
        </TouchableOpacity>

        {/* Reciter selector */}
        <TouchableOpacity
          style={styles.audioReciterButton}
          onPress={onReciterPress}
          activeOpacity={0.8}
        >
          <View style={styles.audioReciterInfo}>
            <Text style={styles.audioReciterLabel}>Reciter</Text>
            <Text style={styles.audioReciterName} numberOfLines={1}>
              {selectedReciter?.name ?? 'Select Reciter'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Reciter Selection Modal
const ReciterModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  reciters: NormalizedReciter[];
  selectedReciter: NormalizedReciter | null;
  onSelect: (reciter: NormalizedReciter) => void;
  isLoading: boolean;
}> = ({ visible, onClose, reciters, selectedReciter, onSelect, isLoading }) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Reciter</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {reciters.map((reciter) => {
                const isSelected = selectedReciter?.id === reciter.id;
                return (
                  <TouchableOpacity
                    key={reciter.id}
                    style={[styles.reciterItem, isSelected && styles.reciterItemSelected]}
                    onPress={() => {
                      onSelect(reciter);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.reciterItemContent}>
                      <Text style={[styles.reciterItemName, isSelected && styles.reciterItemNameSelected]}>
                        {reciter.name}
                      </Text>
                      {reciter.arabic_name ? (
                        <Text style={styles.reciterItemArabic}>{reciter.arabic_name}</Text>
                      ) : null}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

// Verse Range Sidebar - for selecting verse range and loop settings
const VerseRangeSidebar: React.FC<{
  visible: boolean;
  onClose: () => void;
  totalVerses: number;
  chapterId: number;
}> = ({ visible, onClose, totalVerses, chapterId }) => {
  const {
    verseRange,
    setVerseRange,
    clearVerseRange,
    loopSettings,
    setLoopSettings,
    clearLoopSettings,
    seekTo,
    audioFile,
  } = useAudioPlayer();

  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');
  const [loopCountInput, setLoopCountInput] = useState('');
  const [isInfiniteLoop, setIsInfiniteLoop] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize inputs from current settings
  useEffect(() => {
    if (visible) {
      setStartInput(verseRange.startVerse?.toString() ?? '');
      setEndInput(verseRange.endVerse?.toString() ?? '');
      setLoopCountInput(loopSettings.loopCount?.toString() ?? '');
      setIsInfiniteLoop(loopSettings.isInfiniteLoop);
      setError(null);
    }
  }, [visible, verseRange.startVerse, verseRange.endVerse, loopSettings.loopCount, loopSettings.isInfiniteLoop]);

  const validateAndApply = () => {
    setError(null);

    const start = startInput.trim() === '' ? null : parseInt(startInput, 10);
    const end = endInput.trim() === '' ? null : parseInt(endInput, 10);
    const loopCount = loopCountInput.trim() === '' ? null : parseInt(loopCountInput, 10);

    // Verse range validation
    if (start !== null) {
      if (isNaN(start) || start < 1 || start > totalVerses) {
        setError(`Start verse must be between 1 and ${totalVerses}`);
        return;
      }
    }

    if (end !== null) {
      if (isNaN(end) || end < 1 || end > totalVerses) {
        setError(`End verse must be between 1 and ${totalVerses}`);
        return;
      }
    }

    if (start !== null && end !== null && start > end) {
      setError('Start verse cannot be greater than end verse');
      return;
    }

    // Loop count validation
    if (loopCount !== null && !isInfiniteLoop) {
      if (isNaN(loopCount) || loopCount < 1) {
        setError('Loop count must be at least 1');
        return;
      }
      if (loopCount > 100) {
        setError('Loop count cannot exceed 100');
        return;
      }
    }

    // Apply the verse range
    setVerseRange(start, end);

    // Apply loop settings
    if (isInfiniteLoop) {
      setLoopSettings(null, true);
    } else if (loopCount !== null && loopCount > 1) {
      setLoopSettings(loopCount, false);
    } else {
      clearLoopSettings();
    }

    // If we have a start verse, seek to it
    if (start !== null && audioFile?.verse_timings) {
      if (start > 1) {
        const prevVerseKey = `${chapterId}:${start - 1}`;
        const prevTiming = audioFile.verse_timings.find((t) => t.verse_key === prevVerseKey);
        if (prevTiming) {
          seekTo(prevTiming.timestamp_to + 250);
        }
      } else {
        const verseKey = `${chapterId}:${start}`;
        const timing = audioFile.verse_timings.find((t) => t.verse_key === verseKey);
        if (timing) {
          seekTo(timing.timestamp_from);
        }
      }
    }

    onClose();
  };

  const handleReset = () => {
    clearVerseRange();
    clearLoopSettings();
    setStartInput('');
    setEndInput('');
    setLoopCountInput('');
    setIsInfiniteLoop(false);
    setError(null);
    seekTo(0);
    onClose();
  };

  const hasRange = verseRange.startVerse !== null || verseRange.endVerse !== null;
  const hasLooping = loopSettings.isInfiniteLoop || (loopSettings.loopCount !== null && loopSettings.loopCount > 1);
  const hasCustomSettings = hasRange || hasLooping;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.sidebarOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sidebarContent}>
          {/* Header */}
          <View style={styles.sidebarHeader}>
            <View style={styles.sidebarTitleRow}>
              <Ionicons name="settings-outline" size={24} color={colors.primary} />
              <Text style={styles.sidebarTitle}>Playback Settings</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.sidebarCloseButton}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
            {/* Current Settings Display */}
            {hasCustomSettings && (
              <View style={styles.currentSettingsCard}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <View style={styles.currentSettingsContent}>
                  <Text style={styles.currentSettingsLabel}>Active Settings</Text>
                  {hasRange && (
                    <Text style={styles.currentSettingsText}>
                      Verses {verseRange.startVerse ?? 1} - {verseRange.endVerse ?? totalVerses}
                    </Text>
                  )}
                  {hasLooping && (
                    <Text style={styles.currentSettingsText}>
                      {loopSettings.isInfiniteLoop
                        ? '∞ Infinite loop'
                        : `🔁 Loop ${loopSettings.loopCount}x (${loopSettings.currentIteration}/${loopSettings.loopCount})`}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Verse Range Section */}
            <View style={styles.sidebarSection}>
              <Text style={styles.sectionTitle}>Verse Range</Text>
              <Text style={styles.sectionDescription}>
                Select start and end verses to play a specific portion of this chapter.
              </Text>

              <View style={styles.inputsRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Start Verse</Text>
                  <TextInput
                    style={styles.verseInput}
                    placeholder="1"
                    placeholderTextColor={colors.text.disabled}
                    value={startInput}
                    onChangeText={setStartInput}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>

                <View style={styles.inputDivider}>
                  <Ionicons name="arrow-forward" size={20} color={colors.text.tertiary} />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>End Verse</Text>
                  <TextInput
                    style={styles.verseInput}
                    placeholder={`${totalVerses}`}
                    placeholderTextColor={colors.text.disabled}
                    value={endInput}
                    onChangeText={setEndInput}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>
              </View>

              <Text style={styles.verseHint}>
                This chapter has {totalVerses} verses
              </Text>
            </View>

            {/* Loop Section */}
            <View style={styles.sidebarSection}>
              <Text style={styles.sectionTitle}>Looping</Text>
              <Text style={styles.sectionDescription}>
                Repeat the recitation multiple times or continuously.
              </Text>

              {/* Infinite Loop Toggle */}
              <View style={[styles.toggleRow, isInfiniteLoop && styles.toggleRowActive]}>
                <View style={styles.toggleInfo}>
                  <Ionicons
                    name="infinite"
                    size={22}
                    color={isInfiniteLoop ? colors.primary : colors.text.secondary}
                  />
                  <Text style={[styles.toggleLabel, isInfiniteLoop && styles.toggleLabelActive]}>
                    Loop Infinitely
                  </Text>
                </View>
                <Switch
                  value={isInfiniteLoop}
                  onValueChange={(value) => {
                    setIsInfiniteLoop(value);
                    if (value) {
                      setLoopCountInput('');
                    }
                  }}
                  trackColor={{ false: '#D1D5DB', true: `${colors.primary}80` }}
                  thumbColor={isInfiniteLoop ? colors.primary : '#FFFFFF'}
                />
              </View>

              {/* Loop Count Input */}
              {!isInfiniteLoop && (
                <View style={styles.loopCountContainer}>
                  <Text style={styles.inputLabel}>Number of Loops</Text>
                  <View style={styles.loopCountRow}>
                    <TextInput
                      style={[styles.verseInput, styles.loopInput]}
                      placeholder="1"
                      placeholderTextColor={colors.text.disabled}
                      value={loopCountInput}
                      onChangeText={setLoopCountInput}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                    <Text style={styles.loopHint}>
                      {loopCountInput && parseInt(loopCountInput, 10) > 1
                        ? `Will play ${loopCountInput} times`
                        : 'Leave empty for no loop'}
                    </Text>
                  </View>
                </View>
              )}

              {isInfiniteLoop && (
                <Text style={styles.infiniteHint}>
                  Playback will continue until you pause or reset settings.
                </Text>
              )}
            </View>

            {/* Error message */}
            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={styles.errorBoxText}>{error}</Text>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.sidebarButtons}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={validateAndApply}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark" size={20} color={colors.text.white} />
                <Text style={styles.applyButtonText}>Apply Settings</Text>
              </TouchableOpacity>

              {hasCustomSettings && (
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleReset}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={18} color={colors.primary} />
                  <Text style={styles.resetButtonText}>Reset All</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export const WebQuranContent: React.FC<WebQuranContentProps> = ({
  subScreen,
  subScreenData,
  onSubNavigate,
  onBack,
}) => {
  const { width } = useWindowDimensions();
  const isWide = width >= 1200;
  const [showReciterModal, setShowReciterModal] = useState(false);
  const [showVerseRangeSidebar, setShowVerseRangeSidebar] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  // Refs for auto-scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  const verseRefs = useRef<Map<string, View>>(new Map());
  const lastHighlightedVerseKey = useRef<string | null>(null);

  // Audio player context
  const {
    playbackState,
    highlightState,
    reciters,
    selectedReciter,
    isLoadingReciters,
    loadChapter,
    selectReciter,
    reset,
    resetPlaybackSettings,
  } = useAudioPlayer();

  const chaptersQuery = useQuery({
    queryKey: ['quranChapters'],
    queryFn: quranService.getChapters,
  });

  // Use infinite query for verses with pagination
  const versesQuery = useInfiniteQuery({
    queryKey: ['quranVersesByChapter', subScreenData?.chapterId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      quranService.getVersesByChapter({
        chapterId: subScreenData?.chapterId,
        page: pageParam,
        perPage: PER_PAGE,
      }),
    getNextPageParam: (lastPage) => lastPage.pagination.next_page ?? undefined,
    enabled: !!subScreenData?.chapterId,
  });

  // Transform and flatten verses from all pages
  const verses: TransformedVerse[] = useMemo(() => {
    return versesQuery.data?.pages
      .flatMap((page) => page.verses)
      .map(transformVerse) ?? [];
  }, [versesQuery.data?.pages]);

  // Get total verses count from pagination
  const totalVerses = useMemo(() => {
    return versesQuery.data?.pages[0]?.pagination.total_records ?? 0;
  }, [versesQuery.data?.pages]);

  // Load chapter audio when viewing a chapter
  useEffect(() => {
    if (subScreen === 'chapter' && subScreenData?.chapterId && selectedReciter) {
      loadChapter(subScreenData.chapterId);
    }
  }, [subScreen, subScreenData?.chapterId, selectedReciter?.id, loadChapter]);

  // Reset audio when leaving chapter view
  useEffect(() => {
    if (subScreen !== 'chapter') {
      reset();
      resetPlaybackSettings();
    }
  }, [subScreen, reset, resetPlaybackSettings]);

  // Auto-scroll to highlighted verse
  useEffect(() => {
    const verseKey = highlightState.verseKey;

    // Only scroll if we have a new verse to highlight and we're playing
    if (!verseKey || verseKey === lastHighlightedVerseKey.current || playbackState !== 'playing') {
      return;
    }

    lastHighlightedVerseKey.current = verseKey;

    // Use web-specific scrolling
    const verseElement = verseRefs.current.get(verseKey);
    if (verseElement) {
      // @ts-ignore - web specific
      const element = verseElement as unknown as HTMLElement;
      if (element && element.scrollIntoView) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [highlightState.verseKey, playbackState]);

  // Get highlight status for a verse
  const getVerseHighlightStatus = useCallback(
    (verseKey: string): 'none' | 'current' | 'completed' => {
      if (playbackState === 'idle' || playbackState === 'error') {
        return 'none';
      }
      if (highlightState.completedVerseKeys.has(verseKey)) {
        return 'completed';
      }
      if (highlightState.verseKey === verseKey) {
        return 'current';
      }
      return 'none';
    },
    [playbackState, highlightState]
  );

  // Get highlighted word position for a verse
  const getVerseHighlightedWordPosition = useCallback(
    (verseKey: string): number | null => {
      if (highlightState.verseKey === verseKey) {
        return highlightState.wordPosition;
      }
      return null;
    },
    [highlightState]
  );

  // Handle back with audio cleanup
  const handleBack = useCallback(() => {
    reset();
    resetPlaybackSettings();
    onBack();
  }, [reset, resetPlaybackSettings, onBack]);

  // Render chapter verses
  if (subScreen === 'chapter' && subScreenData) {
    return (
      <View style={styles.chapterContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back button and settings button row */}
          <View style={styles.chapterTopBar}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={styles.backButtonText}>Back to Chapters</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setShowVerseRangeSidebar(true)}
              style={styles.settingsButton}
            >
              <Ionicons name="menu" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.chapterHeader}>
            <LinearGradient
              colors={['#1B4332', '#2D6A4F']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.chapterHeaderPattern} />
            <View style={styles.chapterHeaderContent}>
              {viewMode !== 'english' && (
                <Text style={styles.chapterHeaderArabic}>{subScreenData.chapterArabicName}</Text>
              )}
              <Text style={styles.chapterHeaderName}>{subScreenData.chapterName}</Text>
              {viewMode !== 'english' && (
                <Text style={styles.chapterHeaderBismillah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
              )}
            </View>
          </View>

          {/* View Mode Toggle */}
          <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />

          {versesQuery.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading verses...</Text>
            </View>
          ) : versesQuery.isError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
              <Text style={styles.errorTitle}>Failed to load verses</Text>
              <Text style={styles.errorText}>
                {(versesQuery.error as Error)?.message || 'Please try again'}
              </Text>
            </View>
          ) : (
            <View style={styles.versesContainer}>
              {verses.map((verse, index) => {
                const verseKey = `${subScreenData.chapterId}:${verse.verse_number}`;
                return (
                  <View
                    key={verse.id}
                    ref={(ref) => {
                      if (ref) {
                        verseRefs.current.set(verseKey, ref);
                      }
                    }}
                  >
                    <VerseCard
                      verse={verse}
                      index={index}
                      highlightStatus={getVerseHighlightStatus(verseKey)}
                      highlightedWordPosition={getVerseHighlightedWordPosition(verseKey)}
                      viewMode={viewMode}
                    />
                  </View>
                );
              })}
              
              {/* Load More Button */}
              {versesQuery.hasNextPage && (
                <TouchableOpacity
                  onPress={() => versesQuery.fetchNextPage()}
                  disabled={versesQuery.isFetchingNextPage}
                  style={styles.loadMoreButton}
                >
                  {versesQuery.isFetchingNextPage ? (
                    <>
                      <ActivityIndicator size="small" color={colors.text.white} />
                      <Text style={styles.loadMoreText}>Loading...</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.loadMoreText}>Load More Verses</Text>
                      <Ionicons name="chevron-down" size={18} color={colors.text.white} />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>

        {/* Audio Player Bar */}
        <WebAudioPlayerBar onReciterPress={() => setShowReciterModal(true)} />

        {/* Reciter Selection Modal */}
        <ReciterModal
          visible={showReciterModal}
          onClose={() => setShowReciterModal(false)}
          reciters={reciters}
          selectedReciter={selectedReciter}
          onSelect={selectReciter}
          isLoading={isLoadingReciters}
        />

        {/* Verse Range Sidebar */}
        <VerseRangeSidebar
          visible={showVerseRangeSidebar}
          onClose={() => setShowVerseRangeSidebar(false)}
          totalVerses={totalVerses}
          chapterId={subScreenData.chapterId}
        />
      </View>
    );
  }

  // Render chapters list
  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderIcon}>
          <Ionicons name="book" size={32} color={colors.accent} />
        </View>
        <Text style={styles.pageTitle}>The Holy Quran</Text>
        <Text style={styles.pageSubtitle}>
          Explore all 114 surahs with Arabic text, transliteration, and translations
        </Text>
      </View>

      {chaptersQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading chapters...</Text>
        </View>
      ) : chaptersQuery.isError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Failed to load chapters</Text>
          <Text style={styles.errorText}>Please try again later</Text>
        </View>
      ) : (
        <View style={[styles.chaptersGrid, isWide && styles.chaptersGridWide]}>
          {chaptersQuery.data?.map((chapter, index) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              index={index}
              onPress={() => onSubNavigate('chapter', {
                chapterId: chapter.id,
                chapterName: chapter.name_simple,
                chapterArabicName: chapter.name_arabic,
              })}
            />
          ))}
        </View>
      )}
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
    marginBottom: 12,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
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
  chaptersGrid: {
    gap: 16,
  },
  chaptersGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    // @ts-ignore
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
    cursor: 'pointer',
    // @ts-ignore
    flex: '0 0 calc(50% - 8px)',
    minWidth: 300,
  },
  chapterNumber: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  chapterNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  chapterInfo: {
    flex: 1,
  },
  chapterName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  chapterMeaning: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 4,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  chapterMeta: {
    fontSize: 12,
    color: colors.text.tertiary,
    textTransform: 'capitalize',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  chapterArabic: {
    marginRight: 12,
  },
  chapterArabicText: {
    fontSize: 24,
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    backgroundColor: `${colors.primary}10`,
    gap: 8,
    // @ts-ignore
    cursor: 'pointer',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  chapterHeader: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 32,
    position: 'relative',
  },
  chapterHeaderPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    // @ts-ignore
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,
    backgroundSize: '60px 60px',
  },
  chapterHeaderContent: {
    padding: 48,
    alignItems: 'center',
  },
  chapterHeaderArabic: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 12,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  chapterHeaderName: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.white,
    marginBottom: 16,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  chapterHeaderBismillah: {
    fontSize: 22,
    color: 'rgba(255, 255, 255, 0.8)',
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  versesContainer: {
    gap: 16,
  },
  verseCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    // @ts-ignore
    transition: 'all 0.2s ease-out',
  },
  verseNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  verseNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  verseContent: {
    flex: 1,
  },
  verseArabic: {
    fontSize: 28,
    color: colors.text.primary,
    textAlign: 'right',
    marginBottom: 16,
    lineHeight: 48,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
    direction: 'rtl',
  },
  verseTransliteration: {
    fontSize: 15,
    color: colors.primary,
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 24,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  verseTranslation: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 26,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  // View Mode Toggle styles
  viewModeContainer: {
    marginBottom: 24,
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 4,
    // @ts-ignore
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
  },
  viewModeButtonActive: {
    backgroundColor: colors.primary,
    // @ts-ignore
    boxShadow: '0 4px 12px rgba(27, 67, 50, 0.25)',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  viewModeTextActive: {
    color: colors.text.white,
  },
  viewModeArabicText: {
    fontSize: 16,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  // View mode specific verse styles
  verseCardArabicOnly: {
    paddingVertical: 32,
  },
  verseCardEnglishOnly: {
    paddingVertical: 20,
  },
  verseArabicOnly: {
    fontSize: 34,
    lineHeight: 58,
  },
  verseTranslationOnly: {
    fontSize: 18,
    lineHeight: 32,
    color: colors.text.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  verseTranslationHighlighted: {
    color: '#047857',
    fontWeight: '500',
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
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  errorText: {
    fontSize: 14,
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 8,
    // @ts-ignore
    cursor: 'pointer',
  },
  loadMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.white,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  // Chapter container for fixed audio bar
  chapterContainer: {
    flex: 1,
    position: 'relative',
  },
  // Verse highlighting styles - BRIGHT and OBVIOUS
  verseCardHighlighted: {
    borderColor: '#10B981',
    borderWidth: 3,
    backgroundColor: '#D1FAE5',
    // @ts-ignore
    boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.25), 0 8px 32px rgba(16, 185, 129, 0.2)',
    position: 'relative',
    transform: [{ scale: 1.01 }],
  },
  verseCardCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 2,
  },
  verseNumberHighlighted: {
    backgroundColor: '#10B981',
    // @ts-ignore
    boxShadow: '0 0 12px rgba(16, 185, 129, 0.5)',
  },
  verseNumberTextHighlighted: {
    color: colors.text.white,
    fontWeight: '800',
  },
  verseArabicHighlighted: {
    color: '#047857',
  },
  // Audio Player Bar styles
  audioPlayerBar: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    // @ts-ignore
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
  },
  audioProgressContainer: {
    height: 4,
    backgroundColor: colors.border,
  },
  audioProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    // @ts-ignore
    transition: 'width 0.1s linear',
  },
  audioPlayerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 20,
  },
  audioTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
  },
  audioTimeText: {
    fontSize: 14,
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
    fontVariant: ['tabular-nums'],
  },
  audioTimeSeparator: {
    fontSize: 14,
    color: colors.text.disabled,
    marginHorizontal: 4,
  },
  audioPlayButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    boxShadow: '0 4px 16px rgba(27, 67, 50, 0.25)',
    cursor: 'pointer',
  },
  audioPlayButtonDisabled: {
    backgroundColor: colors.text.disabled,
    // @ts-ignore
    boxShadow: 'none',
  },
  audioReciterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    // @ts-ignore
    cursor: 'pointer',
    maxWidth: 400,
  },
  audioReciterInfo: {
    flex: 1,
  },
  audioReciterLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  audioReciterName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 24,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    // @ts-ignore
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    cursor: 'pointer',
  },
  modalLoading: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  reciterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    // @ts-ignore
    cursor: 'pointer',
  },
  reciterItemSelected: {
    backgroundColor: `${colors.primary}08`,
  },
  reciterItemContent: {
    flex: 1,
  },
  reciterItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  reciterItemNameSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
  reciterItemArabic: {
    fontSize: 14,
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  // Top bar with back and settings
  chapterTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
  },
  // Enhanced verse highlighting - brighter and more obvious
  highlightedWord: {
    backgroundColor: '#10B981',
    color: colors.text.white,
    borderRadius: 4,
    // @ts-ignore
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  verseTransliterationHighlighted: {
    color: '#059669',
    fontWeight: '600',
  },
  // Playing indicator animation
  playingIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 3,
  },
  playingDot: {
    width: 4,
    height: 12,
    backgroundColor: '#10B981',
    borderRadius: 2,
    // @ts-ignore
    animation: 'audioWave 0.8s ease-in-out infinite',
  },
  playingDot2: {
    // @ts-ignore
    animationDelay: '0.2s',
  },
  playingDot3: {
    // @ts-ignore
    animationDelay: '0.4s',
  },
  // Sidebar styles
  sidebarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    // @ts-ignore
    backdropFilter: 'blur(4px)',
  },
  sidebarContent: {
    backgroundColor: colors.background,
    width: 400,
    maxWidth: '90%',
    height: '100%',
    // @ts-ignore
    boxShadow: '-8px 0 40px rgba(0, 0, 0, 0.15)',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sidebarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sidebarTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text.primary,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  sidebarCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    cursor: 'pointer',
  },
  sidebarScroll: {
    flex: 1,
    padding: 24,
  },
  sidebarSection: {
    marginBottom: 28,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 20,
    lineHeight: 22,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  currentSettingsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  currentSettingsContent: {
    flex: 1,
  },
  currentSettingsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  currentSettingsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#047857',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  verseInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
  },
  inputDivider: {
    paddingBottom: 16,
  },
  verseHint: {
    fontSize: 13,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 12,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleRowActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  toggleLabelActive: {
    color: '#047857',
    fontWeight: '600',
  },
  loopCountContainer: {
    marginTop: 8,
  },
  loopCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  loopInput: {
    width: 80,
  },
  loopHint: {
    fontSize: 13,
    color: colors.text.tertiary,
    flex: 1,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  infiniteHint: {
    fontSize: 13,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBoxText: {
    fontSize: 14,
    color: '#DC2626',
    flex: 1,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  sidebarButtons: {
    gap: 12,
    paddingBottom: 24,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 10,
    // @ts-ignore
    boxShadow: '0 4px 16px rgba(27, 67, 50, 0.25)',
    cursor: 'pointer',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.white,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
    // @ts-ignore
    cursor: 'pointer',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
});
