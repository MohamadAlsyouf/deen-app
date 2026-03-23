import type { Dua, DuaCategory, DuaCategoryInfo, DuaData } from '@/types/dua';

type DuaCategoryMeta = Omit<DuaCategoryInfo, 'count'>;
type CuratedExtraMap = Record<string, Dua[]>;

const morningDuas = require('../assets/data/dhikr-morning.json') as Dua[];
const eveningDuas = require('../assets/data/dhikr-evening.json') as Dua[];
const dailyDuas = require('../assets/data/dhikr-daily.json') as Dua[];
const afterSalahDuas = require('../assets/data/dhikr-after-salah.json') as Dua[];
const duaCategories = require('../assets/data/dua-categories.json') as DuaCategoryMeta[];
const curatedExtraDuas = require('../assets/data/dua-curated-extra.json') as CuratedExtraMap;

const baseDuasByCategory: Record<string, Dua[]> = {
  morning: morningDuas,
  evening: eveningDuas,
  daily: dailyDuas,
  'after-salah': afterSalahDuas,
  ...curatedExtraDuas,
};

const sortCategories = (categories: DuaCategoryInfo[]) =>
  [...categories].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

export const getLocalDuasByCategory = (category: DuaCategory): Dua[] =>
  [...(baseDuasByCategory[category] ?? [])];

export const hasLocalDuaCategory = (category: DuaCategory): boolean =>
  Array.isArray(baseDuasByCategory[category]);

export const getLocalDuaCategories = (): DuaCategoryInfo[] =>
  sortCategories(
    duaCategories.map((category) => ({
      ...category,
      count: getLocalDuasByCategory(category.id).length,
    }))
  );

export const getLocalDuaData = (): DuaData => {
  const categories = getLocalDuaCategories();
  const duas = categories.reduce<Record<string, Dua[]>>((accumulator, category) => {
    accumulator[category.id] = getLocalDuasByCategory(category.id);
    return accumulator;
  }, {});

  return { categories, duas };
};
