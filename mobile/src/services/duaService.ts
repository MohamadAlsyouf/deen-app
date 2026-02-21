/**
 * Dua/Supplication Service
 * Fetches dua data from Firestore
 */

import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Dua, DuaCategory, DuaCategoryInfo, DuaData } from '@/types/dua';

export const duaService = {
  /**
   * Get all dua categories metadata
   */
  getCategories: async (): Promise<DuaCategoryInfo[]> => {
    const docRef = doc(db, 'duaData', 'categories');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Dua categories not found.');
    }

    return docSnap.data().items as DuaCategoryInfo[];
  },

  /**
   * Get duas for a specific category
   */
  getDuasByCategory: async (category: DuaCategory): Promise<Dua[]> => {
    const docRef = doc(db, 'duaData', category);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`Duas for category "${category}" not found.`);
    }

    return docSnap.data().items as Dua[];
  },

  /**
   * Get all dua data (categories + all duas)
   */
  getAllData: async (): Promise<DuaData> => {
    const [categories, morning, evening, daily, afterSalah] = await Promise.all([
      duaService.getCategories(),
      duaService.getDuasByCategory('morning'),
      duaService.getDuasByCategory('evening'),
      duaService.getDuasByCategory('daily'),
      duaService.getDuasByCategory('after-salah'),
    ]);

    return {
      categories,
      duas: {
        morning,
        evening,
        daily,
        'after-salah': afterSalah,
      },
    };
  },
};
