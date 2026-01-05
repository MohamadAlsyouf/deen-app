import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

const ISLAMIC_API_BASE_URL = "https://islamicapi.com/api/v1";
const QURAN_OAUTH_TOKEN_URL =
  "https://prelive-oauth2.quran.foundation/oauth2/token";

// Define secrets - these will be securely stored in Firebase
const islamicApiKey = defineSecret("ISLAMIC_API_KEY");
const quranClientId = defineSecret("QURAN_CLIENT_ID");
const quranClientSecret = defineSecret("QURAN_CLIENT_SECRET");

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

/**
 * Proxy function for Quran Foundation OAuth2 token exchange
 * This handles the OAuth2 Client Credentials flow server-side to avoid CORS issues
 * and keeps the client credentials secure
 */
export const getQuranToken = onRequest(
  { secrets: [quranClientId, quranClientSecret], cors: true },
  async (req, res) => {
    // Only allow POST requests
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const clientId = quranClientId.value();
      const clientSecret = quranClientSecret.value();

      if (!clientId || !clientSecret) {
        console.error("Quran API credentials not configured");
        res.status(500).json({ error: "Server configuration error" });
        return;
      }

      // Create Basic Auth header: Base64(client_id:client_secret)
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
        "base64"
      );

      // Make OAuth2 token request
      const response = await fetch(QURAN_OAUTH_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          Authorization: `Basic ${basicAuth}`,
        },
        body: "grant_type=client_credentials&scope=content",
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("OAuth token error:", data);
        res.status(response.status).json(data);
        return;
      }

      // Return token data (access_token, expires_in, token_type, scope)
      res.status(200).json({
        access_token: data.access_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
        client_id: clientId, // Include client_id for x-client-id header
      });
    } catch (error) {
      console.error("Error getting Quran token:", error);
      res.status(500).json({ error: "Failed to get access token" });
    }
  }
);
