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

/**
 * Seed function for Prayer Guide data
 * Comprehensive step-by-step guide for the 5 daily prayers
 */
export const seedPrayerGuideData = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST request." });
    return;
  }

  try {
    const prayerGuideData = {
      title: "Prayer Guide",
      description: "A comprehensive step-by-step guide to performing the five daily prayers in Islam.",
      introduction: "Salah (prayer) is the second pillar of Islam and the most important act of worship. It is a direct connection between the believer and Allah, performed five times daily at prescribed times. Each prayer consists of units called 'rakaat' which include standing, bowing, prostrating, and sitting positions.",
      commonElements: {
        wudu: {
          title: "Wudu (Ablution)",
          description: "Before praying, Muslims must perform wudu (ritual purification) if they are not already in a state of purity.",
          steps: [
            "Make the intention (niyyah) in your heart to perform wudu",
            "Say 'Bismillah' (In the name of Allah)",
            "Wash both hands up to the wrists three times",
            "Rinse the mouth three times",
            "Clean the nose by sniffing water and blowing it out three times",
            "Wash the face three times (from hairline to chin, ear to ear)",
            "Wash the right arm up to the elbow three times, then the left",
            "Wipe the head once with wet hands (front to back)",
            "Wipe the ears once with wet fingers",
            "Wash the right foot up to the ankle three times, then the left"
          ]
        },
        niyyah: {
          title: "Niyyah (Intention)",
          description: "Before starting prayer, make a sincere intention in your heart. The intention does not need to be spoken aloud.",
          example: "I intend to pray [number] rakaat of [prayer name] for the sake of Allah."
        }
      },
      prayers: [
        {
          id: "fajr",
          name: "Fajr",
          nameArabic: "الفجر",
          time: "Dawn (before sunrise)",
          rakaat: 2,
          sunnahBefore: 2,
          description: "The dawn prayer, performed before sunrise. It marks the beginning of the day with remembrance of Allah.",
          significance: "The Prophet ﷺ said: 'Whoever prays Fajr is under the protection of Allah.' It is considered one of the most blessed prayers, performed when the world is quiet and peaceful.",
          steps: [
            {
              order: 1,
              name: "Standing (Qiyam) - Takbiratul Ihram",
              nameArabic: "تكبيرة الإحرام",
              position: "standing",
              arabicText: "اللّهُ أَكْبَر",
              transliteration: "Allahu Akbar",
              translation: "Allah is the Greatest",
              instruction: "Stand facing the Qibla (direction of Kaaba). Raise both hands to ear level (or shoulder level) with palms facing forward. Say 'Allahu Akbar' and then place your right hand over your left hand on your chest."
            },
            {
              order: 2,
              name: "Opening Supplication (Dua Al-Istiftah)",
              nameArabic: "دعاء الاستفتاح",
              position: "standing",
              arabicText: "سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَى جَدُّكَ، وَلَا إِلَهَ غَيْرُكَ",
              transliteration: "Subhanaka Allahumma wa bihamdika, wa tabarakasmuka, wa ta'ala jadduka, wa la ilaha ghayruk",
              translation: "Glory be to You, O Allah, and praise. Blessed is Your name and exalted is Your majesty. There is no god but You.",
              instruction: "Recite this opening supplication silently. This is recommended (sunnah) but not obligatory.",
              note: "This is recited only in the first rakah"
            },
            {
              order: 3,
              name: "Seeking Refuge (Ta'awwudh)",
              nameArabic: "التعوذ",
              position: "standing",
              arabicText: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
              transliteration: "A'udhu billahi minash-shaytanir-rajim",
              translation: "I seek refuge in Allah from Satan, the accursed",
              instruction: "Recite silently before Surah Al-Fatiha."
            },
            {
              order: 4,
              name: "Basmala",
              nameArabic: "البسملة",
              position: "standing",
              arabicText: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
              transliteration: "Bismillahir-Rahmanir-Rahim",
              translation: "In the name of Allah, the Most Gracious, the Most Merciful",
              instruction: "Recite before Surah Al-Fatiha. This can be recited silently."
            },
            {
              order: 5,
              name: "Surah Al-Fatiha",
              nameArabic: "سورة الفاتحة",
              position: "standing",
              arabicText: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
              transliteration: "Alhamdu lillahi rabbil 'alamin. Ar-Rahmanir-Rahim. Maliki yawmid-din. Iyyaka na'budu wa iyyaka nasta'in. Ihdinas-siratal-mustaqim. Siratal-ladhina an'amta 'alayhim, ghayril-maghdubi 'alayhim wa lad-dallin.",
              translation: "All praise is due to Allah, Lord of all the worlds. The Most Gracious, the Most Merciful. Master of the Day of Judgment. You alone we worship, and You alone we ask for help. Guide us to the straight path. The path of those upon whom You have bestowed favor, not of those who have evoked Your anger or of those who are astray.",
              instruction: "Recite Surah Al-Fatiha completely. In Fajr prayer, it is recited aloud. After finishing, say 'Ameen' (O Allah, accept our prayer).",
              note: "Surah Al-Fatiha is obligatory in every rakah of every prayer"
            },
            {
              order: 6,
              name: "Additional Surah",
              nameArabic: "سورة قصيرة",
              position: "standing",
              arabicText: "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
              transliteration: "Qul huwa Allahu ahad. Allahus-samad. Lam yalid wa lam yulad. Wa lam yakun lahu kufuwan ahad.",
              translation: "Say: He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born. Nor is there to Him any equivalent.",
              instruction: "After Al-Fatiha, recite any surah or verses from the Quran. Surah Al-Ikhlas (shown) is commonly recited. In Fajr, this is recited aloud.",
              note: "Additional surah is recited in the first two rakahs only"
            },
            {
              order: 7,
              name: "Bowing (Ruku)",
              nameArabic: "الركوع",
              position: "bowing",
              arabicText: "سُبْحَانَ رَبِّيَ الْعَظِيمِ",
              transliteration: "Subhana Rabbiyal-Adhim",
              translation: "Glory be to my Lord, the Most Great",
              instruction: "Say 'Allahu Akbar' and bow down. Place your hands on your knees with fingers spread. Keep your back straight and parallel to the ground. Look at the place of prostration. Recite the dhikr at least 3 times.",
              repetitions: 3
            },
            {
              order: 8,
              name: "Rising from Ruku",
              nameArabic: "الرفع من الركوع",
              position: "standing",
              arabicText: "سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ، رَبَّنَا وَلَكَ الْحَمْدُ",
              transliteration: "Sami'a Allahu liman hamidah. Rabbana wa lakal-hamd.",
              translation: "Allah hears those who praise Him. Our Lord, to You is all praise.",
              instruction: "Rise from bowing while saying 'Sami'a Allahu liman hamidah.' Stand straight and say 'Rabbana wa lakal-hamd.' Stand briefly in this position."
            },
            {
              order: 9,
              name: "First Prostration (Sujud)",
              nameArabic: "السجود الأول",
              position: "prostrating",
              arabicText: "سُبْحَانَ رَبِّيَ الْأَعْلَى",
              transliteration: "Subhana Rabbiyal-A'la",
              translation: "Glory be to my Lord, the Most High",
              instruction: "Say 'Allahu Akbar' and go down to prostration. Place your forehead, nose, both palms, both knees, and toes on the ground. Keep your elbows raised (not touching the ground). Recite the dhikr at least 3 times.",
              repetitions: 3,
              note: "This is the closest a servant can be to Allah"
            },
            {
              order: 10,
              name: "Sitting between Prostrations (Jalsah)",
              nameArabic: "الجلوس بين السجدتين",
              position: "sitting",
              arabicText: "رَبِّ اغْفِرْ لِي، رَبِّ اغْفِرْ لِي",
              transliteration: "Rabbighfir li, Rabbighfir li",
              translation: "My Lord, forgive me. My Lord, forgive me.",
              instruction: "Say 'Allahu Akbar' and sit up. Sit on your left foot with your right foot upright (toes pointing toward Qibla). Place hands on thighs near knees. Recite the supplication."
            },
            {
              order: 11,
              name: "Second Prostration (Sujud)",
              nameArabic: "السجود الثاني",
              position: "prostrating",
              arabicText: "سُبْحَانَ رَبِّيَ الْأَعْلَى",
              transliteration: "Subhana Rabbiyal-A'la",
              translation: "Glory be to my Lord, the Most High",
              instruction: "Say 'Allahu Akbar' and prostrate again. Perform exactly as the first prostration. Recite the dhikr at least 3 times.",
              repetitions: 3
            },
            {
              order: 12,
              name: "Rising for Second Rakah",
              nameArabic: "القيام للركعة الثانية",
              position: "standing",
              arabicText: "اللّهُ أَكْبَر",
              transliteration: "Allahu Akbar",
              translation: "Allah is the Greatest",
              instruction: "Say 'Allahu Akbar' and stand up for the second rakah. Repeat steps 4-11 (from Basmala through second Sujud).",
              note: "In the second rakah, skip the opening supplication (Dua Al-Istiftah)"
            },
            {
              order: 13,
              name: "Tashahhud (Final Sitting)",
              nameArabic: "التشهد",
              position: "sitting",
              arabicText: "التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
              transliteration: "At-tahiyyatu lillahi was-salawatu wat-tayyibat. As-salamu 'alayka ayyuhan-nabiyyu wa rahmatullahi wa barakatuh. As-salamu 'alayna wa 'ala 'ibadillahis-salihin. Ash-hadu an la ilaha illallah, wa ash-hadu anna Muhammadan 'abduhu wa rasuluh.",
              translation: "All greetings, prayers and good things are for Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings. Peace be upon us and upon the righteous servants of Allah. I bear witness that there is no god but Allah, and I bear witness that Muhammad is His servant and messenger.",
              instruction: "After the second prostration of the second rakah, sit in the tashahhud position. Point your right index finger and move it slightly while reciting. Sit on your left foot with right foot upright."
            },
            {
              order: 14,
              name: "Salawat upon the Prophet",
              nameArabic: "الصلاة على النبي",
              position: "sitting",
              arabicText: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ. اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ",
              transliteration: "Allahumma salli 'ala Muhammadin wa 'ala ali Muhammad, kama sallayta 'ala Ibrahima wa 'ala ali Ibrahim, innaka Hamidun Majid. Allahumma barik 'ala Muhammadin wa 'ala ali Muhammad, kama barakta 'ala Ibrahima wa 'ala ali Ibrahim, innaka Hamidun Majid.",
              translation: "O Allah, send prayers upon Muhammad and upon the family of Muhammad, as You sent prayers upon Ibrahim and the family of Ibrahim. Indeed, You are Praiseworthy, Glorious. O Allah, bless Muhammad and the family of Muhammad, as You blessed Ibrahim and the family of Ibrahim. Indeed, You are Praiseworthy, Glorious.",
              instruction: "After the Tashahhud, recite the Salawat (prayers upon the Prophet ﷺ). This is known as the Ibrahimiyya."
            },
            {
              order: 15,
              name: "Supplication before Tasleem",
              nameArabic: "الدعاء قبل التسليم",
              position: "sitting",
              arabicText: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ جَهَنَّمَ، وَمِنْ عَذَابِ الْقَبْرِ، وَمِنْ فِتْنَةِ الْمَحْيَا وَالْمَمَاتِ، وَمِنْ شَرِّ فِتْنَةِ الْمَسِيحِ الدَّجَّالِ",
              transliteration: "Allahumma inni a'udhu bika min 'adhabi jahannam, wa min 'adhabil-qabr, wa min fitnatil-mahya wal-mamat, wa min sharri fitnatil-masihid-dajjal.",
              translation: "O Allah, I seek refuge in You from the punishment of Hellfire, from the punishment of the grave, from the trials of life and death, and from the evil of the trial of the False Messiah.",
              instruction: "It is recommended to make this supplication before ending the prayer. You may also make any other personal supplications.",
              note: "This is sunnah (recommended) but not obligatory"
            },
            {
              order: 16,
              name: "Tasleem (Ending the Prayer)",
              nameArabic: "التسليم",
              position: "turning",
              arabicText: "السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ",
              transliteration: "As-salamu 'alaykum wa rahmatullah",
              translation: "Peace be upon you and the mercy of Allah",
              instruction: "Turn your head to the right and say 'As-salamu alaykum wa rahmatullah.' Then turn your head to the left and repeat. This completes the prayer.",
              repetitions: 2,
              note: "Some scholars say one tasleem to the right is sufficient, but two is preferable"
            }
          ]
        },
        {
          id: "dhuhr",
          name: "Dhuhr",
          nameArabic: "الظهر",
          time: "Midday (after the sun passes its zenith)",
          rakaat: 4,
          sunnahBefore: 4,
          sunnahAfter: 2,
          description: "The midday prayer, performed after the sun has passed its highest point. It is prayed silently.",
          significance: "Dhuhr prayer helps break the busyness of the day, reminding us to pause and reconnect with Allah during our daily activities.",
          steps: [
            {
              order: 1,
              name: "First Two Rakahs",
              nameArabic: "الركعتان الأوليان",
              position: "standing",
              arabicText: "",
              transliteration: "",
              translation: "",
              instruction: "Perform the first two rakahs exactly as described in Fajr prayer (steps 1-11), but recite everything silently. After the second sujud of the second rakah, sit for the first Tashahhud.",
              note: "In Dhuhr, all recitations are silent (in your heart/whispered)"
            },
            {
              order: 2,
              name: "First Tashahhud",
              nameArabic: "التشهد الأول",
              position: "sitting",
              arabicText: "التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ...",
              transliteration: "At-tahiyyatu lillahi was-salawatu wat-tayyibat...",
              translation: "All greetings, prayers and good things are for Allah...",
              instruction: "After the second sujud of the second rakah, sit and recite only the Tashahhud (up to 'wa ash-hadu anna Muhammadan abduhu wa rasuluh'). Do NOT recite the Salawat yet.",
              note: "Point your index finger during 'ash-hadu an la ilaha illallah'"
            },
            {
              order: 3,
              name: "Third Rakah",
              nameArabic: "الركعة الثالثة",
              position: "standing",
              arabicText: "",
              transliteration: "",
              translation: "",
              instruction: "Say 'Allahu Akbar' and stand up. Recite only Surah Al-Fatiha (no additional surah). Then perform ruku, standing, two sujud as before.",
              note: "In the 3rd and 4th rakahs, only Al-Fatiha is recited"
            },
            {
              order: 4,
              name: "Fourth Rakah",
              nameArabic: "الركعة الرابعة",
              position: "standing",
              arabicText: "",
              transliteration: "",
              translation: "",
              instruction: "Stand up saying 'Allahu Akbar'. Recite only Surah Al-Fatiha. Perform ruku, standing, and two sujud."
            },
            {
              order: 5,
              name: "Final Tashahhud and Tasleem",
              nameArabic: "التشهد الأخير والتسليم",
              position: "sitting",
              arabicText: "",
              transliteration: "",
              translation: "",
              instruction: "After the second sujud of the fourth rakah, sit for the final Tashahhud. Recite the full Tashahhud, Salawat, and any supplications. End with Tasleem to the right and left."
            }
          ]
        },
        {
          id: "asr",
          name: "Asr",
          nameArabic: "العصر",
          time: "Afternoon (when shadow equals object's length)",
          rakaat: 4,
          description: "The afternoon prayer, performed when the shadow of an object equals its length. It is prayed silently.",
          significance: "Allah specifically mentions Asr in the Quran (Surah Al-Asr) as a time when people are busy. The Prophet ﷺ warned that missing Asr is like losing one's family and wealth.",
          steps: [
            {
              order: 1,
              name: "Four Rakahs - Same as Dhuhr",
              nameArabic: "أربع ركعات",
              position: "standing",
              arabicText: "",
              transliteration: "",
              translation: "",
              instruction: "Asr is performed exactly like Dhuhr: 4 rakahs with silent recitation, sitting for Tashahhud after the 2nd rakah, and full Tashahhud with Tasleem after the 4th rakah.",
              note: "Follow all the same steps as Dhuhr prayer"
            }
          ]
        },
        {
          id: "maghrib",
          name: "Maghrib",
          nameArabic: "المغرب",
          time: "Sunset (immediately after the sun sets)",
          rakaat: 3,
          sunnahAfter: 2,
          description: "The sunset prayer, performed immediately after the sun sets below the horizon. The first two rakahs are recited aloud.",
          significance: "Maghrib marks the end of the fasting day during Ramadan. It should be prayed promptly after sunset, as its time window is shorter than other prayers.",
          steps: [
            {
              order: 1,
              name: "First Two Rakahs (Aloud)",
              nameArabic: "الركعتان الأوليان",
              position: "standing",
              arabicText: "",
              transliteration: "",
              translation: "",
              instruction: "Perform the first two rakahs with Al-Fatiha and additional surah recited ALOUD (like Fajr). After the second sujud of the second rakah, sit for the first Tashahhud.",
              note: "Recite aloud in the first two rakahs"
            },
            {
              order: 2,
              name: "First Tashahhud",
              nameArabic: "التشهد الأول",
              position: "sitting",
              arabicText: "",
              transliteration: "",
              translation: "",
              instruction: "Sit and recite only the Tashahhud (without Salawat). Then stand for the third rakah."
            },
            {
              order: 3,
              name: "Third Rakah (Silent)",
              nameArabic: "الركعة الثالثة",
              position: "standing",
              arabicText: "",
              transliteration: "",
              translation: "",
              instruction: "Recite only Surah Al-Fatiha SILENTLY. Perform ruku and two sujud.",
              note: "The third rakah is recited silently"
            },
            {
              order: 4,
              name: "Final Tashahhud and Tasleem",
              nameArabic: "التشهد الأخير والتسليم",
              position: "sitting",
              arabicText: "",
              transliteration: "",
              translation: "",
              instruction: "After the second sujud, sit for the final Tashahhud. Recite the complete Tashahhud, Salawat, and any supplications. End with Tasleem."
            }
          ]
        },
        {
          id: "isha",
          name: "Isha",
          nameArabic: "العشاء",
          time: "Night (after twilight has disappeared)",
          rakaat: 4,
          sunnahAfter: 2,
          description: "The night prayer, performed after the red twilight has disappeared. The first two rakahs are recited aloud.",
          significance: "Isha completes the daily prayers. The Prophet ﷺ said that whoever prays Isha in congregation is as if he prayed half the night, and whoever prays Fajr in congregation is as if he prayed the whole night.",
          steps: [
            {
              order: 1,
              name: "First Two Rakahs (Aloud)",
              nameArabic: "الركعتان الأوليان",
              position: "standing",
              arabicText: "",
              transliteration: "",
              translation: "",
              instruction: "Perform the first two rakahs with Al-Fatiha and additional surah recited ALOUD. After the second sujud of the second rakah, sit for the first Tashahhud.",
              note: "Recite aloud in the first two rakahs"
            },
            {
              order: 2,
              name: "First Tashahhud",
              nameArabic: "التشهد الأول",
              position: "sitting",
              arabicText: "",
              transliteration: "",
              translation: "",
              instruction: "Sit and recite only the Tashahhud (without Salawat). Then stand for the third rakah."
            },
            {
              order: 3,
              name: "Third and Fourth Rakahs (Silent)",
              nameArabic: "الركعتان الأخيرتان",
              position: "standing",
              arabicText: "",
              transliteration: "",
              translation: "",
              instruction: "For each rakah, recite only Surah Al-Fatiha SILENTLY. Perform ruku and two sujud for each.",
              note: "The 3rd and 4th rakahs are recited silently, with only Al-Fatiha"
            },
            {
              order: 4,
              name: "Final Tashahhud and Tasleem",
              nameArabic: "التشهد الأخير والتسليم",
              position: "sitting",
              arabicText: "",
              transliteration: "",
              translation: "",
              instruction: "After the second sujud of the fourth rakah, sit for the final Tashahhud. Recite the complete Tashahhud, Salawat, and any supplications. End with Tasleem to the right and left."
            }
          ]
        }
      ]
    };

    // Write to Firestore
    const docRef = db.collection("prayerGuide").doc("main");
    await docRef.set(prayerGuideData);

    res.status(200).json({
      success: true,
      message: "Prayer Guide data seeded successfully",
      data: {
        prayers: prayerGuideData.prayers.map(p => `${p.name} (${p.rakaat} rakaat)`),
        totalSteps: prayerGuideData.prayers.reduce((acc, p) => acc + p.steps.length, 0)
      }
    });
  } catch (error) {
    console.error("Error seeding prayer guide data:", error);
    res.status(500).json({ error: "Failed to seed prayer guide data" });
  }
});
