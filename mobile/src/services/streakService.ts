import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { UserProfile } from '@/types/user';

export type LoginStreakResult = {
  streakCount: number;
  previousCount: number;
  awardedToday: boolean;
  dayKey: string;
};

const parseDayKey = (dayKey: string): Date => {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const getLocalDayKey = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDayDifference = (previousDayKey: string, currentDayKey: string): number => {
  const previous = parseDayKey(previousDayKey);
  const current = parseDayKey(currentDayKey);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((current.getTime() - previous.getTime()) / millisecondsPerDay);
};

export const streakService = {
  syncDailyLoginStreak: async (uid: string): Promise<LoginStreakResult> => {
    const userRef = doc(db, 'users', uid);
    const dayKey = getLocalDayKey();

    return runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(userRef);
      const data = snapshot.exists() ? (snapshot.data() as UserProfile) : null;

      const previousCount = data?.loginStreakCount ?? 0;
      const previousDayKey = data?.lastLoginDayKey ?? null;
      const normalizedPreviousCount =
        previousDayKey && previousCount <= 0 ? 1 : Math.max(previousCount, 0);

      if (previousDayKey === dayKey) {
        if (previousCount <= 0) {
          transaction.set(
            userRef,
            {
              loginStreakCount: 1,
              lastLoginDayKey: dayKey,
              lastLoginAt: serverTimestamp(),
            },
            { merge: true },
          );

          return {
            streakCount: 1,
            previousCount,
            awardedToday: true,
            dayKey,
          };
        }

        return {
          streakCount: normalizedPreviousCount,
          previousCount,
          awardedToday: false,
          dayKey,
        };
      }

      let nextCount = 1;
      if (previousDayKey) {
        const dayDifference = getDayDifference(previousDayKey, dayKey);
        nextCount = dayDifference === 1 ? normalizedPreviousCount + 1 : 1;
      }

      transaction.set(
        userRef,
        {
          loginStreakCount: nextCount,
          lastLoginDayKey: dayKey,
          lastLoginAt: serverTimestamp(),
        },
        { merge: true },
      );

      return {
        streakCount: nextCount,
        previousCount,
        awardedToday: true,
        dayKey,
      };
    });
  },
};
