/**
 * Prayer Guide Service
 * Fetches prayer guide data from Firestore
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { PrayerGuideData } from '@/types/prayer';

export const prayerService = {
  /**
   * Get the complete prayer guide data
   */
  getPrayerGuide: async (): Promise<PrayerGuideData> => {
    const docRef = doc(db, 'prayerGuide', 'main');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Prayer guide data not found. Please seed the database.');
    }

    return docSnap.data() as PrayerGuideData;
  },
};
