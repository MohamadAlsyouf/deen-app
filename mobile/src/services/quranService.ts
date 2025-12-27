import type { QuranChaptersResponse, QuranChapter, QuranVersesResponse } from '@/types/quran';

const QURAN_API_BASE_URL = 'https://api.quran.com/api/v4';
const DEFAULT_ENGLISH_TRANSLATION_ID = 20;

type QueryValue = string | number | boolean | null | undefined;

const buildUrl = (path: string, query?: Record<string, QueryValue>): string => {
  const url = new URL(`${QURAN_API_BASE_URL}${path}`);
  if (!query) {
    return url.toString();
  }

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    url.searchParams.set(key, String(value));
  });

  return url.toString();
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `Request failed (${response.status})`);
  }
  return (await response.json()) as T;
};

export const quranService = {
  getChapters: async (): Promise<QuranChapter[]> => {
    const url = buildUrl('/chapters', { language: 'en' });
    const data = await fetchJson<QuranChaptersResponse>(url);
    return data.chapters;
  },

  getVersesByChapter: async (params: {
    chapterId: number;
    page: number;
    perPage: number;
  }): Promise<QuranVersesResponse> => {
    const { chapterId, page, perPage } = params;
    const url = buildUrl(`/verses/by_chapter/${chapterId}`, {
      language: 'en',
      words: true,
      word_fields: 'text_uthmani,transliteration',
      fields: 'text_uthmani,verse_key,verse_number',
      translations: DEFAULT_ENGLISH_TRANSLATION_ID,
      page,
      per_page: perPage,
    });

    return await fetchJson<QuranVersesResponse>(url);
  },
};


