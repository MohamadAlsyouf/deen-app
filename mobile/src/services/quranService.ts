import type {
  QuranChaptersResponse,
  QuranChapter,
  QuranVersesResponse,
  QuranRecitersResponse,
  NormalizedReciter,
  ChapterAudioResponse,
  ChapterAudioFile,
} from "@/types/quran";

// Public API (for chapters and verses)
const QURAN_API_BASE_URL = "https://api.quran.com/api/v4";

// Authenticated API (for reciters and audio)
const QURAN_AUTH_API_BASE_URL =
  "https://apis-prelive.quran.foundation/content/api/v4";

// Firebase Cloud Function URL for OAuth2 token exchange
// This handles the OAuth2 flow server-side to avoid CORS issues
const FIREBASE_PROJECT_ID = "deen-app-753e6";
const FUNCTIONS_BASE_URL = `https://us-central1-${FIREBASE_PROJECT_ID}.cloudfunctions.net`;
const QURAN_TOKEN_FUNCTION_URL = `${FUNCTIONS_BASE_URL}/getQuranToken`;

const DEFAULT_ENGLISH_TRANSLATION_ID = 20;

// Token cache
let cachedAccessToken: string | null = null;
let cachedClientId: string | null = null;
let tokenExpiresAt: number = 0;

type QueryValue = string | number | boolean | null | undefined;

type FirebaseTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  client_id: string;
};

/**
 * Get OAuth2 access token via Firebase Cloud Function
 * This avoids CORS issues by making the OAuth2 request server-side
 */
const getAccessToken = async (): Promise<{
  accessToken: string;
  clientId: string;
}> => {
  // Return cached token if still valid (with 60s buffer before expiry)
  if (
    cachedAccessToken &&
    cachedClientId &&
    Date.now() < tokenExpiresAt - 60000
  ) {
    return { accessToken: cachedAccessToken, clientId: cachedClientId };
  }

  const response = await fetch(QURAN_TOKEN_FUNCTION_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("Token request error:", errorText);
    throw new Error(`Token request failed (${response.status}): ${errorText}`);
  }

  const data: FirebaseTokenResponse = await response.json();

  // Cache the token with expiry time
  cachedAccessToken = data.access_token;
  cachedClientId = data.client_id;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  return { accessToken: cachedAccessToken, clientId: cachedClientId };
};

const buildUrl = (
  path: string,
  query?: Record<string, QueryValue>,
  useAuthApi: boolean = false
): string => {
  const baseUrl = useAuthApi ? QURAN_AUTH_API_BASE_URL : QURAN_API_BASE_URL;
  const url = new URL(`${baseUrl}${path}`);
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

const fetchJson = async <T>(
  url: string,
  useAuth: boolean = false
): Promise<T> => {
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (useAuth) {
    // Get JWT access token from Firebase function
    const { accessToken, clientId } = await getAccessToken();
    headers["x-client-id"] = clientId;
    headers["x-auth-token"] = accessToken;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Request failed (${response.status})`);
  }
  return (await response.json()) as T;
};

export const quranService = {
  getChapters: async (): Promise<QuranChapter[]> => {
    const url = buildUrl("/chapters", { language: "en" });
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
      language: "en",
      words: true,
      word_fields: "text_uthmani,transliteration",
      fields: "text_uthmani,verse_key,verse_number",
      translations: DEFAULT_ENGLISH_TRANSLATION_ID,
      page,
      per_page: perPage,
    });

    return await fetchJson<QuranVersesResponse>(url);
  },

  getReciters: async (language: string = "en"): Promise<NormalizedReciter[]> => {
    // Use public API - no authentication required
    const url = buildUrl("/resources/recitations", { language }, false);
    const data = await fetchJson<QuranRecitersResponse>(url, false);
    // Normalize the reciter data to a consistent format
    return data.recitations.map((reciter) => ({
      id: reciter.id,
      name: reciter.reciter_name,
      arabic_name: reciter.translated_name?.name || reciter.reciter_name,
    }));
  },

  getChapterAudio: async (params: {
    reciterId: number;
    chapterId: number;
  }): Promise<ChapterAudioFile> => {
    const { reciterId, chapterId } = params;
    // Use public API - no authentication required
    const url = buildUrl(
      `/chapter_recitations/${reciterId}/${chapterId}`,
      { segments: true },
      false
    );
    const data = await fetchJson<ChapterAudioResponse>(url, false);
    // Normalize: public API returns 'timestamps', we use 'verse_timings' internally
    const rawFile = data.audio_file;
    return {
      id: rawFile.id,
      chapter_id: rawFile.chapter_id,
      file_size: rawFile.file_size,
      format: rawFile.format,
      audio_url: rawFile.audio_url,
      verse_timings: rawFile.timestamps || [],
    };
  },
};
