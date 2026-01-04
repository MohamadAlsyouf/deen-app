import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

const ISLAMIC_API_BASE_URL = "https://islamicapi.com/api/v1";

// Define the secret - this will be securely stored in Firebase
const islamicApiKey = defineSecret("ISLAMIC_API_KEY");

/**
 * Proxy function for Asma ul Husna (99 Names of Allah) API
 * This keeps the API key secure on the server side
 */
export const getAsmaUlHusna = onRequest(
  { secrets: [islamicApiKey], cors: true },
  async (req, res) => {
    // Only allow GET requests
    if (req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      // Get API key from Firebase secrets
      const apiKey = islamicApiKey.value();

      if (!apiKey) {
        console.error("ISLAMIC_API_KEY not configured");
        res.status(500).json({ error: "Server configuration error" });
        return;
      }

      // Ensure language is a string (query params can be arrays)
      const langParam = req.query.language;
      const language = typeof langParam === "string" ? langParam : "en";
      const url = `${ISLAMIC_API_BASE_URL}/asma-ul-husna/?language=${language}&api_key=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        res.status(response.status).json(data);
        return;
      }

      res.status(200).json(data);
    } catch (error) {
      console.error("Error fetching Asma ul Husna:", error);
      res.status(500).json({ error: "Failed to fetch data" });
    }
  }
);
