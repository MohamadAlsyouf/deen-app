import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/hooks/useAuth';
import type {
  QuranProgressData,
  ChapterProgress,
  QuranProgressContextType,
} from '@/types/quranProgress';

const LEGACY_STORAGE_KEY = '@arkan_quran_progress';
const USER_STORAGE_KEY_PREFIX = '@arkan_quran_progress:';

const createEmptyProgress = (): QuranProgressData => ({
  chapters: {},
  updatedAt: new Date().toISOString(),
});

const createEmptyChapterProgress = (chapterId: number): ChapterProgress => ({
  chapterId,
  listenProgress: 0,
  readProgress: 0,
  lastListenPosition: 0,
  lastReadVerse: 1,
  lastUpdated: new Date().toISOString(),
});

const QuranProgressContext = createContext<QuranProgressContextType>({
  progress: createEmptyProgress(),
  loading: true,
  updateListenProgress: () => {},
  updateReadProgress: () => {},
  getChapterProgress: () => ({ progress: 0, lastReadVerse: 1, lastListenPosition: 0 }),
  getOverallProgress: () => 0,
});

export const useQuranProgress = () => useContext(QuranProgressContext);

const getUserStorageKey = (uid: string) => `${USER_STORAGE_KEY_PREFIX}${uid}`;

const normalizeProgress = (value: unknown): QuranProgressData => {
  if (!value || typeof value !== 'object') {
    return createEmptyProgress();
  }

  const data = value as Record<string, unknown>;

  if (!data.chapters || typeof data.chapters !== 'object') {
    return createEmptyProgress();
  }

  const chapters: Record<number, ChapterProgress> = {};
  const rawChapters = data.chapters as Record<string, unknown>;

  Object.entries(rawChapters).forEach(([key, chapterData]) => {
    const chapterId = parseInt(key, 10);
    if (isNaN(chapterId) || !chapterData || typeof chapterData !== 'object') {
      return;
    }

    const chapter = chapterData as Record<string, unknown>;
    chapters[chapterId] = {
      chapterId,
      listenProgress: typeof chapter.listenProgress === 'number' ? chapter.listenProgress : 0,
      readProgress: typeof chapter.readProgress === 'number' ? chapter.readProgress : 0,
      lastListenPosition:
        typeof chapter.lastListenPosition === 'number' ? chapter.lastListenPosition : 0,
      lastReadVerse: typeof chapter.lastReadVerse === 'number' ? chapter.lastReadVerse : 1,
      lastUpdated: typeof chapter.lastUpdated === 'string' ? chapter.lastUpdated : new Date().toISOString(),
    };
  });

  return {
    chapters,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
  };
};

const mergeProgress = (local: QuranProgressData, remote: QuranProgressData): QuranProgressData => {
  const merged: QuranProgressData = {
    chapters: {},
    updatedAt: new Date().toISOString(),
  };

  const allChapterIds = new Set([
    ...Object.keys(local.chapters).map(Number),
    ...Object.keys(remote.chapters).map(Number),
  ]);

  allChapterIds.forEach((chapterId) => {
    const localChapter = local.chapters[chapterId];
    const remoteChapter = remote.chapters[chapterId];

    if (!localChapter && remoteChapter) {
      merged.chapters[chapterId] = remoteChapter;
    } else if (localChapter && !remoteChapter) {
      merged.chapters[chapterId] = localChapter;
    } else if (localChapter && remoteChapter) {
      // Keep the one with higher progress or more recent update
      const localTime = new Date(localChapter.lastUpdated).getTime();
      const remoteTime = new Date(remoteChapter.lastUpdated).getTime();
      const localMaxProgress = Math.max(localChapter.listenProgress, localChapter.readProgress);
      const remoteMaxProgress = Math.max(remoteChapter.listenProgress, remoteChapter.readProgress);

      if (localMaxProgress > remoteMaxProgress) {
        merged.chapters[chapterId] = localChapter;
      } else if (remoteMaxProgress > localMaxProgress) {
        merged.chapters[chapterId] = remoteChapter;
      } else {
        // Same progress, use most recent
        merged.chapters[chapterId] = localTime >= remoteTime ? localChapter : remoteChapter;
      }
    }
  });

  return merged;
};

const readLocalProgress = async (key: string): Promise<QuranProgressData> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? normalizeProgress(JSON.parse(raw)) : createEmptyProgress();
  } catch {
    return createEmptyProgress();
  }
};

const persistLocalProgress = async (key: string, progress: QuranProgressData) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(progress));
  } catch {}
};

export const QuranProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<QuranProgressData>(createEmptyProgress());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const progressRef = useRef<QuranProgressData>(createEmptyProgress());
  const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    let isActive = true;

    if (!user?.uid) {
      setLoading(true);
      (async () => {
        const localProgress = await readLocalProgress(LEGACY_STORAGE_KEY);
        if (!isActive) return;
        setProgress(localProgress);
        setLoading(false);
      })();
      return () => {
        isActive = false;
      };
    }

    setLoading(true);
    const userRef = doc(db, 'users', user.uid);
    const userStorageKey = getUserStorageKey(user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      async (snapshot) => {
        const snapshotData = snapshot.data();
        const hasRemoteProgressField =
          snapshotData?.quranProgress && typeof snapshotData.quranProgress === 'object';
        const remoteProgress = normalizeProgress(snapshotData?.quranProgress);
        const userCachedProgress = await readLocalProgress(userStorageKey);
        const legacyProgress = !hasRemoteProgressField
          ? await readLocalProgress(LEGACY_STORAGE_KEY)
          : createEmptyProgress();

        if (!isActive) return;

        const mergedProgress = hasRemoteProgressField
          ? remoteProgress
          : mergeProgress(mergeProgress(userCachedProgress, legacyProgress), remoteProgress);

        const remoteChanged =
          !hasRemoteProgressField &&
          JSON.stringify(mergedProgress) !== JSON.stringify(remoteProgress);

        setProgress(mergedProgress);
        await persistLocalProgress(userStorageKey, mergedProgress);

        if (Object.keys(legacyProgress.chapters).length > 0) {
          try {
            await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
          } catch {}
        }

        if (remoteChanged) {
          try {
            await setDoc(userRef, { quranProgress: mergedProgress }, { merge: true });
          } catch (error) {
            console.error('Failed to sync quran progress to Firestore:', error);
          }
        }

        if (isActive) {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Failed to subscribe to quran progress:', error);
        if (isActive) {
          setLoading(false);
        }
      }
    );

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [user?.uid]);

  const persistProgress = useCallback(
    async (nextProgress: QuranProgressData) => {
      if (user?.uid) {
        const userRef = doc(db, 'users', user.uid);
        const userStorageKey = getUserStorageKey(user.uid);
        await persistLocalProgress(userStorageKey, nextProgress);
        try {
          await setDoc(userRef, { quranProgress: nextProgress }, { merge: true });
        } catch (error) {
          console.error('Failed to persist quran progress:', error);
        }
        return;
      }

      await persistLocalProgress(LEGACY_STORAGE_KEY, nextProgress);
    },
    [user?.uid]
  );

  const scheduleProgressPersist = useCallback(
    (nextProgress: QuranProgressData) => {
      // Debounce persistence to avoid too many writes
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current);
      }
      pendingUpdateRef.current = setTimeout(() => {
        void persistProgress(nextProgress);
        pendingUpdateRef.current = null;
      }, 1000);
    },
    [persistProgress]
  );

  const updateListenProgress = useCallback(
    (chapterId: number, position: number, duration: number) => {
      const current = progressRef.current;
      const listenProgress = duration > 0 ? Math.round((position / duration) * 100) : 0;

      const existingChapter = current.chapters[chapterId] || createEmptyChapterProgress(chapterId);

      // Only update if progress increased or position changed significantly
      if (
        listenProgress <= existingChapter.listenProgress &&
        Math.abs(position - existingChapter.lastListenPosition) < 5000
      ) {
        return;
      }

      const updatedChapter: ChapterProgress = {
        ...existingChapter,
        listenProgress: Math.max(listenProgress, existingChapter.listenProgress),
        lastListenPosition: position,
        lastUpdated: new Date().toISOString(),
      };

      const nextProgress: QuranProgressData = {
        chapters: {
          ...current.chapters,
          [chapterId]: updatedChapter,
        },
        updatedAt: new Date().toISOString(),
      };

      setProgress(nextProgress);
      scheduleProgressPersist(nextProgress);
    },
    [scheduleProgressPersist]
  );

  const updateReadProgress = useCallback(
    (chapterId: number, currentVerse: number, totalVerses: number) => {
      const current = progressRef.current;
      const readProgress = totalVerses > 0 ? Math.round((currentVerse / totalVerses) * 100) : 0;

      const existingChapter = current.chapters[chapterId] || createEmptyChapterProgress(chapterId);

      // Skip if verse hasn't changed (avoid unnecessary updates)
      if (currentVerse === existingChapter.lastReadVerse) {
        return;
      }

      // Always update lastReadVerse to track current position for restoration
      // Keep the max progress achieved (don't decrease if user scrolls back)
      const updatedChapter: ChapterProgress = {
        ...existingChapter,
        readProgress: Math.max(readProgress, existingChapter.readProgress),
        lastReadVerse: currentVerse,
        lastUpdated: new Date().toISOString(),
      };

      const nextProgress: QuranProgressData = {
        chapters: {
          ...current.chapters,
          [chapterId]: updatedChapter,
        },
        updatedAt: new Date().toISOString(),
      };

      setProgress(nextProgress);
      scheduleProgressPersist(nextProgress);
    },
    [scheduleProgressPersist]
  );

  const getChapterProgress = useCallback(
    (chapterId: number) => {
      const chapter = progress.chapters[chapterId];
      if (!chapter) {
        return { progress: 0, lastReadVerse: 1, lastListenPosition: 0 };
      }

      return {
        progress: Math.max(chapter.listenProgress, chapter.readProgress),
        lastReadVerse: chapter.lastReadVerse,
        lastListenPosition: chapter.lastListenPosition,
      };
    },
    [progress]
  );

  const getOverallProgress = useCallback(
    (chapters: Array<{ id: number; verses_count: number }>) => {
      const totalVerses = 6236; // Total verses in Quran
      let completedVerses = 0;

      chapters.forEach((chapter) => {
        const chapterProgress = progress.chapters[chapter.id];
        if (chapterProgress) {
          const displayProgress = Math.max(
            chapterProgress.listenProgress,
            chapterProgress.readProgress
          );
          completedVerses += (displayProgress / 100) * chapter.verses_count;
        }
      });

      return Math.round((completedVerses / totalVerses) * 100);
    },
    [progress]
  );

  return (
    <QuranProgressContext.Provider
      value={{
        progress,
        loading,
        updateListenProgress,
        updateReadProgress,
        getChapterProgress,
        getOverallProgress,
      }}
    >
      {children}
    </QuranProgressContext.Provider>
  );
};
