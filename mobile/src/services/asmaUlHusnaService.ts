import type { AsmaUlHusnaData, AsmaUlHusnaResponse } from "@/types/asmaUlHusna";

// Firebase Cloud Function URL - API key is securely stored on the server
// Hardcoded since project ID is public (in the URL) and ensures it works for all contributors
const ASMA_UL_HUSNA_FUNCTION_URL =
  "https://us-central1-deen-app-753e6.cloudfunctions.net/getAsmaUlHusna";

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Request failed (${response.status})`);
  }
  return (await response.json()) as T;
};

export const asmaUlHusnaService = {
  getData: async (language: string = "en"): Promise<AsmaUlHusnaData> => {
    const url = `${ASMA_UL_HUSNA_FUNCTION_URL}?language=${language}`;
    const response = await fetchJson<AsmaUlHusnaResponse>(url);
    return response.data;
  },
};
