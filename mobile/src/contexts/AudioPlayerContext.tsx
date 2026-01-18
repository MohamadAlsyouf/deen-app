import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import { Audio } from 'expo-av';
import { useQuery } from '@tanstack/react-query';
import { quranService } from '@/services/quranService';
import type {
  NormalizedReciter,
  ChapterAudioFile,
  VerseTimestamp,
  AudioSegment,
} from '@/types/quran';

const DEFAULT_RECITER_NAME = 'Mishari Rashid';

type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

type HighlightState = {
  verseKey: string | null;
  wordPosition: number | null;
  completedVerseKeys: Set<string>;
};

type AudioPlayerContextValue = {
  // Playback state
  playbackState: PlaybackState;
  currentPosition: number;
  duration: number;
  highlightState: HighlightState;

  // Reciter state
  reciters: NormalizedReciter[];
  selectedReciter: NormalizedReciter | null;
  isLoadingReciters: boolean;

  // Actions
  loadChapter: (chapterId: number) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  selectReciter: (reciter: NormalizedReciter) => void;
  reset: () => Promise<void>;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

type AudioPlayerProviderProps = {
  children: React.ReactNode;
};

export const AudioPlayerProvider: React.FC<AudioPlayerProviderProps> = ({
  children,
}) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedReciter, setSelectedReciter] = useState<NormalizedReciter | null>(null);
  const [audioFile, setAudioFile] = useState<ChapterAudioFile | null>(null);
  const [currentChapterId, setCurrentChapterId] = useState<number | null>(null);
  const [highlightState, setHighlightState] = useState<HighlightState>({
    verseKey: null,
    wordPosition: null,
    completedVerseKeys: new Set(),
  });

  // Fetch reciters
  const recitersQuery = useQuery({
    queryKey: ['quranReciters'],
    queryFn: () => quranService.getReciters(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const reciters = recitersQuery.data ?? [];

  // Set default reciter when reciters load
  useEffect(() => {
    if (reciters.length > 0 && !selectedReciter) {
      const defaultReciter = reciters.find((r) =>
        r.name.toLowerCase().includes(DEFAULT_RECITER_NAME.toLowerCase())
      );
      setSelectedReciter(defaultReciter ?? reciters[0]);
    }
  }, [reciters, selectedReciter]);

  // Find current verse and word based on position
  const updateHighlightFromPosition = useCallback(
    (positionMs: number) => {
      if (!audioFile?.verse_timings) {
        return;
      }

      const timings = audioFile.verse_timings;
      let currentVerseKey: string | null = null;
      let currentWordPosition: number | null = null;
      const completedKeys = new Set<string>();

      for (const timing of timings) {
        const timestampFrom = timing.timestamp_from;
        const timestampTo = timing.timestamp_to;

        if (positionMs >= timestampTo) {
          completedKeys.add(timing.verse_key);
          continue;
        }

        if (positionMs >= timestampFrom && positionMs < timestampTo) {
          currentVerseKey = timing.verse_key;

          // Find current word within verse
          if (timing.segments && timing.segments.length > 0) {
            for (const segment of timing.segments) {
              const [wordPos, wordStart, wordEnd] = segment;
              if (positionMs >= wordStart && positionMs < wordEnd) {
                currentWordPosition = wordPos;
                break;
              }
              if (positionMs >= wordEnd) {
                // Mark this as the last completed word position
                currentWordPosition = wordPos;
              }
            }
          }
          break;
        }
      }

      setHighlightState({
        verseKey: currentVerseKey,
        wordPosition: currentWordPosition,
        completedVerseKeys: completedKeys,
      });
    },
    [audioFile]
  );

  // Cleanup function
  const cleanup = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {
        // Ignore unload errors
      }
      soundRef.current = null;
    }
  }, []);

  // Reset state
  const reset = useCallback(async () => {
    await cleanup();
    setPlaybackState('idle');
    setCurrentPosition(0);
    setDuration(0);
    setAudioFile(null);
    setCurrentChapterId(null);
    setHighlightState({
      verseKey: null,
      wordPosition: null,
      completedVerseKeys: new Set(),
    });
  }, [cleanup]);

  // Track loading state to prevent concurrent loads
  const isLoadingRef = useRef(false);

  // Load chapter audio
  const loadChapter = useCallback(
    async (chapterId: number) => {
      if (!selectedReciter) {
        return;
      }

      // Prevent concurrent loads
      if (isLoadingRef.current) {
        return;
      }

      // If same chapter and reciter with loaded audio, don't reload
      if (
        currentChapterId === chapterId &&
        audioFile &&
        soundRef.current
      ) {
        return;
      }

      isLoadingRef.current = true;
      await cleanup();
      setPlaybackState('loading');
      setHighlightState({
        verseKey: null,
        wordPosition: null,
        completedVerseKeys: new Set(),
      });

      try {
        const audio = await quranService.getChapterAudio({
          reciterId: selectedReciter.id,
          chapterId,
        });

        setAudioFile(audio);
        setCurrentChapterId(chapterId);

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        const { sound, status } = await Audio.Sound.createAsync(
          { uri: audio.audio_url },
          { shouldPlay: false }
        );

        soundRef.current = sound;

        if (status.isLoaded) {
          setDuration(status.durationMillis ?? 0);
        }

        setPlaybackState('paused');
      } catch (error) {
        console.error('Failed to load chapter audio:', error);
        setPlaybackState('error');
      } finally {
        isLoadingRef.current = false;
      }
    },
    [selectedReciter, currentChapterId, audioFile, cleanup]
  );

  // Start position tracking
  const startTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      if (!soundRef.current) {
        return;
      }

      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          const position = status.positionMillis;
          setCurrentPosition(position);
          updateHighlightFromPosition(position);

          if (status.didJustFinish) {
            setPlaybackState('paused');
            // Mark all verses as completed
            if (audioFile?.verse_timings) {
              const allKeys = new Set(audioFile.verse_timings.map((t) => t.verse_key));
              setHighlightState({
                verseKey: null,
                wordPosition: null,
                completedVerseKeys: allKeys,
              });
            }
          }
        }
      } catch {
        // Ignore status errors during cleanup
      }
    }, 100);
  }, [updateHighlightFromPosition, audioFile]);

  // Stop position tracking
  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Play audio
  const play = useCallback(async () => {
    if (!soundRef.current) {
      return;
    }

    try {
      await soundRef.current.playAsync();
      setPlaybackState('playing');
      startTracking();
    } catch (error) {
      console.error('Failed to play audio:', error);
      setPlaybackState('error');
    }
  }, [startTracking]);

  // Pause audio
  const pause = useCallback(async () => {
    if (!soundRef.current) {
      return;
    }

    try {
      await soundRef.current.pauseAsync();
      setPlaybackState('paused');
      stopTracking();
    } catch (error) {
      console.error('Failed to pause audio:', error);
    }
  }, [stopTracking]);

  // Seek to position
  const seekTo = useCallback(
    async (positionMs: number) => {
      if (!soundRef.current) {
        return;
      }

      try {
        await soundRef.current.setPositionAsync(positionMs);
        setCurrentPosition(positionMs);
        updateHighlightFromPosition(positionMs);
      } catch (error) {
        console.error('Failed to seek:', error);
      }
    },
    [updateHighlightFromPosition]
  );

  // Select reciter (does NOT auto-reload - the screen's useEffect handles that)
  const selectReciter = useCallback(
    async (reciter: NormalizedReciter) => {
      // Clean up current audio first
      await cleanup();
      setAudioFile(null);
      setPlaybackState('idle');
      setCurrentChapterId(null);
      setHighlightState({
        verseKey: null,
        wordPosition: null,
        completedVerseKeys: new Set(),
      });
      // Set new reciter last - this triggers the screen's useEffect to reload
      setSelectedReciter(reciter);
    },
    [cleanup]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const value = useMemo<AudioPlayerContextValue>(
    () => ({
      playbackState,
      currentPosition,
      duration,
      highlightState,
      reciters,
      selectedReciter,
      isLoadingReciters: recitersQuery.isLoading,
      loadChapter,
      play,
      pause,
      seekTo,
      selectReciter,
      reset,
    }),
    [
      playbackState,
      currentPosition,
      duration,
      highlightState,
      reciters,
      selectedReciter,
      recitersQuery.isLoading,
      loadChapter,
      play,
      pause,
      seekTo,
      selectReciter,
      reset,
    ]
  );

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = (): AudioPlayerContextValue => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};

