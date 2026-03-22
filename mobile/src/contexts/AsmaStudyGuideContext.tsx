import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/hooks/useAuth';
import type {
  AsmaStudyGuideContextType,
  AsmaStudyGuideState,
  AsmaStudyGuideStat,
  StudyGuideOutcome,
} from '@/types/asmaStudyGuide';

const LEGACY_STORAGE_KEY = '@arkan_asma_study_guide';
const USER_STORAGE_KEY_PREFIX = '@arkan_asma_study_guide:';

const EMPTY_STUDY_GUIDE: AsmaStudyGuideState = {
  strugglingNameNumbers: [],
  statsByName: {},
  totalAttempts: 0,
  lastUpdatedAt: null,
};

const AsmaStudyGuideContext = createContext<AsmaStudyGuideContextType>({
  studyGuide: EMPTY_STUDY_GUIDE,
  loading: true,
  hasGameHistory: false,
  recordCorrect: () => {},
  recordIncorrect: () => {},
});

const getUserStorageKey = (uid: string) => `${USER_STORAGE_KEY_PREFIX}${uid}`;

const normalizeNameNumbers = (value: number | number[]) => {
  const numbers = Array.isArray(value) ? value : [value];
  return Array.from(new Set(numbers.filter((item) => Number.isFinite(item) && item > 0)));
};

const sortNumbers = (numbers: number[]) => [...numbers].sort((a, b) => a - b);

const normalizeStat = (key: string, value: unknown): AsmaStudyGuideStat | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<AsmaStudyGuideStat>;
  const nameNumber = Number(candidate.nameNumber ?? key);
  if (!Number.isFinite(nameNumber) || nameNumber <= 0) {
    return null;
  }

  return {
    nameNumber,
    wrongCount: Math.max(0, Number(candidate.wrongCount ?? 0) || 0),
    correctCount: Math.max(0, Number(candidate.correctCount ?? 0) || 0),
    lastSeenAt:
      typeof candidate.lastSeenAt === 'string' && candidate.lastSeenAt.length > 0
        ? candidate.lastSeenAt
        : new Date(0).toISOString(),
    lastOutcome: candidate.lastOutcome === 'correct' ? 'correct' : 'wrong',
  };
};

const normalizeStudyGuide = (value: unknown): AsmaStudyGuideState => {
  if (!value || typeof value !== 'object') {
    return EMPTY_STUDY_GUIDE;
  }

  const candidate = value as Partial<AsmaStudyGuideState>;
  const statsInput = candidate.statsByName && typeof candidate.statsByName === 'object'
    ? candidate.statsByName
    : {};

  const statsByName = Object.entries(statsInput).reduce<Record<string, AsmaStudyGuideStat>>(
    (accumulator, [key, statValue]) => {
      const normalized = normalizeStat(key, statValue);
      if (normalized) {
        accumulator[String(normalized.nameNumber)] = normalized;
      }
      return accumulator;
    },
    {}
  );

  const strugglingNameNumbers = sortNumbers(
    normalizeNameNumbers(
      Array.isArray(candidate.strugglingNameNumbers) ? candidate.strugglingNameNumbers : []
    ).filter((nameNumber) => Boolean(statsByName[String(nameNumber)]) || Object.keys(statsByName).length === 0)
  );

  return {
    strugglingNameNumbers,
    statsByName,
    totalAttempts: Math.max(0, Number(candidate.totalAttempts ?? 0) || 0),
    lastUpdatedAt:
      typeof candidate.lastUpdatedAt === 'string' && candidate.lastUpdatedAt.length > 0
        ? candidate.lastUpdatedAt
        : null,
  };
};

const mergeStudyGuides = (...guides: AsmaStudyGuideState[]): AsmaStudyGuideState => {
  let merged = EMPTY_STUDY_GUIDE;

  guides.forEach((guide) => {
    const normalizedGuide = normalizeStudyGuide(guide);
    const nextStats = { ...merged.statsByName };

    Object.entries(normalizedGuide.statsByName).forEach(([key, stat]) => {
      const existing = nextStats[key];
      if (!existing) {
        nextStats[key] = stat;
        return;
      }

      const existingTime = new Date(existing.lastSeenAt).getTime();
      const incomingTime = new Date(stat.lastSeenAt).getTime();
      nextStats[key] = incomingTime >= existingTime ? stat : existing;
    });

    const mergedStruggling = new Set(merged.strugglingNameNumbers);
    normalizedGuide.strugglingNameNumbers.forEach((nameNumber) => mergedStruggling.add(nameNumber));

    merged = {
      strugglingNameNumbers: sortNumbers(Array.from(mergedStruggling)),
      statsByName: nextStats,
      totalAttempts: Math.max(merged.totalAttempts, normalizedGuide.totalAttempts),
      lastUpdatedAt: [merged.lastUpdatedAt, normalizedGuide.lastUpdatedAt]
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1) ?? null,
    };
  });

  return merged;
};

const readLocalStudyGuide = async (key: string) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? normalizeStudyGuide(JSON.parse(raw)) : EMPTY_STUDY_GUIDE;
  } catch {
    return EMPTY_STUDY_GUIDE;
  }
};

const persistLocalStudyGuide = async (key: string, studyGuide: AsmaStudyGuideState) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(studyGuide));
  } catch {}
};

const buildNextStudyGuide = (
  current: AsmaStudyGuideState,
  outcome: StudyGuideOutcome,
  nameNumbers: number[]
) => {
  if (nameNumbers.length === 0) {
    return current;
  }

  const now = new Date().toISOString();
  const statsByName = { ...current.statsByName };
  const strugglingSet = new Set(current.strugglingNameNumbers);

  nameNumbers.forEach((nameNumber) => {
    const key = String(nameNumber);
    const existing = statsByName[key];
    statsByName[key] = {
      nameNumber,
      wrongCount: (existing?.wrongCount ?? 0) + (outcome === 'wrong' ? 1 : 0),
      correctCount: (existing?.correctCount ?? 0) + (outcome === 'correct' ? 1 : 0),
      lastSeenAt: now,
      lastOutcome: outcome,
    };

    if (outcome === 'wrong') {
      strugglingSet.add(nameNumber);
    } else {
      strugglingSet.delete(nameNumber);
    }
  });

  return {
    strugglingNameNumbers: sortNumbers(Array.from(strugglingSet)),
    statsByName,
    totalAttempts: current.totalAttempts + nameNumbers.length,
    lastUpdatedAt: now,
  };
};

export const useAsmaStudyGuide = () => useContext(AsmaStudyGuideContext);

export const AsmaStudyGuideProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [studyGuide, setStudyGuide] = useState<AsmaStudyGuideState>(EMPTY_STUDY_GUIDE);
  const [loading, setLoading] = useState(true);
  const studyGuideRef = useRef<AsmaStudyGuideState>(EMPTY_STUDY_GUIDE);

  useEffect(() => {
    studyGuideRef.current = studyGuide;
  }, [studyGuide]);

  useEffect(() => {
    let isActive = true;

    if (!user?.uid) {
      setLoading(true);
      (async () => {
        const localStudyGuide = await readLocalStudyGuide(LEGACY_STORAGE_KEY);
        if (!isActive) return;
        setStudyGuide(localStudyGuide);
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
        const hasRemoteStudyGuide = Boolean(snapshotData?.asmaStudyGuide);
        const remoteStudyGuide = normalizeStudyGuide(snapshotData?.asmaStudyGuide);
        const cachedStudyGuide = await readLocalStudyGuide(userStorageKey);
        const legacyStudyGuide = !hasRemoteStudyGuide
          ? await readLocalStudyGuide(LEGACY_STORAGE_KEY)
          : EMPTY_STUDY_GUIDE;

        if (!isActive) return;

        const mergedStudyGuide = hasRemoteStudyGuide
          ? remoteStudyGuide
          : mergeStudyGuides(cachedStudyGuide, legacyStudyGuide);
        const remoteChanged = !hasRemoteStudyGuide &&
          JSON.stringify(mergedStudyGuide) !== JSON.stringify(remoteStudyGuide);

        setStudyGuide(mergedStudyGuide);
        await persistLocalStudyGuide(userStorageKey, mergedStudyGuide);

        if (legacyStudyGuide.totalAttempts > 0 || legacyStudyGuide.strugglingNameNumbers.length > 0) {
          try {
            await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
          } catch {}
        }

        if (remoteChanged) {
          try {
            await setDoc(userRef, { asmaStudyGuide: mergedStudyGuide }, { merge: true });
          } catch (error) {
            console.error('Failed to sync study guide to Firestore:', error);
          }
        }

        if (isActive) {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Failed to subscribe to study guide:', error);
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

  const persistStudyGuide = useCallback(async (nextStudyGuide: AsmaStudyGuideState) => {
    if (user?.uid) {
      const userRef = doc(db, 'users', user.uid);
      const userStorageKey = getUserStorageKey(user.uid);
      await persistLocalStudyGuide(userStorageKey, nextStudyGuide);
      try {
        await setDoc(userRef, { asmaStudyGuide: nextStudyGuide }, { merge: true });
      } catch (error) {
        console.error('Failed to persist study guide:', error);
      }
      return;
    }

    await persistLocalStudyGuide(LEGACY_STORAGE_KEY, nextStudyGuide);
  }, [user?.uid]);

  const updateStudyGuide = useCallback((outcome: StudyGuideOutcome, input: number | number[]) => {
    const nameNumbers = normalizeNameNumbers(input);
    const nextStudyGuide = buildNextStudyGuide(studyGuideRef.current, outcome, nameNumbers);
    setStudyGuide(nextStudyGuide);
    void persistStudyGuide(nextStudyGuide);
  }, [persistStudyGuide]);

  const value = useMemo<AsmaStudyGuideContextType>(() => ({
    studyGuide,
    loading,
    hasGameHistory: studyGuide.totalAttempts > 0 || Object.keys(studyGuide.statsByName).length > 0,
    recordCorrect: (nameNumbers) => {
      updateStudyGuide('correct', nameNumbers);
    },
    recordIncorrect: (nameNumbers) => {
      updateStudyGuide('wrong', nameNumbers);
    },
  }), [loading, studyGuide, updateStudyGuide]);

  return (
    <AsmaStudyGuideContext.Provider value={value}>
      {children}
    </AsmaStudyGuideContext.Provider>
  );
};
