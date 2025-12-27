export type QuranTranslatedName = {
  language_name: string;
  name: string;
};

export type QuranChapter = {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: [number, number];
  translated_name?: QuranTranslatedName;
};

export type QuranChaptersResponse = {
  chapters: QuranChapter[];
};

export type QuranPagination = {
  per_page: number;
  current_page: number;
  next_page: number | null;
  total_pages: number;
  total_records: number;
};

export type QuranWord = {
  id: number;
  position: number;
  audio_url: string | null;
  char_type_name: string;
  text_uthmani: string;
  transliteration?: {
    text?: string | null;
    language_name?: string;
  } | null;
  translation?: {
    text?: string | null;
    language_name?: string;
  } | null;
};

export type QuranVerseTranslation = {
  id: number;
  resource_id: number;
  text: string;
};

export type QuranVerse = {
  id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
  words?: QuranWord[];
  translations?: QuranVerseTranslation[];
};

export type QuranVersesResponse = {
  verses: QuranVerse[];
  pagination: QuranPagination;
};


