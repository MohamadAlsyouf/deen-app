import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

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

/**
 * Seed function for Pillars of Islam and Pillars of Iman data
 * Call this once to populate the Firestore database
 */
export const seedPillarsData = onRequest({ cors: true }, async (req, res) => {
  // Only allow POST requests for safety
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST request." });
    return;
  }

  try {
    // 5 Pillars of Islam data
    const islamData = {
      type: "islam",
      title: "5 Pillars of Islam",
      description:
        "The Five Pillars of Islam are the core practices that define Muslim life. They guide spiritual, moral, and community life and are obligatory for all Muslims who are physically and financially able.",
      pillars: [
        {
          number: 1,
          name: "Shahada",
          arabicName: "الشهادة",
          meaning: "Declaration of Faith",
          icon: "heart-outline",
          description:
            "The Shahada is the affirmation: 'There is no god but Allah, and Muhammad is His Messenger.' In Arabic: lā ʾilāha ʾillā-llāhu muḥammadun rasūlu-llāh. It expresses two core beliefs: monotheism (the oneness of God—Tawhid) and acceptance of Muhammad ﷺ as God's final prophet.",
          significance:
            "It is the first step to becoming a Muslim: reciting it sincerely makes one part of the faith. It shapes Muslim identity and grounds all other pillars in belief. Without believing and acknowledging this statement of faith, the other acts of worship lose their religious meaning.",
        },
        {
          number: 2,
          name: "Salah",
          arabicName: "الصلاة",
          meaning: "Five Daily Prayers",
          icon: "time-outline",
          description:
            "Salah refers to the five daily prayers Muslims are required to perform at prescribed times: Fajr (dawn), Dhuhr (midday), Asr (afternoon), Maghrib (sunset), and Isha (evening/night). Each prayer involves specific movements and recitations facing the Kaaba in Mecca.",
          significance:
            "Acts as the believer's direct connection with Allah, offering regular reminders of faith and duty. Builds discipline, structure, and a rhythm in everyday life. In congregational prayer, it fosters unity—rich and poor, local and remote, coming together.",
        },
        {
          number: 3,
          name: "Zakat",
          arabicName: "الزكاة",
          meaning: "Almsgiving",
          icon: "gift-outline",
          description:
            "Zakat is the declared obligation to give a portion of one's wealth—usually 2.5% of savings and certain assets—annually to those in need. It's meant to purify the giver's wealth and help redistribute resources within the Muslim community.",
          significance:
            "Promotes social justice and reduces wealth inequality. It's a built-in welfare system in Islam that cares for the poor, orphans, and needy. It reminds Muslims that all wealth is ultimately from God and should be used responsibly. The act of giving purifies both wealth and character.",
        },
        {
          number: 4,
          name: "Sawm",
          arabicName: "الصوم",
          meaning: "Fasting during Ramadan",
          icon: "moon-outline",
          description:
            "Every year during the month of Ramadan, Muslims fast from dawn until sunset—refraining from food, drink, and other physical needs. Those who are exempt include children, the sick, the elderly, pregnant women, and travelers.",
          significance:
            "Encourages self-discipline, self-control, and empathy with those less fortunate. Experiencing hunger and thirst helps deepen gratitude. Ramadan is also a time of spiritual reflection—extra prayers, reading the Quran, seeking forgiveness, being mindful of behavior. It reinforces the moral dimension of Islam.",
        },
        {
          number: 5,
          name: "Hajj",
          arabicName: "الحج",
          meaning: "Pilgrimage to Mecca",
          icon: "globe-outline",
          description:
            "Hajj is a pilgrimage to the holy city of Mecca during the Islamic month of Dhu al-Hijjah. Every Muslim who is physically and financially capable must perform it at least once in their lifetime. The rituals reenact events from the life of Prophet Ibrahim (Abraham), his family, and early Islamic history.",
          significance:
            "Symbolizes unity, equality, and humility—pilgrims dress in plain white garments (Ihram), removing outward distinctions of wealth or status. Offers a powerful spiritual experience: reflection, renewal of faith, remembering the Day of Judgment, and connection to a global community of believers.",
        },
      ],
    };

    // 6 Pillars of Iman data
    const imanData = {
      type: "iman",
      title: "6 Pillars of Iman",
      description:
        "The Six Pillars of Iman (faith) are the core beliefs every Muslim affirms. Based on the hadith of Angel Gabriel, these pillars shape how a Muslim lives their life, deals with challenges, and understands their purpose.",
      pillars: [
        {
          number: 1,
          name: "Belief in Allah",
          arabicName: "الإيمان بالله",
          meaning: "Oneness of God (Tawhid)",
          icon: "infinite-outline",
          description:
            "Recognizing that there is only one God—Allah—who is uniquely one in His essence, Lordship, and attributes, with no partners or equals. He alone is worthy of worship. This includes belief in all His names and attributes as described in the Qur'an and the Sunnah.",
          significance:
            "Tawhid is the foundation of all Islamic belief. It shapes every aspect of a Muslim's worldview, ensuring that worship, devotion, and ultimate trust are directed to Allah alone. It frees believers from attachment to worldly powers and false deities.",
        },
        {
          number: 2,
          name: "Belief in Angels",
          arabicName: "الإيمان بالملائكة",
          meaning: "Belief in the Angels (Malaikah)",
          icon: "sparkles-outline",
          description:
            "Angels are created by Allah from light. They are pure, obedient, and do not disobey His commands. They fulfill various roles—messengers (like Jibreel who brought revelation), recorders of deeds (Kiraman Katibin), guardians, and those who carry out Allah's will.",
          significance:
            "Believing in angels connects Muslims to the unseen world and reinforces accountability—knowing that deeds are recorded. It also brings comfort knowing that angels support and protect believers by Allah's permission.",
        },
        {
          number: 3,
          name: "Belief in Divine Books",
          arabicName: "الإيمان بالكتب",
          meaning: "Belief in the Scriptures (Kutub)",
          icon: "book-outline",
          description:
            "Muslims believe Allah revealed scriptures to His prophets to guide humanity. The major ones include: the Torah (Tawrah) given to Musa (Moses), the Psalms (Zabur) given to Dawud (David), the Gospel (Injil) given to Isa (Jesus), and the Qur'an given to Muhammad ﷺ. The Qur'an is considered the final and perfectly preserved revelation.",
          significance:
            "This belief affirms the continuity of divine guidance throughout history. While previous scriptures may have been altered over time, the Qur'an remains preserved as the final criterion and guidance for all of humanity.",
        },
        {
          number: 4,
          name: "Belief in Prophets",
          arabicName: "الإيمان بالرسل",
          meaning: "Belief in the Messengers (Rusul)",
          icon: "people-outline",
          description:
            "All prophets sent by Allah—from Adam through Noah, Abraham, Moses, Jesus, to Muhammad ﷺ—are to be believed in and respected. They were chosen to deliver Allah's message to humanity. Muhammad ﷺ is the 'Seal of the Prophets,' meaning no prophet comes after him.",
          significance:
            "Prophets serve as role models demonstrating how to live according to Allah's guidance. Believing in all prophets creates unity with other monotheistic traditions while recognizing Muhammad ﷺ as the final messenger with the complete message.",
        },
        {
          number: 5,
          name: "Belief in the Last Day",
          arabicName: "الإيمان باليوم الآخر",
          meaning: "Belief in the Day of Judgment (Yawm al-Qiyamah)",
          icon: "calendar-outline",
          description:
            "The belief that there will be a Day of Judgment when all people will be resurrected, their deeds weighed on a scale, and each person will receive recompense—reward in Paradise (Jannah) or punishment in Hellfire (Jahannam).",
          significance:
            "This belief gives life ultimate meaning and accountability. It motivates ethical behavior, patience in hardship, and hope in Allah's justice. Every action matters, and justice will ultimately prevail.",
        },
        {
          number: 6,
          name: "Belief in Divine Decree",
          arabicName: "الإيمان بالقدر",
          meaning: "Belief in Predestination (Qadr)",
          icon: "shuffle-outline",
          description:
            "This means believing that Allah has knowledge of everything that will happen, that everything is decreed in His knowledge and with His permission, whether good or bad. It includes four aspects: Allah's knowledge, His writing of all things, His will, and His creation of all things. Humans also have free will and are responsible for their choices.",
          significance:
            "Belief in Qadr brings peace during difficulties—trusting Allah's wisdom even when things don't go as planned. It prevents arrogance in success (recognizing Allah's blessing) and despair in failure (trusting Allah's plan). It balances trust in Allah with personal responsibility.",
        },
      ],
    };

    // Write to Firestore
    const batch = db.batch();

    const islamRef = db.collection("pillars").doc("islam");
    batch.set(islamRef, islamData);

    const imanRef = db.collection("pillars").doc("iman");
    batch.set(imanRef, imanData);

    await batch.commit();

    res.status(200).json({
      success: true,
      message: "Pillars data seeded successfully",
      data: {
        islam: `${islamData.pillars.length} pillars`,
        iman: `${imanData.pillars.length} pillars`,
      },
    });
  } catch (error) {
    console.error("Error seeding pillars data:", error);
    res.status(500).json({ error: "Failed to seed pillars data" });
  }
});
