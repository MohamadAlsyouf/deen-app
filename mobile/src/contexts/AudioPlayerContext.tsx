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

type VerseRange = {
  startVerse: number | null;
  endVerse: number | null;
};

type LoopSettings = {
  loopCount: number | null; // null = no looping, number = loop that many times
  isInfiniteLoop: boolean;
  currentIteration: number; // tracks which loop we're on (1-indexed)
};

type AudioPlayerContextValue = {
  // Playback state
  playbackState: PlaybackState;
  currentPosition: number;
  duration: number;
  highlightState: HighlightState;
  errorMessage: string | null;

  // Reciter state
  reciters: NormalizedReciter[];
  selectedReciter: NormalizedReciter | null;
  isLoadingReciters: boolean;

  // Verse range state
  verseRange: VerseRange;
  
  // Loop settings state
  loopSettings: LoopSettings;
  
  // Audio file for verse info
  audioFile: ChapterAudioFile | null;

  // Actions
  loadChapter: (chapterId: number) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  selectReciter: (reciter: NormalizedReciter) => void;
  setVerseRange: (startVerse: number | null, endVerse: number | null) => void;
  clearVerseRange: () => void;
  setLoopSettings: (loopCount: number | null, isInfiniteLoop: boolean) => void;
  clearLoopSettings: () => void;
  resetPlaybackSettings: () => void;
  clearError: () => void;
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
  const [verseRange, setVerseRangeState] = useState<VerseRange>({
    startVerse: null,
    endVerse: null,
  });
  const [loopSettings, setLoopSettingsState] = useState<LoopSettings>({
    loopCount: null,
    isInfiniteLoop: false,
    currentIteration: 1,
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

  // Offset to sync highlighting with actual audio playback
  // The API timestamps are slightly early, and there's audio buffering latency
  const HIGHLIGHT_DELAY_MS = 200;
  
  // Buffer offsets for clean verse range boundaries
  // Prevents hearing slivers of adjacent verses when looping
  // The API timestamps tend to be significantly early, so we need larger buffers
  const VERSE_START_BUFFER_MS = 700; // Skip residual audio from previous verse
  const VERSE_END_BUFFER_MS = 200;   // Stop before bleeding into next verse

  // Find current verse and word based on position
  const updateHighlightFromPosition = useCallback(
    (positionMs: number) => {
      if (!audioFile?.verse_timings) {
        return;
      }

      // Apply delay offset - we compare against an earlier position
      // so highlighting happens later relative to the reported position
      const adjustedPosition = positionMs - HIGHLIGHT_DELAY_MS;

      const timings = audioFile.verse_timings;
      let currentVerseKey: string | null = null;
      let currentWordPosition: number | null = null;
      const completedKeys = new Set<string>();

      for (const timing of timings) {
        const timestampFrom = timing.timestamp_from;
        const timestampTo = timing.timestamp_to;

        if (adjustedPosition >= timestampTo) {
          completedKeys.add(timing.verse_key);
          continue;
        }

        if (adjustedPosition >= timestampFrom && adjustedPosition < timestampTo) {
          currentVerseKey = timing.verse_key;

          // Find current word within verse
          if (timing.segments && timing.segments.length > 0) {
            for (const segment of timing.segments) {
              const [wordPos, wordStart, wordEnd] = segment;
              if (adjustedPosition >= wordStart && adjustedPosition < wordEnd) {
                currentWordPosition = wordPos;
                break;
              }
              if (adjustedPosition >= wordEnd) {
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

        // Set up playback status callback for reliable end detection
        sound.setOnPlaybackStatusUpdate((playbackStatus) => {
          if (!playbackStatus.isLoaded) {
            return;
          }
          
          // Check for natural end of audio (didJustFinish)
          if (playbackStatus.didJustFinish) {
            handlePlaybackFinished();
            return;
          }
          
          // Check for verse range end (if endVerse is set)
          const { endVerse } = verseRangeRef.current;
          if (endVerse !== null && !isRestartingRef.current) {
            const currentAudioFile = audioFileRef.current;
            const currentChapter = currentChapterIdRef.current;
            
            if (currentAudioFile?.verse_timings && currentChapter) {
              const endVerseKey = `${currentChapter}:${endVerse}`;
              const endTiming = currentAudioFile.verse_timings.find((t) => t.verse_key === endVerseKey);
              
              // Subtract buffer to stop before bleeding into the next verse
              if (endTiming && playbackStatus.positionMillis >= endTiming.timestamp_to - VERSE_END_BUFFER_MS) {
                handlePlaybackFinished();
              }
            }
          }
        });

        setPlaybackState('paused');
      } catch (error) {
        console.error('Failed to load chapter audio:', error);
        // Check if it's a file not found error (reciter doesn't have this chapter)
        const errorStr = String(error);
        if (errorStr.includes('-1100') || errorStr.includes('NSURLErrorDomain')) {
          setErrorMessage('Audio not available for this reciter. Please select a different reciter.');
        } else {
          setErrorMessage('Failed to load audio. Please try again.');
        }
        setPlaybackState('error');
      } finally {
        isLoadingRef.current = false;
      }
    },
    [selectedReciter, currentChapterId, audioFile, cleanup]
  );

  // Clear error state
  const clearError = useCallback(() => {
    setErrorMessage(null);
    setPlaybackState('idle');
  }, []);

  // Ref to access verse range in interval without causing re-renders
  const verseRangeRef = useRef<VerseRange>({ startVerse: null, endVerse: null });
  
  // Ref to access loop settings in interval without causing re-renders
  const loopSettingsRef = useRef<LoopSettings>({
    loopCount: null,
    isInfiniteLoop: false,
    currentIteration: 1,
  });
  
  // Flag to prevent multiple restart triggers
  const isRestartingRef = useRef(false);
  
  // Store the actual loop start position (set when play is called with a verse range)
  // This ensures we use the EXACT same position for all loop iterations
  const loopStartPositionRef = useRef<number>(0);
  
  // Keep refs in sync with state
  useEffect(() => {
    verseRangeRef.current = verseRange;
  }, [verseRange]);

  useEffect(() => {
    loopSettingsRef.current = loopSettings;
  }, [loopSettings]);

  // Refs to store audio file and chapter id for use in callback (avoids stale closures)
  const audioFileRef = useRef<ChapterAudioFile | null>(null);
  const currentChapterIdRef = useRef<number | null>(null);
  
  // Keep audio refs in sync
  useEffect(() => {
    audioFileRef.current = audioFile;
  }, [audioFile]);
  
  useEffect(() => {
    currentChapterIdRef.current = currentChapterId;
  }, [currentChapterId]);

  // Handle playback finished - called by onPlaybackStatusUpdate callback
  const handlePlaybackFinished = useCallback(async () => {
    if (!soundRef.current || isRestartingRef.current) {
      return;
    }
    
    isRestartingRef.current = true;
    
    const { loopCount, isInfiniteLoop, currentIteration } = loopSettingsRef.current;
    const shouldLoop = isInfiniteLoop || (loopCount !== null && currentIteration < loopCount);
    
    if (shouldLoop) {
      // Increment iteration counter (only if not infinite)
      if (!isInfiniteLoop && loopCount !== null) {
        setLoopSettingsState((prev) => ({
          ...prev,
          currentIteration: prev.currentIteration + 1,
        }));
      }
      
      // Use the stored start position (calculated when play() was first called)
      const startPosition = loopStartPositionRef.current;
      
      try {
        // Reset highlight state for new iteration
        setHighlightState({
          verseKey: null,
          wordPosition: null,
          completedVerseKeys: new Set(),
        });
        
        // Nuclear option: unload and reload the audio to guarantee fresh start
        // This clears all internal buffers completely
        const currentAudioFile = audioFileRef.current;
        if (!currentAudioFile) {
          console.error('[LOOP DEBUG] No audio file to reload');
          isRestartingRef.current = false;
          return;
        }
        
        
        // Unload current sound
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        
        // Reload audio
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });
        
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: currentAudioFile.audio_url },
          { shouldPlay: false, positionMillis: startPosition }
        );
        
        soundRef.current = newSound;
        
        // Re-attach the playback status callback
        newSound.setOnPlaybackStatusUpdate((playbackStatus) => {
          if (!playbackStatus.isLoaded) return;
          
          if (playbackStatus.didJustFinish) {
            handlePlaybackFinished();
            return;
          }
          
          const { endVerse } = verseRangeRef.current;
          if (endVerse !== null && !isRestartingRef.current) {
            const currentChapter = currentChapterIdRef.current;
            if (currentAudioFile?.verse_timings && currentChapter) {
              const endVerseKey = `${currentChapter}:${endVerse}`;
              const endTiming = currentAudioFile.verse_timings.find((t) => t.verse_key === endVerseKey);
              if (endTiming && playbackStatus.positionMillis >= endTiming.timestamp_to - VERSE_END_BUFFER_MS) {
                handlePlaybackFinished();
              }
            }
          }
        });
        
        setCurrentPosition(startPosition);
        
        await newSound.playAsync();
        setPlaybackState('playing');
      } catch (e) {
        console.error('Error restarting playback:', e);
      }
      
      // Small delay before allowing next end detection
      setTimeout(() => {
        isRestartingRef.current = false;
      }, 500);
    } else {
      // No more loops - stop playback and prepare for restart
      const resetPosition = loopStartPositionRef.current;
      
      try {
        await soundRef.current.pauseAsync();
      } catch {
        // May already be paused
      }
      
      await soundRef.current.setPositionAsync(resetPosition);
      setCurrentPosition(resetPosition);
      setPlaybackState('paused');
      
      // Reset highlight state
      setHighlightState({
        verseKey: null,
        wordPosition: null,
        completedVerseKeys: new Set(),
      });
      
      // Stop tracking
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      isRestartingRef.current = false;
    }
  }, []);

  // Start position tracking (simplified - only updates position and highlighting)
  // End detection is now handled by onPlaybackStatusUpdate callback
  const startTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Reset the restart flag when starting fresh tracking
    isRestartingRef.current = false;

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
        }
      } catch {
        // Ignore status errors during cleanup
      }
    }, 100);
  }, [updateHighlightFromPosition]);

  // Stop position tracking
  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Helper to get verse timing by verse number
  const getVerseTimingByNumber = useCallback(
    (verseNumber: number): VerseTimestamp | undefined => {
      if (!audioFile?.verse_timings || !currentChapterId) {
        return undefined;
      }
      const verseKey = `${currentChapterId}:${verseNumber}`;
      return audioFile.verse_timings.find((t) => t.verse_key === verseKey);
    },
    [audioFile, currentChapterId]
  );

  // Play audio
  const play = useCallback(async () => {
    if (!soundRef.current || !audioFile) {
      return;
    }

    try {
      // If we have a start verse in the range, calculate the start position
      if (verseRange.startVerse !== null) {
        const startTiming = getVerseTimingByNumber(verseRange.startVerse);
        if (startTiming) {
          let startPosition: number;
          
          // If start verse is > 1, use timestamp_to of the PREVIOUS verse
          // This is more accurate than timestamp_from which tends to be too early
          if (verseRange.startVerse > 1) {
            const prevVerseTiming = getVerseTimingByNumber(verseRange.startVerse - 1);
            if (prevVerseTiming) {
              // Use the end of the previous verse + buffer
              startPosition = prevVerseTiming.timestamp_to + 250;
            } else {
              // Fallback to timestamp_from with large buffer
              startPosition = startTiming.timestamp_from + VERSE_START_BUFFER_MS;
            }
          } else {
            // First verse - just use timestamp_from
            startPosition = startTiming.timestamp_from;
          }
          
          // Store this position for use in loop restarts
          loopStartPositionRef.current = startPosition;
          
          // Use the same reload approach as loop restarts for consistent behavior
          // This ensures the first iteration matches subsequent iterations
          
          await soundRef.current.unloadAsync();
          soundRef.current = null;
          
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
          });
          
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: audioFile.audio_url },
            { shouldPlay: false, positionMillis: startPosition }
          );
          
          soundRef.current = newSound;
          
          // Re-attach the playback status callback
          newSound.setOnPlaybackStatusUpdate((playbackStatus) => {
            if (!playbackStatus.isLoaded) return;
            
            if (playbackStatus.didJustFinish) {
              handlePlaybackFinished();
              return;
            }
            
            const { endVerse } = verseRangeRef.current;
            if (endVerse !== null && !isRestartingRef.current) {
              const currentChapter = currentChapterIdRef.current;
              const currentAudioFile = audioFileRef.current;
              if (currentAudioFile?.verse_timings && currentChapter) {
                const endVerseKey = `${currentChapter}:${endVerse}`;
                const endTiming = currentAudioFile.verse_timings.find((t) => t.verse_key === endVerseKey);
                if (endTiming && playbackStatus.positionMillis >= endTiming.timestamp_to - VERSE_END_BUFFER_MS) {
                  handlePlaybackFinished();
                }
              }
            }
          });
          
          setCurrentPosition(startPosition);
          await newSound.playAsync();
          setPlaybackState('playing');
          startTracking();
          return;
        }
      }
      
      // No verse range - start from beginning normally
      loopStartPositionRef.current = 0;

      await soundRef.current.playAsync();
      setPlaybackState('playing');
      startTracking();
    } catch (error) {
      console.error('Failed to play audio:', error);
      setPlaybackState('error');
    }
  }, [startTracking, verseRange.startVerse, getVerseTimingByNumber, audioFile]);

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
      setErrorMessage(null); // Clear any previous error
      setCurrentChapterId(null);
      // Reset position and duration immediately so UI updates
      setCurrentPosition(0);
      setDuration(0);
      loopStartPositionRef.current = 0;
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

  // Set verse range for playback
  const setVerseRange = useCallback(
    (startVerse: number | null, endVerse: number | null) => {
      setVerseRangeState({ startVerse, endVerse });
    },
    []
  );

  // Clear verse range (play full chapter)
  const clearVerseRange = useCallback(() => {
    setVerseRangeState({ startVerse: null, endVerse: null });
  }, []);

  // Set loop settings
  const setLoopSettings = useCallback(
    (loopCount: number | null, isInfiniteLoop: boolean) => {
      setLoopSettingsState({
        loopCount,
        isInfiniteLoop,
        currentIteration: 1, // Reset iteration when settings change
      });
    },
    []
  );

  // Clear loop settings
  const clearLoopSettings = useCallback(() => {
    setLoopSettingsState({
      loopCount: null,
      isInfiniteLoop: false,
      currentIteration: 1,
    });
  }, []);

  // Reset all playback settings (verse range + loop) - call when leaving screen
  const resetPlaybackSettings = useCallback(() => {
    setVerseRangeState({ startVerse: null, endVerse: null });
    setLoopSettingsState({
      loopCount: null,
      isInfiniteLoop: false,
      currentIteration: 1,
    });
  }, []);

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
      errorMessage,
      reciters,
      selectedReciter,
      isLoadingReciters: recitersQuery.isLoading,
      verseRange,
      loopSettings,
      audioFile,
      loadChapter,
      play,
      pause,
      seekTo,
      selectReciter,
      setVerseRange,
      clearVerseRange,
      setLoopSettings,
      clearLoopSettings,
      resetPlaybackSettings,
      clearError,
      reset,
    }),
    [
      playbackState,
      currentPosition,
      duration,
      highlightState,
      errorMessage,
      reciters,
      selectedReciter,
      recitersQuery.isLoading,
      verseRange,
      loopSettings,
      audioFile,
      loadChapter,
      play,
      pause,
      seekTo,
      selectReciter,
      setVerseRange,
      clearVerseRange,
      setLoopSettings,
      clearLoopSettings,
      resetPlaybackSettings,
      clearError,
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

