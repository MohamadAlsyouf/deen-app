import { getLocalDayKey } from '@/services/streakService';
import type { QuranVerse } from '@/types/quran';
import { quranService } from '@/services/quranService';

type VerseReference = {
  chapterId: number;
  verseNumber: number;
};

export type VerseOfDayData = {
  dayKey: string;
  verseKey: string;
  chapterId: number;
  verseNumber: number;
  chapterName: string;
  chapterArabicName: string;
  arabicText: string;
  transliteration: string;
  translation: string;
};

const VERSE_POOL: VerseReference[] = [
  { chapterId: 1, verseNumber: 5 },
  { chapterId: 2, verseNumber: 2 },
  { chapterId: 2, verseNumber: 186 },
  { chapterId: 2, verseNumber: 286 },
  { chapterId: 3, verseNumber: 8 },
  { chapterId: 12, verseNumber: 87 },
  { chapterId: 13, verseNumber: 28 },
  { chapterId: 17, verseNumber: 24 },
  { chapterId: 24, verseNumber: 35 },
  { chapterId: 29, verseNumber: 69 },
  { chapterId: 39, verseNumber: 53 },
  { chapterId: 48, verseNumber: 4 },
  { chapterId: 55, verseNumber: 13 },
  { chapterId: 57, verseNumber: 20 },
  { chapterId: 65, verseNumber: 3 },
  { chapterId: 94, verseNumber: 5 },
];

const hashDayKey = (dayKey: string) => {
  let hash = 0;
  for (let i = 0; i < dayKey.length; i += 1) {
    hash = (hash * 31 + dayKey.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');

const cleanText = (value: string) =>
  decodeHtmlEntities(value)
    .replace(/<sup[^>]*>.*?<\/sup>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getTransliteration = (words: NonNullable<QuranVerse['words']>) =>
  words
    .filter((word) => word.char_type_name !== 'end')
    .map((word) => word.transliteration?.text)
    .filter((word): word is string => Boolean(word && word.trim()))
    .join(' ');

export const verseOfDayService = {
  getDailyReference: (dayKey = getLocalDayKey()): VerseReference => {
    const index = hashDayKey(dayKey) % VERSE_POOL.length;
    return VERSE_POOL[index];
  },

  getVerseOfDay: async (dayKey = getLocalDayKey()): Promise<VerseOfDayData> => {
    const reference = verseOfDayService.getDailyReference(dayKey);
    const verseKey = `${reference.chapterId}:${reference.verseNumber}`;
    const perPage = 50;
    const page = Math.max(1, Math.ceil(reference.verseNumber / perPage));

    const [chapters, versePage] = await Promise.all([
      quranService.getChapters(),
      quranService.getVersesByChapter({
        chapterId: reference.chapterId,
        page,
        perPage,
      }),
    ]);

    const chapter = chapters.find((item) => item.id === reference.chapterId);
    const verse =
      versePage.verses.find((item) => item.verse_key === verseKey) ||
      versePage.verses.find((item) => item.verse_number === reference.verseNumber);

    if (!verse) {
      throw new Error(`Verse ${verseKey} not found`);
    }

    const translation = cleanText(verse.translations?.[0]?.text || '');
    const transliteration = verse.words ? getTransliteration(verse.words) : '';

    return {
      dayKey,
      verseKey,
      chapterId: reference.chapterId,
      verseNumber: reference.verseNumber,
      chapterName: chapter?.name_simple || `Surah ${reference.chapterId}`,
      chapterArabicName: chapter?.name_arabic || '',
      arabicText: verse.text_uthmani,
      transliteration,
      translation,
    };
  },
};
