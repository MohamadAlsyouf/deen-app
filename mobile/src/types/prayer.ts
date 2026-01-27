/**
 * Types for Prayer Guide feature
 */

export interface PrayerStep {
  order: number;
  name: string;
  nameArabic: string;
  position: 'standing' | 'bowing' | 'prostrating' | 'sitting' | 'turning';
  arabicText: string;
  transliteration: string;
  translation: string;
  instruction: string;
  repetitions?: number;
  note?: string;
}

export interface Prayer {
  id: string;
  name: string;
  nameArabic: string;
  time: string;
  rakaat: number;
  sunnahBefore?: number;
  sunnahAfter?: number;
  description: string;
  significance: string;
  steps: PrayerStep[];
}

export interface PrayerGuideData {
  title: string;
  description: string;
  introduction: string;
  prayers: Prayer[];
  commonElements: {
    wudu: {
      title: string;
      description: string;
      steps: string[];
    };
    niyyah: {
      title: string;
      description: string;
      example: string;
    };
  };
}
