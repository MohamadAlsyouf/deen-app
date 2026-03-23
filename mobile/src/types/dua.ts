/**
 * Types for Dua/Supplication feature
 */

export interface Dua {
  title: string;
  arabic: string;
  latin: string;
  translation: string;
  notes: string | null;
  benefits?: string | null;
  fawaid?: string | null;
  source: string | null;
}

export type DuaCategory = string;

export interface DuaCategoryInfo {
  id: DuaCategory;
  title: string;
  titleArabic: string;
  description: string;
  icon: string;
  gradientColors: [string, string];
  featured?: boolean;
  order?: number;
  count: number;
}

export interface DuaData {
  categories: DuaCategoryInfo[];
  duas: Record<DuaCategory, Dua[]>;
}
