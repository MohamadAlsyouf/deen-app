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

// Audio Types
export type QuranReciter = {
  id: number;
  name: string;
  arabic_name: string;
  relative_path: string;
  format: string;
  files_size: number;
};

export type QuranRecitersResponse = {
  reciters: QuranReciter[];
};

export type AudioSegment = [number, number, number]; // [word_position, start_timestamp_ms, end_timestamp_ms]

export type VerseTimestamp = {
  verse_key: string;
  timestamp_from: number;
  timestamp_to: number;
  duration: number;
  segments: AudioSegment[];
};

export type ChapterAudioFile = {
  id: number;
  chapter_id: number;
  file_size: number;
  format: string;
  audio_url: string;
  verse_timings: VerseTimestamp[];
};

export type ChapterAudioResponse = {
  audio_file: ChapterAudioFile;
};


