/**
 * Dua/Supplication Service
 * Uses local curated data immediately and supports Firestore parity via seed data
 */

import type { Dua, DuaCategory, DuaCategoryInfo, DuaData } from '@/types/dua';
import { getLocalDuaCategories, getLocalDuaData, getLocalDuasByCategory } from '@/data/duaContent';

export const duaService = {
  /**
   * Get all dua categories metadata
   */
  getCategories: async (): Promise<DuaCategoryInfo[]> => {
    return getLocalDuaCategories();
  },

  /**
   * Get duas for a specific category
   */
  getDuasByCategory: async (category: DuaCategory): Promise<Dua[]> => {
    const items = getLocalDuasByCategory(category);
    if (!items.length) {
      throw new Error(`Duas for category "${category}" not found.`);
    }
    return items;
  },

  /**
   * Get all dua data (categories + all duas)
   */
  getAllData: async (): Promise<DuaData> => {
    return getLocalDuaData();
  },
};
