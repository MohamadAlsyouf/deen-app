export type AsmaUlHusnaName = {
  number: number;
  name: string;
  transliteration: string;
  translation: string;
  meaning: string;
  audio: string;
};

export type AsmaUlHusnaData = {
  names: AsmaUlHusnaName[];
  total: number;
  language: string;
  language_code: string;
  title: string;
  arabic_title: string;
  description: string;
  recitation_benefits: string;
  hadith: string;
};

export type AsmaUlHusnaResponse = {
  code: number;
  status: string;
  data: AsmaUlHusnaData;
};
