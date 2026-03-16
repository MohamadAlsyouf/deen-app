/**
 * WebQuranContent - Quran chapters and verses with luxury styling
 * Includes audio player, reciter selection, verse highlighting, auto-scroll, view mode toggle, and verse range/loop settings
 */

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { colors } from "@/theme";
import { useWebHover } from "@/hooks/useWebHover";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { quranService } from "@/services/quranService";
import type {
  QuranChapter,
  QuranVerse,
  NormalizedReciter,
} from "@/types/quran";
import {
  buildQuranReadPages,
  type QuranReadPage,
} from "@/utils/quranReadPagination";

const PER_PAGE = 50;

// View mode type
type ViewMode = "all" | "arabic" | "english";
type QuranMode = "listen" | "read";

// Strip HTML tags from translation text (e.g., <sup foot_note=123>1</sup>)
const stripHtmlTags = (text: string): string => {
  if (!text) return "";
  // Remove all HTML tags including their content for sup tags
  return text
    .replace(/<sup[^>]*>.*?<\/sup>/gi, "") // Remove <sup>...</sup> entirely
    .replace(/<[^>]+>/g, "") // Remove any other HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
};

// Transform QuranVerse to include transliteration and translation as direct properties
type TransformedVerse = QuranVerse & {
  transliteration?: string;
  translation?: string;
};

type ReadPageItem = QuranReadPage & {
  verse: TransformedVerse;
};

const transformVerse = (verse: QuranVerse): TransformedVerse => {
  // Extract transliteration from words
  const transliteration =
    verse.words
      ?.filter((w) => w.char_type_name !== "end")
      ?.map((w) => w.transliteration?.text)
      ?.filter(Boolean)
      ?.join(" ") || "";

  // Extract translation from translations array and strip HTML tags
  const rawTranslation = verse.translations?.[0]?.text || "";
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
      transform: "translateY(-4px)",
      boxShadow: "0 12px 32px rgba(27, 67, 50, 0.15)",
    },
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
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
        <Text style={styles.chapterMeaning}>
          {chapter.translated_name?.name}
        </Text>
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
    return "0:00";
  }
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

// View Mode Toggle Component
const ViewModeToggle: React.FC<{
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}> = ({ viewMode, onViewModeChange }) => {
  const modes: { key: ViewMode; label: string }[] = [
    { key: "all", label: "All" },
    { key: "arabic", label: "عربي" },
    { key: "english", label: "English" },
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
                  mode.key === "arabic" && styles.viewModeArabicText,
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
  verseKey: string;
  index: number;
  highlightStatus?: "none" | "current" | "completed";
  highlightedWordPosition?: number | null;
  viewMode?: ViewMode;
  isBookmarked?: boolean;
  onBookmarkPress?: () => void;
}> = ({
  verse,
  verseKey,
  index,
  highlightStatus = "none",
  highlightedWordPosition,
  viewMode = "all",
  isBookmarked = false,
  onBookmarkPress,
}) => {
  const hover = useWebHover({
    hoverStyle: {
      backgroundColor: highlightStatus === "current" ? "#D4EDDA" : "#FAFBFA",
      borderColor: colors.primary,
    },
    transition: "all 0.2s ease-out",
  });

  const isHighlighted = highlightStatus === "current";
  const isCompleted = highlightStatus === "completed";

  // Determine what to show based on view mode
  const showArabic = viewMode === "all" || viewMode === "arabic";
  const showTransliteration = viewMode === "all";
  const showTranslation = viewMode === "all" || viewMode === "english";

  // Render Arabic text with word-level highlighting
  const renderArabicWithHighlight = () => {
    const arabicStyle = [
      styles.verseArabic,
      isHighlighted && styles.verseArabicHighlighted,
      viewMode === "arabic" && styles.verseArabicOnly,
    ];

    if (
      !isHighlighted ||
      !verse.words ||
      highlightedWordPosition === null ||
      highlightedWordPosition === undefined
    ) {
      return <Text style={arabicStyle}>{verse.text_uthmani}</Text>;
    }

    // Filter out end markers and render words with highlighting
    const wordsToRender = verse.words.filter((w) => w.char_type_name !== "end");

    return (
      <Text style={arabicStyle}>
        {wordsToRender.map((word, idx) => {
          const isCurrentWord = word.position === highlightedWordPosition;
          return (
            <Text
              key={word.id || idx}
              style={isCurrentWord ? styles.highlightedWord : undefined}
            >
              {word.text_uthmani}{" "}
            </Text>
          );
        })}
      </Text>
    );
  };

  // English-only mode renders differently
  if (viewMode === "english") {
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
        <View style={styles.verseLeftColumn}>
          <View
            style={[
              styles.verseNumber,
              isHighlighted && styles.verseNumberHighlighted,
            ]}
          >
            <Text
              style={[
                styles.verseNumberText,
                isHighlighted && styles.verseNumberTextHighlighted,
              ]}
            >
              {verse.verse_number}
            </Text>
          </View>
        </View>
        <View style={styles.verseContent}>
          <View style={styles.verseHeaderRow}>
            <Text style={styles.verseKeyText}>{verseKey}</Text>
            {onBookmarkPress ? (
              <TouchableOpacity
                onPress={onBookmarkPress}
                activeOpacity={0.8}
                style={styles.verseBookmarkButton}
              >
                <Ionicons
                  name={isBookmarked ? "bookmark" : "bookmark-outline"}
                  size={18}
                  color={isBookmarked ? colors.accent : colors.text.tertiary}
                />
              </TouchableOpacity>
            ) : null}
          </View>
          {verse.translation && (
            <Text
              style={[
                styles.verseTranslationOnly,
                isHighlighted && styles.verseTranslationHighlighted,
              ]}
            >
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
        viewMode === "arabic" && styles.verseCardArabicOnly,
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
      <View style={styles.verseLeftColumn}>
        <View
          style={[
            styles.verseNumber,
            isHighlighted && styles.verseNumberHighlighted,
          ]}
        >
          <Text
            style={[
              styles.verseNumberText,
              isHighlighted && styles.verseNumberTextHighlighted,
            ]}
          >
            {verse.verse_number}
          </Text>
        </View>
        {onBookmarkPress ? (
          <TouchableOpacity
            onPress={onBookmarkPress}
            activeOpacity={0.8}
            style={styles.verseBookmarkButton}
          >
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={18}
              color={isBookmarked ? colors.accent : colors.text.tertiary}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.verseContent}>
        <View style={styles.verseHeaderRow}>
          <Text style={styles.verseKeyText}>{verseKey}</Text>
        </View>
        {showArabic && renderArabicWithHighlight()}
        {showTransliteration && verse.transliteration && (
          <Text
            style={[
              styles.verseTransliteration,
              isHighlighted && styles.verseTransliterationHighlighted,
            ]}
          >
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

const ReadVerseCard: React.FC<{
  page: ReadPageItem;
  viewMode: ViewMode;
  pageHeight?: number;
  isBookmarked: boolean;
  onBookmarkPress: () => void;
}> = ({ page, viewMode, pageHeight, isBookmarked, onBookmarkPress }) => {
  const showArabic = viewMode === "all" || viewMode === "arabic";
  const showTranslation = viewMode === "all" || viewMode === "english";

  return (
    <View
      style={[
        styles.readVersePage,
        pageHeight
          ? {
              minHeight: pageHeight,
              height: pageHeight,
            }
          : null,
      ]}
    >
      <View style={styles.readVerseCard}>
        <View style={styles.readVerseTopRow}>
          <View
            style={[
              styles.readVerseBadge,
              page.continuationIndex > 0 && styles.readVerseBadgeWide,
            ]}
          >
            <Text
              style={[
                styles.readVerseBadgeText,
                page.continuationIndex > 0 &&
                  styles.readVerseBadgeContinuationText,
              ]}
            >
              {page.badgeLabel}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onBookmarkPress}
            activeOpacity={0.8}
            style={styles.readVerseBookmarkButton}
          >
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={20}
              color={isBookmarked ? colors.accent : colors.text.tertiary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.readVerseContent}>
          {showArabic && page.arabicText ? (
            <Text
              style={[
                styles.readVerseArabic,
                viewMode === "arabic" && styles.readVerseArabicOnly,
              ]}
            >
              {page.arabicText}
            </Text>
          ) : null}

          {showTranslation && page.translationText ? (
            <Text
              style={[
                styles.readVerseTranslation,
                viewMode === "english" && styles.readVerseTranslationOnly,
              ]}
            >
              {page.translationText}
            </Text>
          ) : null}
        </View>

        <Text style={styles.readVerseKey}>
          {page.verseKey}
          {page.continuationCount > 1
            ? ` • ${page.continuationIndex + 1}/${page.continuationCount}`
            : ""}
        </Text>
      </View>
    </View>
  );
};

// Web Audio Player Bar
const WebAudioPlayerBar: React.FC<{
  onSkipToStart: () => void;
  onSkipToEnd: () => void;
  onPreviousChapter: () => void;
  onNextChapter: () => void;
  isChapterTransitioning?: boolean;
}> = ({
  onSkipToStart,
  onSkipToEnd,
  onPreviousChapter,
  onNextChapter,
  isChapterTransitioning = false,
}) => {
  const {
    playbackState,
    currentPosition,
    duration,
    audioFile,
    play,
    pause,
    seekTo,
  } = useAudioPlayer();

  const lastSkipToStartTime = useRef<number>(0);

  // Get duration from audioFile if context duration is 0 or invalid
  // Moved above handlers so they can use effectiveDuration
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

  const handleSkipToStart = useCallback(() => {
    const now = Date.now();
    if (now - lastSkipToStartTime.current < 2000) {
      // Double click within 2 seconds - go to previous chapter
      onPreviousChapter();
    } else {
      // Single click - go to start
      onSkipToStart();
    }
    lastSkipToStartTime.current = now;
  }, [onSkipToStart, onPreviousChapter]);

  const isLoading = playbackState === "loading" && !isChapterTransitioning;
  const isPlaying = playbackState === "playing";
  const isDisabled = playbackState === "idle" || playbackState === "error";
  const progress =
    effectiveDuration > 0 ? (currentPosition / effectiveDuration) * 100 : 0;

  const playButtonHover = useWebHover({
    hoverStyle: {
      transform: "scale(1.1)",
      boxShadow: "0 8px 24px rgba(27, 67, 50, 0.3)",
    },
    transition: "all 0.2s ease-out",
  });

  return (
    <View style={styles.audioPlayerBar}>
      {/* Progress bar */}
      <View style={styles.audioProgressContainer}>
        <View style={[styles.audioProgressFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.audioPlayerContent}>
        {/* Time display - left side */}
        <View style={styles.audioTimeContainer}>
          <Text style={styles.audioTimeText}>
            {formatTime(currentPosition)}
          </Text>
          <Text style={styles.audioTimeSeparator}>/</Text>
          <Text style={styles.audioTimeText}>
            {formatTime(effectiveDuration)}
          </Text>
        </View>

        {/* Center controls */}
        <View style={styles.audioControlsCenter}>
          {/* Skip to start / Previous chapter */}
          <TouchableOpacity
            onPress={handleSkipToStart}
            disabled={isDisabled}
            style={[
              styles.audioControlButton,
              isDisabled && styles.audioControlButtonDisabled,
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="play-skip-back"
              size={20}
              color={isDisabled ? colors.text.disabled : colors.primary}
            />
          </TouchableOpacity>

          {/* Rewind 10s */}
          <TouchableOpacity
            onPress={handleRewind}
            disabled={isDisabled}
            style={[
              styles.audioControlButton,
              isDisabled && styles.audioControlButtonDisabled,
            ]}
            activeOpacity={0.7}
          >
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
          </TouchableOpacity>

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
                name={isPlaying ? "pause" : "play"}
                size={24}
                color={colors.text.white}
                style={!isPlaying ? { marginLeft: 3 } : undefined}
              />
            )}
          </TouchableOpacity>

          {/* Fast forward 10s */}
          <TouchableOpacity
            onPress={handleFastForward}
            disabled={isDisabled}
            style={[
              styles.audioControlButton,
              isDisabled && styles.audioControlButtonDisabled,
            ]}
            activeOpacity={0.7}
          >
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
          </TouchableOpacity>

          {/* Skip to end / Next chapter */}
          <TouchableOpacity
            onPress={onNextChapter}
            disabled={isDisabled}
            style={[
              styles.audioControlButton,
              isDisabled && styles.audioControlButtonDisabled,
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="play-skip-forward"
              size={20}
              color={isDisabled ? colors.text.disabled : colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Right side spacer for symmetry */}
        <View style={styles.audioTimeContainer} />
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
            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {reciters.map((reciter) => {
                const isSelected = selectedReciter?.id === reciter.id;
                return (
                  <TouchableOpacity
                    key={reciter.id}
                    style={[
                      styles.reciterItem,
                      isSelected && styles.reciterItemSelected,
                    ]}
                    onPress={() => {
                      onSelect(reciter);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.reciterItemContent}>
                      <Text
                        style={[
                          styles.reciterItemName,
                          isSelected && styles.reciterItemNameSelected,
                        ]}
                      >
                        {reciter.name}
                      </Text>
                      {reciter.arabic_name ? (
                        <Text style={styles.reciterItemArabic}>
                          {reciter.arabic_name}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={colors.primary}
                      />
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

// Verse Range Sidebar - for selecting verse range, loop settings, and reciter
const VerseRangeSidebar: React.FC<{
  visible: boolean;
  onClose: () => void;
  totalVerses: number;
  chapterId: number;
  reciters: NormalizedReciter[];
  selectedReciter: NormalizedReciter | null;
  onSelectReciter: (reciter: NormalizedReciter) => void;
  isLoadingReciters: boolean;
}> = ({
  visible,
  onClose,
  totalVerses,
  chapterId,
  reciters,
  selectedReciter,
  onSelectReciter,
  isLoadingReciters,
}) => {
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
  const [showReciterList, setShowReciterList] = useState(false);
  const sidebarScrollRef = useRef<ScrollView>(null);

  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [loopCountInput, setLoopCountInput] = useState("");
  const [isInfiniteLoop, setIsInfiniteLoop] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEditedField, setLastEditedField] = useState<
    "start" | "end" | null
  >(null);

  // Scroll to bottom of sidebar when inputs are focused
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (sidebarScrollRef.current) {
        // @ts-ignore - web specific
        const element = sidebarScrollRef.current as unknown as HTMLElement;
        if (element?.scrollTo) {
          element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
        } else if (element?.scrollTop !== undefined) {
          element.scrollTop = element.scrollHeight;
        }
      }
    }, 100);
  }, []);

  const normalizeVerseInputs = useCallback(
    (startValueRaw: string, endValueRaw: string) => {
      let nextStartInput = startValueRaw;
      let nextEndInput = endValueRaw;
      let start =
        startValueRaw.trim() === "" ? null : parseInt(startValueRaw, 10);
      let end = endValueRaw.trim() === "" ? null : parseInt(endValueRaw, 10);

      if (start !== null) {
        if (isNaN(start) || start < 1) {
          start = 1;
        } else if (start > totalVerses) {
          start = totalVerses;
        }
        nextStartInput = start.toString();
      }

      if (end !== null) {
        if (isNaN(end) || end < 1) {
          end = 1;
        } else if (end > totalVerses) {
          end = totalVerses;
        }
        nextEndInput = end.toString();
      }

      if (start !== null && end !== null && start > end) {
        if (lastEditedField === "start") {
          start = end;
          nextStartInput = end.toString();
        } else {
          end = start;
          nextEndInput = start.toString();
        }
      }

      return {
        start,
        end,
        nextStartInput,
        nextEndInput,
      };
    },
    [lastEditedField, totalVerses],
  );

  const handleStartBlur = useCallback(() => {
    if (startInput.trim() === "") {
      return;
    }

    const normalized = normalizeVerseInputs(startInput, endInput);
    setStartInput(normalized.nextStartInput);
    setEndInput(normalized.nextEndInput);
  }, [endInput, normalizeVerseInputs, startInput]);

  const handleEndBlur = useCallback(() => {
    if (endInput.trim() === "") {
      return;
    }

    const normalized = normalizeVerseInputs(startInput, endInput);
    setStartInput(normalized.nextStartInput);
    setEndInput(normalized.nextEndInput);
  }, [endInput, normalizeVerseInputs, startInput]);

  const handleStartChange = useCallback((text: string) => {
    setStartInput(text);
    setLastEditedField("start");
  }, []);

  const handleEndChange = useCallback((text: string) => {
    setEndInput(text);
    setLastEditedField("end");
  }, []);

  // Initialize inputs from current settings
  useEffect(() => {
    if (visible) {
      setStartInput(verseRange.startVerse?.toString() ?? "");
      setEndInput(verseRange.endVerse?.toString() ?? "");
      setLoopCountInput(loopSettings.loopCount?.toString() ?? "");
      setIsInfiniteLoop(loopSettings.isInfiniteLoop);
      setError(null);
      setLastEditedField(null);
    }
  }, [
    visible,
    verseRange.startVerse,
    verseRange.endVerse,
    loopSettings.loopCount,
    loopSettings.isInfiniteLoop,
  ]);

  const validateAndApply = () => {
    setError(null);

    const normalized = normalizeVerseInputs(startInput, endInput);
    setStartInput(normalized.nextStartInput);
    setEndInput(normalized.nextEndInput);

    const start = normalized.start;
    const end = normalized.end;
    const loopCount =
      loopCountInput.trim() === "" ? null : parseInt(loopCountInput, 10);

    // Loop count validation
    if (loopCount !== null && !isInfiniteLoop) {
      if (isNaN(loopCount) || loopCount < 1) {
        setError("Loop count must be at least 1");
        return;
      }
      if (loopCount > 100) {
        setError("Loop count cannot exceed 100");
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
        const prevTiming = audioFile.verse_timings.find(
          (t) => t.verse_key === prevVerseKey,
        );
        if (prevTiming) {
          seekTo(prevTiming.timestamp_to + 250);
        }
      } else {
        const verseKey = `${chapterId}:${start}`;
        const timing = audioFile.verse_timings.find(
          (t) => t.verse_key === verseKey,
        );
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
    setStartInput("");
    setEndInput("");
    setLoopCountInput("");
    setIsInfiniteLoop(false);
    setError(null);
    seekTo(0);
    onClose();
  };

  const hasRange =
    verseRange.startVerse !== null || verseRange.endVerse !== null;
  const hasLooping =
    loopSettings.isInfiniteLoop ||
    (loopSettings.loopCount !== null && loopSettings.loopCount > 1);
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
              <Ionicons
                name="settings-outline"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.sidebarTitle}>Playback Settings</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.sidebarCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={sidebarScrollRef}
            style={styles.sidebarScroll}
            showsVerticalScrollIndicator={true}
          >
            {/* Reciter Section */}
            <View style={styles.sidebarSection}>
              <Text style={styles.sectionTitle}>Reciter</Text>
              <Text style={styles.sectionDescription}>
                Choose a Qari to listen to the recitation.
              </Text>

              {isLoadingReciters ? (
                <View style={styles.reciterLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.reciterLoadingText}>
                    Loading reciters...
                  </Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.reciterSelectButton}
                    onPress={() => setShowReciterList(!showReciterList)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.reciterSelectContent}>
                      <Ionicons
                        name="person-circle-outline"
                        size={24}
                        color={colors.primary}
                      />
                      <Text style={styles.reciterSelectName} numberOfLines={1}>
                        {selectedReciter?.name ?? "Select a Reciter"}
                      </Text>
                    </View>
                    <Ionicons
                      name={showReciterList ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={colors.text.secondary}
                    />
                  </TouchableOpacity>

                  {showReciterList && (
                    <ScrollView
                      style={styles.reciterListContainer}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                    >
                      {reciters.map((reciter) => {
                        const isSelected = selectedReciter?.id === reciter.id;
                        return (
                          <TouchableOpacity
                            key={reciter.id}
                            style={[
                              styles.reciterListItem,
                              isSelected && styles.reciterListItemSelected,
                            ]}
                            onPress={() => {
                              onSelectReciter(reciter);
                              setShowReciterList(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.reciterListItemName,
                                isSelected &&
                                  styles.reciterListItemNameSelected,
                              ]}
                            >
                              {reciter.name}
                            </Text>
                            {isSelected && (
                              <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color={colors.primary}
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                </>
              )}
            </View>

            {/* Current Settings Display */}
            {hasCustomSettings && (
              <View style={styles.currentSettingsCard}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.currentSettingsContent}>
                  <Text style={styles.currentSettingsLabel}>
                    Active Settings
                  </Text>
                  {hasRange && (
                    <Text style={styles.currentSettingsText}>
                      Verses {verseRange.startVerse ?? 1} -{" "}
                      {verseRange.endVerse ?? totalVerses}
                    </Text>
                  )}
                  {hasLooping && (
                    <Text style={styles.currentSettingsText}>
                      {loopSettings.isInfiniteLoop
                        ? "∞ Infinite loop"
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
                Select start and end verses to play a specific portion of this
                chapter.
              </Text>

              <View style={styles.inputsRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Start Verse</Text>
                  <TextInput
                    style={styles.verseInput}
                    placeholder="1"
                    placeholderTextColor={colors.text.disabled}
                    value={startInput}
                    onChangeText={handleStartChange}
                    onBlur={handleStartBlur}
                    onFocus={scrollToBottom}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>

                <View style={styles.inputDivider}>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={colors.text.tertiary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>End Verse</Text>
                  <TextInput
                    style={styles.verseInput}
                    placeholder={`${totalVerses}`}
                    placeholderTextColor={colors.text.disabled}
                    value={endInput}
                    onChangeText={handleEndChange}
                    onBlur={handleEndBlur}
                    onFocus={scrollToBottom}
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
              <View
                style={[
                  styles.toggleRow,
                  isInfiniteLoop && styles.toggleRowActive,
                ]}
              >
                <View style={styles.toggleInfo}>
                  <Ionicons
                    name="infinite"
                    size={22}
                    color={
                      isInfiniteLoop ? colors.primary : colors.text.secondary
                    }
                  />
                  <Text
                    style={[
                      styles.toggleLabel,
                      isInfiniteLoop && styles.toggleLabelActive,
                    ]}
                  >
                    Loop Infinitely
                  </Text>
                </View>
                <Switch
                  value={isInfiniteLoop}
                  onValueChange={(value) => {
                    setIsInfiniteLoop(value);
                    if (value) {
                      setLoopCountInput("");
                    }
                  }}
                  trackColor={{ false: "#D1D5DB", true: `${colors.primary}80` }}
                  thumbColor={isInfiniteLoop ? colors.primary : "#FFFFFF"}
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
                      onFocus={scrollToBottom}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                    <Text style={styles.loopHint}>
                      {loopCountInput && parseInt(loopCountInput, 10) > 1
                        ? `Will play ${loopCountInput} times`
                        : "Leave empty for no loop"}
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
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={colors.text.white}
                />
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
  const listenModeHover = useWebHover({
    hoverStyle: {
      boxShadow:
        "0 18px 48px rgba(27, 67, 50, 0.24), 0 0 0 1px rgba(255,255,255,0.08)",
      opacity: 0.92,
    },
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  });
  const readModeHover = useWebHover({
    hoverStyle: {
      boxShadow:
        "0 18px 48px rgba(201, 162, 39, 0.28), 0 0 0 1px rgba(255,255,255,0.08)",
      opacity: 0.92,
    },
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  });
  const [showVerseRangeSidebar, setShowVerseRangeSidebar] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [currentReadVerseIndex, setCurrentReadVerseIndex] = useState(0);
  const [isReadTransitioning, setIsReadTransitioning] = useState(false);
  const [isChapterTransitioning, setIsChapterTransitioning] = useState(false);
  const [targetScrollVerse, setTargetScrollVerse] = useState<number | null>(
    subScreenData?.scrollToVerse ?? null,
  );

  // Refs for auto-scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  const verseRefs = useRef<Map<string, View>>(new Map());
  const lastHighlightedVerseKey = useRef<string | null>(null);
  const modeSelectEntrance = useRef(new Animated.Value(1)).current;
  const readTransition = useRef(new Animated.Value(1)).current;
  const readScreenEntrance = useRef(new Animated.Value(1)).current;
  const readTransitionDirectionRef = useRef<1 | -1>(1);

  // Chapter transition animation
  const chapterTranslateX = useRef(new Animated.Value(0)).current;
  const chapterOpacity = useRef(new Animated.Value(1)).current;
  const chapterScale = useRef(new Animated.Value(1)).current;
  const chapterMode: QuranMode =
    subScreenData?.mode === "read" ? "read" : "listen";

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
    seekTo,
    pause,
  } = useAudioPlayer();
  const {
    isVerseBookmarked,
    isChapterBookmarked,
    toggleVerseBookmark,
    toggleChapterBookmark,
  } = useBookmarks();

  const chaptersQuery = useQuery({
    queryKey: ["quranChapters"],
    queryFn: quranService.getChapters,
  });

  // Use infinite query for verses with pagination
  const versesQuery = useInfiniteQuery({
    queryKey: ["quranVersesByChapter", subScreenData?.chapterId],
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
    return (
      versesQuery.data?.pages
        .flatMap((page) => page.verses)
        .map(transformVerse) ?? []
    );
  }, [versesQuery.data?.pages]);

  // Get total verses count from pagination
  const totalVerses = useMemo(() => {
    return versesQuery.data?.pages[0]?.pagination.total_records ?? 0;
  }, [versesQuery.data?.pages]);

  const readPages = useMemo<ReadPageItem[]>(() => {
    return verses.flatMap((verse) =>
      buildQuranReadPages({
        verseKey: verse.verse_key,
        verseNumber: verse.verse_number,
        arabicText: verse.text_uthmani,
        translationText: verse.translation || "",
        viewMode,
        surface: "web",
      }).map((page) => ({
        ...page,
        verse,
      })),
    );
  }, [verses, viewMode]);

  const currentReadPage = readPages[currentReadVerseIndex] ?? null;
  const currentReadVerseProgress = currentReadPage?.verseNumber ?? 1;

  useEffect(() => {
    setCurrentReadVerseIndex((prev) =>
      Math.min(prev, Math.max(readPages.length - 1, 0)),
    );
  }, [readPages.length]);

  useEffect(() => {
    if (subScreen !== "mode-select") {
      modeSelectEntrance.setValue(1);
      return;
    }

    modeSelectEntrance.setValue(0);
    Animated.timing(modeSelectEntrance, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [modeSelectEntrance, subScreen, subScreenData?.chapterId]);

  useEffect(() => {
    if (subScreen !== "chapter" || chapterMode !== "read") {
      readScreenEntrance.setValue(1);
      return;
    }

    readScreenEntrance.setValue(0);
    Animated.timing(readScreenEntrance, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [chapterMode, readScreenEntrance, subScreen, subScreenData?.chapterId]);

  // Load chapter audio when viewing a chapter
  useEffect(() => {
    if (
      subScreen === "chapter" &&
      subScreenData?.chapterId &&
      selectedReciter
    ) {
      loadChapter(subScreenData.chapterId);
    }
  }, [subScreen, subScreenData?.chapterId, selectedReciter?.id, loadChapter]);

  // Reset audio when leaving chapter view
  useEffect(() => {
    if (subScreen !== "chapter") {
      reset();
      resetPlaybackSettings();
    }
  }, [subScreen, reset, resetPlaybackSettings]);

  // Scroll to top when chapter changes (for next/previous chapter navigation)
  useEffect(() => {
    if (subScreen === "chapter" && subScreenData?.chapterId) {
      // Only scroll to top if there's no specific verse to scroll to
      if (!subScreenData?.scrollToVerse) {
        // Use web-specific scrolling
        if (scrollViewRef.current) {
          // @ts-ignore - web specific
          const element = scrollViewRef.current as unknown as HTMLElement;
          if (element?.scrollTo) {
            element.scrollTo({ top: 0, behavior: "instant" });
          } else if (element?.scrollTop !== undefined) {
            element.scrollTop = 0;
          }
        }
        // Also scroll the window/document for web
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "instant" });
        }
      }
    }
  }, [subScreen, subScreenData?.chapterId]);

  useEffect(() => {
    if (subScreen === "chapter") {
      setTargetScrollVerse(subScreenData?.scrollToVerse ?? null);
    } else {
      setTargetScrollVerse(null);
    }
  }, [subScreen, subScreenData?.chapterId, subScreenData?.scrollToVerse]);

  useEffect(() => {
    setCurrentReadVerseIndex(0);
    setIsReadTransitioning(false);
    readTransition.setValue(1);
    lastHighlightedVerseKey.current = null;
  }, [subScreenData?.chapterId, readTransition]);

  // Auto-scroll to highlighted verse
  useEffect(() => {
    const verseKey = highlightState.verseKey;

    // Only scroll if we have a new verse to highlight and we're playing
    if (
      chapterMode !== "listen" ||
      !verseKey ||
      verseKey === lastHighlightedVerseKey.current ||
      playbackState !== "playing"
    ) {
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
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [chapterMode, highlightState.verseKey, playbackState]);

  // Auto-load more verses when playing audio and approaching the end of loaded verses
  useEffect(() => {
    if (chapterMode !== "listen" || playbackState !== "playing") return;

    const verseKey = highlightState.verseKey;
    if (!verseKey) return;

    // Extract verse number from verseKey (format: "chapterId:verseNumber")
    const verseNumber = parseInt(verseKey.split(":")[1], 10);
    if (isNaN(verseNumber)) return;

    // Check if we're within 3 verses of the end of loaded verses
    const loadedVersesCount = verses.length;
    const threshold = loadedVersesCount - 3;

    if (
      verseNumber >= threshold &&
      versesQuery.hasNextPage &&
      !versesQuery.isFetchingNextPage
    ) {
      versesQuery.fetchNextPage();
    }
  }, [
    chapterMode,
    highlightState.verseKey,
    playbackState,
    verses.length,
    versesQuery,
  ]);

  useEffect(() => {
    if (
      subScreen !== "chapter" ||
      !subScreenData?.chapterId ||
      targetScrollVerse === null
    ) {
      return;
    }

    const verseKey = `${subScreenData.chapterId}:${targetScrollVerse}`;
    const isLoaded = verses.some((verse) => verse.verse_key === verseKey);

    if (isLoaded) {
      const timeout = setTimeout(() => {
        const verseElement = verseRefs.current.get(verseKey);
        if (verseElement) {
          // @ts-ignore
          const element = verseElement as unknown as HTMLElement;
          if (element?.scrollIntoView) {
            element.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }
        setTargetScrollVerse(null);
      }, 150);

      return () => clearTimeout(timeout);
    }

    if (versesQuery.hasNextPage && !versesQuery.isFetchingNextPage) {
      versesQuery.fetchNextPage();
    }
  }, [
    subScreen,
    subScreenData?.chapterId,
    targetScrollVerse,
    verses,
    versesQuery,
  ]);

  // Get highlight status for a verse
  const getVerseHighlightStatus = useCallback(
    (verseKey: string): "none" | "current" | "completed" => {
      if (playbackState === "idle" || playbackState === "error") {
        return "none";
      }
      if (highlightState.completedVerseKeys.has(verseKey)) {
        return "completed";
      }
      if (highlightState.verseKey === verseKey) {
        return "current";
      }
      return "none";
    },
    [playbackState, highlightState],
  );

  // Get highlighted word position for a verse
  const getVerseHighlightedWordPosition = useCallback(
    (verseKey: string): number | null => {
      if (highlightState.verseKey === verseKey) {
        return highlightState.wordPosition;
      }
      return null;
    },
    [highlightState],
  );

  // Handle back with audio cleanup
  const handleBack = useCallback(() => {
    reset();
    resetPlaybackSettings();
    onBack();
  }, [reset, resetPlaybackSettings, onBack]);
  const backButtonLabel =
    subScreenData?.backTab === "bookmarks"
      ? "Back to Bookmarks"
      : "Back to Chapters";

  // Audio navigation handlers
  const handleSkipToStart = useCallback(async () => {
    await seekTo(0);
  }, [seekTo]);

  const handleSkipToEnd = useCallback(async () => {
    // Navigate to next chapter
    handleNextChapter();
  }, []);

  // Animate chapter transition
  const animateChapterTransition = useCallback(
    (direction: "next" | "previous", chapter: QuranChapter) => {
      if (isChapterTransitioning) return;
      setIsChapterTransitioning(true);

      const slideDirection = direction === "next" ? -1 : 1;
      const screenWidth =
        typeof window !== "undefined" ? window.innerWidth : 800;

      // Pause and reset audio before changing chapter
      pause();
      reset();
      resetPlaybackSettings();

      // Animate out with smooth easing
      Animated.parallel([
        Animated.timing(chapterTranslateX, {
          toValue: slideDirection * screenWidth * 0.5,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(chapterOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(chapterScale, {
          toValue: 0.92,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Navigate to new chapter, preserving the current mode (listen/read)
        onSubNavigate("chapter", {
          chapterId: chapter.id,
          chapterName: chapter.name_simple,
          chapterArabicName: chapter.name_arabic,
          mode: chapterMode,
        });

        // Position for slide in and reset opacity to 0
        chapterTranslateX.setValue(-slideDirection * screenWidth * 0.5);
        chapterScale.setValue(0.92);
        chapterOpacity.setValue(0);

        // Animate in after brief delay for content to load
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(chapterTranslateX, {
              toValue: 0,
              duration: 280,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(chapterOpacity, {
              toValue: 1,
              duration: 220,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(chapterScale, {
              toValue: 1,
              duration: 280,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]).start(() => {
            setIsChapterTransitioning(false);
          });
        }, 80);
      });
    },
    [
      isChapterTransitioning,
      pause,
      reset,
      resetPlaybackSettings,
      onSubNavigate,
      chapterTranslateX,
      chapterOpacity,
      chapterScale,
      chapterMode,
    ],
  );

  const handlePreviousChapter = useCallback(() => {
    const currentChapterId = subScreenData?.chapterId;
    if (currentChapterId && currentChapterId > 1 && !isChapterTransitioning) {
      const prevChapterId = currentChapterId - 1;
      const chapter = chaptersQuery.data?.find((c) => c.id === prevChapterId);
      if (chapter) {
        animateChapterTransition("previous", chapter);
      }
    }
  }, [
    subScreenData?.chapterId,
    chaptersQuery.data,
    isChapterTransitioning,
    animateChapterTransition,
  ]);

  const handleNextChapter = useCallback(() => {
    const currentChapterId = subScreenData?.chapterId;
    if (currentChapterId && currentChapterId < 114 && !isChapterTransitioning) {
      const nextChapterId = currentChapterId + 1;
      const chapter = chaptersQuery.data?.find((c) => c.id === nextChapterId);
      if (chapter) {
        animateChapterTransition("next", chapter);
      }
    }
  }, [
    subScreenData?.chapterId,
    chaptersQuery.data,
    isChapterTransitioning,
    animateChapterTransition,
  ]);

  const handleToggleChapterBookmark = useCallback(() => {
    if (!subScreenData?.chapterId) {
      return;
    }
    toggleChapterBookmark({
      chapterId: subScreenData.chapterId,
      chapterName: subScreenData.chapterName || "Chapter",
      chapterArabicName: subScreenData.chapterArabicName || "",
      versesCount: totalVerses,
    });
  }, [subScreenData, toggleChapterBookmark, totalVerses]);

  const handleToggleVerseBookmark = useCallback(
    (verse: TransformedVerse) => {
      if (!subScreenData?.chapterId) {
        return;
      }
      toggleVerseBookmark({
        verseKey: verse.verse_key,
        chapterId: subScreenData.chapterId,
        chapterName: subScreenData.chapterName || "Chapter",
        chapterArabicName: subScreenData.chapterArabicName || "",
        verseNumber: verse.verse_number,
        arabicText: verse.text_uthmani,
        translationPreview: (verse.translation || "").slice(0, 120),
      });
    },
    [subScreenData, toggleVerseBookmark],
  );

  const animateToReadIndex = useCallback(
    (nextIndex: number) => {
      if (nextIndex === currentReadVerseIndex || isReadTransitioning) {
        return;
      }

      readTransitionDirectionRef.current =
        nextIndex > currentReadVerseIndex ? 1 : -1;
      setIsReadTransitioning(true);

      Animated.timing(readTransition, {
        toValue: 0,
        duration: 130,
        useNativeDriver: true,
      }).start(() => {
        setCurrentReadVerseIndex(nextIndex);
        readTransition.setValue(0);

        Animated.timing(readTransition, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }).start(() => {
          setIsReadTransitioning(false);
        });
      });
    },
    [currentReadVerseIndex, isReadTransitioning, readTransition],
  );

  const handleReadPrevious = useCallback(() => {
    animateToReadIndex(Math.max(currentReadVerseIndex - 1, 0));
  }, [animateToReadIndex, currentReadVerseIndex]);

  const handleReadNext = useCallback(async () => {
    if (isReadTransitioning) {
      return;
    }

    if (currentReadVerseIndex < readPages.length - 1) {
      animateToReadIndex(currentReadVerseIndex + 1);
      return;
    }

    if (versesQuery.hasNextPage && !versesQuery.isFetchingNextPage) {
      const nextIndex = readPages.length;
      await versesQuery.fetchNextPage();
      animateToReadIndex(nextIndex);
    }
  }, [
    animateToReadIndex,
    currentReadVerseIndex,
    isReadTransitioning,
    readPages.length,
    versesQuery,
  ]);

  if (subScreen === "mode-select" && subScreenData) {
    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.modeSelectScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.modeSelectShell,
            {
              opacity: modeSelectEntrance,
              transform: [
                {
                  translateY: modeSelectEntrance.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={["#1B4332", "#2D6A4F"]}
            style={styles.modeSelectHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity
              onPress={onBack}
              style={styles.modeSelectBackButton}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text.white} />
            </TouchableOpacity>
            {subScreenData.chapterArabicName ? (
              <Text style={styles.modeSelectArabicName}>
                {subScreenData.chapterArabicName}
              </Text>
            ) : null}
            <Text style={styles.modeSelectChapterName}>
              {subScreenData.chapterName}
            </Text>
          </LinearGradient>

          <View style={styles.modeSelectContent}>
            <Text style={styles.modeSelectPrompt}>
              How would you like to engage?
            </Text>

            <View style={styles.modeSelectOptions}>
              <TouchableOpacity
                style={styles.modeSelectCard}
                onPress={() =>
                  onSubNavigate("chapter", {
                    ...subScreenData,
                    mode: "listen",
                  })
                }
                activeOpacity={0.85}
                // @ts-ignore
                onMouseEnter={listenModeHover.handlers.onMouseEnter}
                // @ts-ignore
                onMouseLeave={listenModeHover.handlers.onMouseLeave}
              >
                <LinearGradient
                  colors={[colors.primary, "#2D6A4F"]}
                  // @ts-ignore
                  style={[styles.modeSelectCardGradient, listenModeHover.style]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.modeSelectIconWrap}>
                    <Ionicons
                      name="headset-outline"
                      size={34}
                      color={colors.text.white}
                    />
                  </View>
                  <Text style={styles.modeSelectCardTitle}>Listen</Text>
                  <Text style={styles.modeSelectCardSubtitle}>
                    Hear the chapter with reciter playback, verse highlighting,
                    looping, and custom verse-range controls.
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modeSelectCard}
                onPress={() =>
                  onSubNavigate("chapter", {
                    ...subScreenData,
                    mode: "read",
                  })
                }
                activeOpacity={0.85}
                // @ts-ignore
                onMouseEnter={readModeHover.handlers.onMouseEnter}
                // @ts-ignore
                onMouseLeave={readModeHover.handlers.onMouseLeave}
              >
                <LinearGradient
                  colors={["#C9A227", "#D6B54D"]}
                  // @ts-ignore
                  style={[styles.modeSelectCardGradient, readModeHover.style]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.modeSelectIconWrap}>
                    <Ionicons
                      name="book-outline"
                      size={34}
                      color={colors.text.white}
                    />
                  </View>
                  <Text style={styles.modeSelectCardTitle}>Read</Text>
                  <Text style={styles.modeSelectCardSubtitle}>
                    Move verse by verse in a focused reading flow, with long
                    ayat continuing onto follow-up pages when needed.
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    );
  }

  // Render chapter verses
  if (subScreen === "chapter" && subScreenData) {
    // Render the full chapter header (used for both loading and loaded states)
    const renderChapterHeader = () => (
      <View style={styles.chapterHeaderShell}>
        <View style={styles.chapterTopBar}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={styles.backButtonText}>{backButtonLabel}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chapterHeader}>
          <LinearGradient
            colors={["#1B4332", "#2D6A4F"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.chapterHeaderPattern} />
          <View style={styles.chapterHeaderContent}>
            <View style={styles.chapterHeaderTopRow}>
              <View style={styles.chapterHeaderSideSlot}>
                {subScreenData.chapterArabicName ? (
                  <Text style={styles.chapterHeaderArabic}>
                    {subScreenData.chapterArabicName}
                  </Text>
                ) : (
                  <View style={styles.chapterHeaderSideSpacer} />
                )}
              </View>
              <View style={styles.chapterHeaderTitleWrap}>
                <Text style={styles.chapterHeaderName}>
                  {subScreenData.chapterName}
                </Text>
              </View>
              <View style={styles.chapterHeaderActionSlot}>
                <TouchableOpacity
                  onPress={handleToggleChapterBookmark}
                  activeOpacity={0.85}
                  style={styles.chapterBookmarkButton}
                >
                  <Ionicons
                    name={
                      isChapterBookmarked(subScreenData.chapterId)
                        ? "bookmark"
                        : "bookmark-outline"
                    }
                    size={21}
                    color={
                      isChapterBookmarked(subScreenData.chapterId)
                        ? colors.accent
                        : "rgba(255,255,255,0.9)"
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.chapterHeaderBismillahRow}>
              <Text style={styles.chapterHeaderBismillah}>
                {viewMode === "english"
                  ? "In the name of Allah, the Most Gracious, the Most Merciful"
                  : "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"}
              </Text>
            </View>
          </View>
        </View>

        <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </View>
    );

    return (
      <View style={styles.chapterContainer}>
        {versesQuery.isLoading ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.chapterPageScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderChapterHeader()}
            <Animated.View
              style={{
                opacity: chapterOpacity,
                transform: [
                  { translateX: chapterTranslateX },
                  { scale: chapterScale },
                ],
              }}
            >
              <View style={styles.loadingContainerCentered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading verses...</Text>
              </View>
            </Animated.View>
          </ScrollView>
        ) : versesQuery.isError ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.chapterPageScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderChapterHeader()}
            <Animated.View
              style={{
                opacity: chapterOpacity,
                transform: [
                  { translateX: chapterTranslateX },
                  { scale: chapterScale },
                ],
              }}
            >
              <View style={styles.errorContainerCentered}>
                <Ionicons
                  name="alert-circle-outline"
                  size={48}
                  color={colors.error}
                />
                <Text style={styles.errorTitle}>Failed to load verses</Text>
                <Text style={styles.errorText}>
                  {(versesQuery.error as Error)?.message || "Please try again"}
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        ) : chapterMode === "listen" ? (
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.chapterPageScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderChapterHeader()}

            <Animated.View
              style={{
                opacity: chapterOpacity,
                transform: [
                  { translateX: chapterTranslateX },
                  { scale: chapterScale },
                ],
              }}
            >
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
                        verseKey={verseKey}
                        index={index}
                        highlightStatus={getVerseHighlightStatus(verseKey)}
                        highlightedWordPosition={getVerseHighlightedWordPosition(
                          verseKey,
                        )}
                        viewMode={viewMode}
                        isBookmarked={isVerseBookmarked(verseKey)}
                        onBookmarkPress={() => handleToggleVerseBookmark(verse)}
                      />
                    </View>
                  );
                })}

                {versesQuery.hasNextPage && (
                  <TouchableOpacity
                    onPress={() => versesQuery.fetchNextPage()}
                    disabled={versesQuery.isFetchingNextPage}
                    style={styles.loadMoreButton}
                  >
                    {versesQuery.isFetchingNextPage ? (
                      <>
                        <ActivityIndicator
                          size="small"
                          color={colors.text.white}
                        />
                        <Text style={styles.loadMoreText}>Loading...</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.loadMoreText}>
                          Load More Verses
                        </Text>
                        <Ionicons
                          name="chevron-down"
                          size={18}
                          color={colors.text.white}
                        />
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </ScrollView>
        ) : (
          <>
            <Animated.View
              style={[
                styles.readScreenAnimatedContainer,
                {
                  opacity: readScreenEntrance,
                  transform: [
                    {
                      translateY: readScreenEntrance.interpolate({
                        inputRange: [0, 1],
                        outputRange: [18, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.readHeaderShell}>
                <View style={[styles.chapterHeader, styles.readChapterHeader]}>
                  <LinearGradient
                    colors={["#1B4332", "#2D6A4F"]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <View style={styles.chapterHeaderPattern} />
                  <View style={styles.readHeaderActions}>
                    <TouchableOpacity
                      onPress={handleBack}
                      style={styles.readHeaderActionButton}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="arrow-back"
                        size={20}
                        color={colors.text.white}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleToggleChapterBookmark}
                      activeOpacity={0.85}
                      style={styles.readHeaderActionButton}
                    >
                      <Ionicons
                        name={
                          isChapterBookmarked(subScreenData.chapterId)
                            ? "bookmark"
                            : "bookmark-outline"
                        }
                        size={21}
                        color={
                          isChapterBookmarked(subScreenData.chapterId)
                            ? colors.accent
                            : "rgba(255,255,255,0.9)"
                        }
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.readChapterHeaderContent}>
                    {subScreenData.chapterArabicName ? (
                      <Text style={styles.readChapterHeaderArabic}>
                        {subScreenData.chapterArabicName}
                      </Text>
                    ) : null}
                    <Text style={styles.readChapterHeaderName}>
                      {subScreenData.chapterName}
                    </Text>
                    <Text style={styles.readChapterHeaderBismillah}>
                      {viewMode === "english"
                        ? "In the name of Allah, the Most Gracious, the Most Merciful"
                        : "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"}
                    </Text>
                  </View>
                </View>

                <ViewModeToggle
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />

                <View style={styles.readProgressWrap}>
                  <View style={styles.readProgressRow}>
                    <View style={styles.readProgressInfo}>
                      <Text style={styles.readProgressLabel}>
                        {currentReadVerseProgress} of {Math.max(totalVerses, 1)}
                      </Text>
                      <View style={styles.readProgressTrack}>
                        <View
                          style={[
                            styles.readProgressFill,
                            {
                              width: `${(currentReadVerseProgress / Math.max(totalVerses, 1)) * 100}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <View style={styles.readChapterNavButtons}>
                      <TouchableOpacity
                        onPress={handlePreviousChapter}
                        disabled={
                          !subScreenData?.chapterId ||
                          subScreenData.chapterId <= 1
                        }
                        style={[
                          styles.readChapterNavButton,
                          (!subScreenData?.chapterId ||
                            subScreenData.chapterId <= 1) &&
                            styles.readChapterNavButtonDisabled,
                        ]}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="chevron-back"
                          size={16}
                          color={
                            !subScreenData?.chapterId ||
                            subScreenData.chapterId <= 1
                              ? colors.text.disabled
                              : colors.primary
                          }
                        />
                        <Text
                          style={[
                            styles.readChapterNavButtonText,
                            (!subScreenData?.chapterId ||
                              subScreenData.chapterId <= 1) &&
                              styles.readChapterNavButtonTextDisabled,
                          ]}
                        >
                          Prev
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleNextChapter}
                        disabled={
                          !subScreenData?.chapterId ||
                          subScreenData.chapterId >= 114
                        }
                        style={[
                          styles.readChapterNavButton,
                          (!subScreenData?.chapterId ||
                            subScreenData.chapterId >= 114) &&
                            styles.readChapterNavButtonDisabled,
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.readChapterNavButtonText,
                            (!subScreenData?.chapterId ||
                              subScreenData.chapterId >= 114) &&
                              styles.readChapterNavButtonTextDisabled,
                          ]}
                        >
                          Next
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={
                            !subScreenData?.chapterId ||
                            subScreenData.chapterId >= 114
                              ? colors.text.disabled
                              : colors.primary
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              <Animated.View
                style={{
                  flex: 1,
                  opacity: chapterOpacity,
                  transform: [
                    { translateX: chapterTranslateX },
                    { scale: chapterScale },
                  ],
                }}
              >
                <View style={styles.readModeShell}>
                  <View style={styles.readViewport}>
                    {currentReadPage ? (
                      <Animated.View
                        style={[
                          styles.readAnimatedPage,
                          {
                            opacity: readTransition,
                            transform: [
                              {
                                translateY: readTransition.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [
                                    readTransitionDirectionRef.current * 22,
                                    0,
                                  ],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <ReadVerseCard
                          page={currentReadPage}
                          viewMode={viewMode}
                          isBookmarked={isVerseBookmarked(
                            currentReadPage.verseKey,
                          )}
                          onBookmarkPress={() =>
                            handleToggleVerseBookmark(currentReadPage.verse)
                          }
                        />
                      </Animated.View>
                    ) : null}
                  </View>

                  <View style={styles.readControls}>
                    <TouchableOpacity
                      onPress={handleReadPrevious}
                      disabled={currentReadVerseIndex === 0}
                      style={[
                        styles.readControlButton,
                        currentReadVerseIndex === 0 &&
                          styles.readControlButtonDisabled,
                      ]}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="chevron-up"
                        size={22}
                        color={
                          currentReadVerseIndex === 0
                            ? colors.text.disabled
                            : colors.primary
                        }
                      />
                      <Text
                        style={[
                          styles.readControlButtonText,
                          currentReadVerseIndex === 0 &&
                            styles.readControlButtonTextDisabled,
                        ]}
                      >
                        Previous
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        void handleReadNext();
                      }}
                      disabled={
                        currentReadVerseIndex >= readPages.length - 1 &&
                        !versesQuery.hasNextPage
                      }
                      style={[
                        styles.readControlButton,
                        styles.readControlButtonPrimary,
                        currentReadVerseIndex >= readPages.length - 1 &&
                          !versesQuery.hasNextPage &&
                          styles.readControlButtonDisabled,
                      ]}
                      activeOpacity={0.85}
                    >
                      {versesQuery.isFetchingNextPage ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.text.white}
                        />
                      ) : (
                        <Ionicons
                          name="chevron-down"
                          size={24}
                          color={colors.text.white}
                        />
                      )}
                      <Text style={styles.readControlButtonTextPrimary}>
                        {currentReadVerseIndex >= readPages.length - 1 &&
                        !versesQuery.hasNextPage
                          ? "End of Chapter"
                          : "Next"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </Animated.View>
          </>
        )}

        {/* Fixed Settings Button - Only show in Listen mode */}
        {chapterMode === "listen" && (
          <TouchableOpacity
            onPress={() => setShowVerseRangeSidebar(true)}
            style={styles.fixedSettingsButton}
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}

        {chapterMode === "listen" ? (
          <WebAudioPlayerBar
            onSkipToStart={handleSkipToStart}
            onSkipToEnd={handleNextChapter}
            onPreviousChapter={handlePreviousChapter}
            onNextChapter={handleNextChapter}
            isChapterTransitioning={isChapterTransitioning}
          />
        ) : null}

        {/* Playback Settings Sidebar (includes reciter selection) */}
        <VerseRangeSidebar
          visible={showVerseRangeSidebar}
          onClose={() => setShowVerseRangeSidebar(false)}
          totalVerses={totalVerses}
          chapterId={subScreenData.chapterId}
          reciters={reciters}
          selectedReciter={selectedReciter}
          onSelectReciter={selectReciter}
          isLoadingReciters={isLoadingReciters}
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
          Explore all 114 surahs with Arabic text, transliteration, and
          translations
        </Text>
      </View>

      {chaptersQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading chapters...</Text>
        </View>
      ) : chaptersQuery.isError ? (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.error}
          />
          <Text style={styles.errorTitle}>Failed to load chapters</Text>
          <Text style={styles.errorText}>Please try again later</Text>
        </View>
      ) : (
        <View style={styles.chaptersGrid}>
          {chaptersQuery.data?.map((chapter, index) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              index={index}
              onPress={() =>
                onSubNavigate("mode-select", {
                  chapterId: chapter.id,
                  chapterName: chapter.name_simple,
                  chapterArabicName: chapter.name_arabic,
                })
              }
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
    alignItems: "center",
    marginBottom: 40,
  },
  pageHeaderIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: "600",
    color: colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 12,
    textAlign: "center",
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  pageSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: "center",
    maxWidth: 500,
    lineHeight: 26,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  chaptersGrid: {
    // @ts-ignore - CSS Grid for responsive layout that fills width
    display: "grid",
    gap: 20,
    width: "100%",
    // @ts-ignore - Increased minimum width to 360px for more breathing room
    // This ensures cards always fill the entire width with uniform columns
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
  },
  chapterCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    // @ts-ignore
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
    cursor: "pointer",
    width: "100%",
    // @ts-ignore
    transition: "all 0.2s ease-out",
    minHeight: 100,
  },
  chapterNumber: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    flexShrink: 0,
  },
  chapterNumberText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  chapterInfo: {
    flex: 1,
    minWidth: 0, // Allows flex item to shrink below content size
    marginRight: 16,
  },
  chapterName: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 6,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  chapterMeaning: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 6,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
    // @ts-ignore - Allow wrapping but with better spacing
    lineHeight: 20,
  },
  chapterMeta: {
    fontSize: 12,
    color: colors.text.tertiary,
    textTransform: "capitalize",
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  chapterArabic: {
    marginRight: 16,
    flexShrink: 0,
  },
  chapterArabicText: {
    fontSize: 24,
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    backgroundColor: `${colors.primary}10`,
    gap: 8,
    // @ts-ignore
    cursor: "pointer",
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  modeSelectScrollContent: {
    padding: 32,
    paddingBottom: 40,
    flexGrow: 1,
  },
  modeSelectShell: {
    maxWidth: 980,
    width: "100%",
    alignSelf: "center",
    flex: 1,
  },
  modeSelectHeader: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 20,
    alignItems: "center",
    marginBottom: 40,
    overflow: "hidden",
  },
  modeSelectBackButton: {
    alignSelf: "flex-start",
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    // @ts-ignore
    cursor: "pointer",
  },
  modeSelectArabicName: {
    fontSize: 32,
    color: colors.accent,
    marginBottom: 4,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  modeSelectChapterName: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text.white,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  modeSelectContent: {
    alignItems: "stretch",
    flex: 1,
    paddingTop: 12,
  },
  modeSelectPrompt: {
    fontSize: 28,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 10,
    textAlign: "center",
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  modeSelectOptions: {
    width: "100%",
    flex: 1,
    gap: 4,
    justifyContent: "center",
  },
  modeSelectCard: {
    borderRadius: 24,
    overflow: "hidden",
    width: "100%",
    flex: 1,
    // @ts-ignore
    cursor: "pointer",
  },
  modeSelectCardGradient: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: "flex-start",
    minHeight: 210,
    justifyContent: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  modeSelectIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  modeSelectCardTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.white,
    marginBottom: 6,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  modeSelectCardSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.86)",
    textAlign: "left",
    maxWidth: 560,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  chapterHeaderShell: {
    paddingTop: 40,
    paddingHorizontal: 40,
    paddingBottom: 16,
  },
  readHeaderShell: {
    paddingTop: 18,
    paddingHorizontal: 28,
    paddingBottom: 10,
  },
  readScreenAnimatedContainer: {
    flex: 1,
  },
  chapterHeader: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
    position: "relative",
  },
  readChapterHeader: {
    marginBottom: 12,
  },
  chapterHeaderPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    // @ts-ignore
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,
    backgroundSize: "60px 60px",
  },
  chapterHeaderContent: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 8,
  },
  chapterHeaderTopRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  chapterHeaderSideSlot: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    minWidth: 0,
  },
  chapterHeaderTitleWrap: {
    flex: 1.4,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
  },
  chapterHeaderActionSlot: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  chapterHeaderSideSpacer: {
    width: 36,
    height: 36,
  },
  chapterHeaderArabic: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.accent,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
    textAlign: "left",
  },
  chapterBookmarkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    // @ts-ignore
    cursor: "pointer",
  },
  chapterHeaderName: {
    fontSize: 30,
    fontWeight: "600",
    color: colors.text.white,
    textAlign: "center",
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  chapterHeaderBismillahRow: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  chapterHeaderBismillah: {
    fontSize: 24,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  readHeaderActions: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 1,
  },
  readHeaderActionButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    // @ts-ignore
    cursor: "pointer",
  },
  readChapterHeaderContent: {
    minHeight: 124,
    paddingHorizontal: 72,
    paddingTop: 18,
    paddingBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  readChapterHeaderArabic: {
    fontSize: 32,
    color: colors.accent,
    marginBottom: 4,
    textAlign: "center",
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  readChapterHeaderName: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text.white,
    marginBottom: 6,
    textAlign: "center",
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  readChapterHeaderBismillah: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.82)",
    textAlign: "center",
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  readProgressWrap: {
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  readProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  readProgressInfo: {
    flex: 1,
  },
  readProgressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.secondary,
    textAlign: "start",
    marginBottom: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  readProgressTrack: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 999,
    overflow: "hidden",
  },
  readChapterNavButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  readChapterNavButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: `${colors.primary}15`,
    gap: 4,
    // @ts-ignore
    cursor: "pointer",
  },
  readChapterNavButtonDisabled: {
    opacity: 0.4,
    // @ts-ignore
    cursor: "not-allowed",
  },
  readChapterNavButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  readChapterNavButtonTextDisabled: {
    color: colors.text.disabled,
  },
  readProgressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  chapterPageScrollContent: {
    paddingTop: 40,
    paddingHorizontal: 40,
    paddingBottom: 140,
  },
  versesContainer: {
    gap: 16,
  },
  readModeShell: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 20,
  },
  readViewport: {
    flex: 1,
    minHeight: 0,
  },
  readAnimatedPage: {
    flex: 1,
  },
  readVersePage: {
    flex: 1,
    width: "100%",
  },
  readVerseCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 18,
    alignItems: "center",
    justifyContent: "space-between",
    // @ts-ignore
    boxShadow: "0 10px 36px rgba(0, 0, 0, 0.08)",
  },
  readVerseTopRow: {
    width: "100%",
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 20,
  },
  readVerseBadge: {
    minWidth: 52,
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  readVerseBadgeWide: {
    minWidth: 110,
  },
  readVerseBadgeText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.white,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  readVerseBadgeContinuationText: {
    fontSize: 16,
  },
  readVerseBookmarkButton: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    // @ts-ignore
    cursor: "pointer",
  },
  readVerseContent: {
    flex: 1,
    width: "100%",
    maxWidth: 980,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 12,
  },
  readVerseArabic: {
    fontSize: 32,
    lineHeight: 52,
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: 16,
    width: "100%",
    // @ts-ignore
    fontFamily: "'Amiri', serif",
    direction: "rtl",
  },
  readVerseArabicOnly: {
    marginBottom: 0,
  },
  readVerseTranslation: {
    fontSize: 18,
    lineHeight: 28,
    color: colors.text.secondary,
    textAlign: "center",
    width: "100%",
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  readVerseTranslationOnly: {
    color: colors.text.primary,
  },
  readVerseKey: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 10,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  readControls: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  readControlButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    // @ts-ignore
    cursor: "pointer",
  },
  readControlButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  readControlButtonDisabled: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  readControlButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  readControlButtonTextDisabled: {
    color: colors.text.disabled,
  },
  readControlButtonTextPrimary: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.white,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  verseCard: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    // @ts-ignore
    transition: "all 0.2s ease-out",
  },
  verseLeftColumn: {
    alignItems: "center",
    marginRight: 20,
    gap: 10,
  },
  verseNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  verseNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  verseContent: {
    flex: 1,
  },
  verseHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 10,
  },
  verseKeyText: {
    fontSize: 12,
    color: colors.text.tertiary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  verseBookmarkButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${colors.primary}08`,
    // @ts-ignore
    cursor: "pointer",
  },
  verseArabic: {
    fontSize: 28,
    color: colors.text.primary,
    textAlign: "right",
    marginBottom: 16,
    lineHeight: 48,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
    direction: "rtl",
  },
  verseTransliteration: {
    fontSize: 21,
    color: colors.primary,
    fontStyle: "italic",
    marginBottom: 12,
    lineHeight: 28,
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
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 4,
    // @ts-ignore
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    // @ts-ignore
    cursor: "pointer",
    transition: "all 0.2s ease-out",
  },
  viewModeButtonActive: {
    backgroundColor: colors.primary,
    // @ts-ignore
    boxShadow: "0 4px 12px rgba(27, 67, 50, 0.25)",
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: "600",
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
    color: "#047857",
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
  },
  loadingContainerCentered: {
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    minHeight: 300,
  },
  loadingText: {
    fontSize: 15,
    color: colors.text.secondary,
    marginTop: 16,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
  },
  errorContainerCentered: {
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    minHeight: 300,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 8,
    // @ts-ignore
    cursor: "pointer",
  },
  loadMoreText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.white,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  // Chapter container for fixed audio bar
  chapterContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: colors.surface,
  },
  // Verse highlighting styles - BRIGHT and OBVIOUS
  verseCardHighlighted: {
    borderColor: "#10B981",
    borderWidth: 3,
    backgroundColor: "#D1FAE5",
    // @ts-ignore
    boxShadow:
      "0 0 0 4px rgba(16, 185, 129, 0.25), 0 8px 32px rgba(16, 185, 129, 0.2)",
    position: "relative",
    transform: [{ scale: 1.01 }],
  },
  verseCardCompleted: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderWidth: 2,
  },
  verseNumberHighlighted: {
    backgroundColor: "#10B981",
    // @ts-ignore
    boxShadow: "0 0 12px rgba(16, 185, 129, 0.5)",
  },
  verseNumberTextHighlighted: {
    color: colors.text.white,
    fontWeight: "800",
  },
  verseArabicHighlighted: {
    color: "#047857",
  },
  // Audio Player Bar styles
  audioPlayerBar: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    // @ts-ignore
    boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.08)",
  },
  audioProgressContainer: {
    height: 4,
    backgroundColor: colors.border,
  },
  audioProgressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    // @ts-ignore
    transition: "width 0.1s linear",
  },
  audioPlayerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 20,
  },
  audioTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 100,
  },
  audioTimeText: {
    fontSize: 14,
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
    fontVariant: ["tabular-nums"],
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
    alignItems: "center",
    justifyContent: "center",
    // @ts-ignore
    boxShadow: "0 4px 16px rgba(27, 67, 50, 0.25)",
    cursor: "pointer",
  },
  audioPlayButtonDisabled: {
    backgroundColor: colors.text.disabled,
    // @ts-ignore
    boxShadow: "none",
  },
  audioReciterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    // @ts-ignore
    cursor: "pointer",
    maxWidth: 400,
  },
  audioReciterInfo: {
    flex: 1,
  },
  audioReciterLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  audioReciterName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    // @ts-ignore
    backdropFilter: "blur(4px)",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 24,
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
    // @ts-ignore
    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.2)",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text.primary,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    // @ts-ignore
    cursor: "pointer",
  },
  modalLoading: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  modalScroll: {
    maxHeight: 400,
  },
  reciterItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    // @ts-ignore
    cursor: "pointer",
  },
  reciterItemSelected: {
    backgroundColor: `${colors.primary}08`,
  },
  reciterItemContent: {
    flex: 1,
  },
  reciterItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text.primary,
    marginBottom: 2,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  reciterItemNameSelected: {
    fontWeight: "600",
    color: colors.primary,
  },
  reciterItemArabic: {
    fontSize: 14,
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'Amiri', serif",
  },
  // Top bar with back button
  chapterTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 24,
  },
  settingsButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  // Enhanced verse highlighting - brighter and more obvious
  highlightedWord: {
    backgroundColor: "#10B981",
    color: colors.text.white,
    borderRadius: 4,
    // @ts-ignore
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  verseTransliterationHighlighted: {
    color: "#059669",
    fontWeight: "600",
  },
  // Playing indicator animation
  playingIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    gap: 3,
  },
  playingDot: {
    width: 4,
    height: 12,
    backgroundColor: "#10B981",
    borderRadius: 2,
    // @ts-ignore
    animation: "audioWave 0.8s ease-in-out infinite",
  },
  playingDot2: {
    // @ts-ignore
    animationDelay: "0.2s",
  },
  playingDot3: {
    // @ts-ignore
    animationDelay: "0.4s",
  },
  // Sidebar styles
  sidebarOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flexDirection: "row",
    justifyContent: "flex-end",
    // @ts-ignore
    backdropFilter: "blur(4px)",
  },
  sidebarContent: {
    backgroundColor: colors.background,
    width: 400,
    maxWidth: "90%",
    height: "100%",
    // @ts-ignore
    boxShadow: "-8px 0 40px rgba(0, 0, 0, 0.15)",
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sidebarTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sidebarTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text.primary,
    // @ts-ignore
    fontFamily: "'Cormorant Garamond', Georgia, serif",
  },
  sidebarCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    // @ts-ignore
    cursor: "pointer",
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
    fontWeight: "600",
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
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  currentSettingsContent: {
    flex: 1,
  },
  currentSettingsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#065F46",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  currentSettingsText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#047857",
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  inputsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
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
    fontWeight: "600",
    color: colors.text.primary,
    textAlign: "center",
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
  },
  inputDivider: {
    paddingBottom: 16,
  },
  verseHint: {
    fontSize: 13,
    color: colors.text.tertiary,
    textAlign: "center",
    marginTop: 12,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleRowActive: {
    backgroundColor: "#D1FAE5",
    borderColor: "#A7F3D0",
  },
  toggleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  toggleLabelActive: {
    color: "#047857",
    fontWeight: "600",
  },
  loopCountContainer: {
    marginTop: 8,
  },
  loopCountRow: {
    flexDirection: "row",
    alignItems: "center",
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
    fontStyle: "italic",
    marginTop: 8,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorBoxText: {
    fontSize: 14,
    color: "#DC2626",
    flex: 1,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  sidebarButtons: {
    gap: 12,
    paddingBottom: 24,
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 10,
    // @ts-ignore
    boxShadow: "0 4px 16px rgba(27, 67, 50, 0.25)",
    cursor: "pointer",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.white,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
    // @ts-ignore
    cursor: "pointer",
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  // Fixed settings button
  fixedSettingsButton: {
    // @ts-ignore - position fixed for web
    position: "fixed",
    top: 24,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    // @ts-ignore
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.12)",
    cursor: "pointer",
    zIndex: 1000,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Audio controls center
  audioControlsCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  audioControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}10`,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    // @ts-ignore
    cursor: "pointer",
  },
  audioControlButtonDisabled: {
    backgroundColor: colors.surface,
  },
  skipText: {
    position: "absolute",
    bottom: 4,
    fontSize: 9,
    fontWeight: "700",
    color: colors.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  skipTextDisabled: {
    color: colors.text.disabled,
  },
  // Reciter selection in sidebar
  reciterLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
  },
  reciterLoadingText: {
    fontSize: 14,
    color: colors.text.secondary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  reciterSelectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    // @ts-ignore
    cursor: "pointer",
  },
  reciterSelectContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  reciterSelectName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.primary,
    flex: 1,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  reciterListContainer: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 300,
  },
  reciterListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    // @ts-ignore
    cursor: "pointer",
  },
  reciterListItemSelected: {
    backgroundColor: `${colors.primary}08`,
  },
  reciterListItemName: {
    fontSize: 14,
    color: colors.text.primary,
    // @ts-ignore
    fontFamily: "'DM Sans', sans-serif",
  },
  reciterListItemNameSelected: {
    fontWeight: "600",
    color: colors.primary,
  },
});
