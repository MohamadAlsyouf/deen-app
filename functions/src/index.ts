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

/**
 * Seed function for Dua/Supplication data
 * Comprehensive collection of morning, evening, daily, and after-salah duas
 * Data sourced from dhikr-morning.json, dhikr-evening.json, dhikr-daily.json, dhikr-after-salah.json
 */
export const seedDuaData = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST request." });
    return;
  }

  try {
    // Morning Dhikr data - ALL 21 items from dhikr-morning.json
    const morningDuas = [
      {
        title: "Ayatul Kursi",
        arabic: "ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُۥ مَا فِى ٱلسَّمَٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۗ مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَىْءٍ مِّنْ عِلْمِهِۦٓ إِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضَ ۖ وَلَا يَـُٔودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ",
        latin: "allahu la ilaha illa huwa, al-hayyul-qayyum. la ta'khudhuhu sinatun wa la nawm. lahu ma fis-samawati wa ma fil-ard. man dhal-ladhi yashfa'u 'indahu illa bi-idhnihi. ya'lamu ma bayna aydihim wa ma khalfahum. wa la yuhituna bishay'in min 'ilmihi illa bima sha'. wa si'a kursiyyuhu as-samawati wal-ard. wa la ya'udu-hu hifdhuhuma. wa huwa al-'aliyyul-'azim",
        translation: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of [all] existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is [presently] before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most Hight, the Most Great.",
        notes: "Recite 1x",
        fawaid: "Whoever reads this verse in the morning, he will be protected until evening. And whoever reads it in the evening, he will be protected until morning.",
        source: "HR. at-Tirmidzi: 2879"
      },
      {
        title: "Al-Ikhlas",
        arabic: "قُلْ هُوَ ٱللَّهُ أَحَدٌ (1) ٱللَّهُ ٱلصَّمَدُ (2) لَمْ يَلِدْ وَلَمْ يُولَدْ (3) وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ (4)",
        latin: "qul huwa allahu ahad (1) allahu samad (2) lam yalid wa lam yulad (3) wa lam yakun lahu kufuwan ahad (4)",
        translation: "Say, \"He is Allah, [who is] One, (1) Allah, the Eternal Refuge. (2) He neither begets nor is born, (3) Nor is there to Him any equivalent.\" (4)",
        notes: "Recite 3x",
        fawaid: "The Messenger of Allah, sallallahu 'alayhi wa sallam, said: Recite Qul huwallahu ahad, and Al-Mu'awwidhatayn (Al-Falaq and An-Nas) in the evening and morning three times, and it will suffice you (protect you) from everything.",
        source: "HR. Abu Dawud No. 4241"
      },
      {
        title: "Al-Falaq",
        arabic: "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ (1) مِن شَرِّ مَا خَلَقَ (2) وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ (3) وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلْعُقَدِ (4) وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ (5)",
        latin: "qul a'udhu birabbil-falaq (1) min sharri ma khalaq (2) wa min sharri ghasiqin idha waqab (3) wa min sharri naffathati fil-'uqad (4) wa min sharri hasidin idha hasad (5)",
        translation: "Say, \"I seek refuge in the Lord of daybreak (1) From the evil of that which He created (2) And from the evil of darkness when it settles (3) And from the evil of the blowers in knots (4) And from the evil of an envier when he envies.\" (5)",
        notes: "Recite 3x",
        fawaid: "The Messenger of Allah, sallallahu 'alayhi wa sallam, said: Recite Qul huwallahu ahad, and Al-Mu'awwidhatayn (Al-Falaq and An-Nas) in the evening and morning three times, and it will suffice you (protect you) from everything.",
        source: "HR. Abu Dawud No. 4241"
      },
      {
        title: "An-Nas",
        arabic: "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ (1) مَلِكِ ٱلنَّاسِ (2) إِلَٰهِ ٱلنَّاسِ (3) مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ (4) ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ (5) مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ (6)",
        latin: "qul a'udhu birabbin-nas (1) malikin-nas (2) ilahin-nas (3) min sharri al-waswasi al-khannas (4) alladhi yuwaswisu fi sudurin-nas (5) mina al-jinnati wan-nas (6)",
        translation: "Say, \"I seek refuge in the Lord of mankind, (1) The King of mankind. (2) The God of mankind, (3) From the evil of the whisperer who withdraws, (4) Who whispers in the breasts of mankind, (5) Of the jinn and mankind.\" (6)",
        notes: "Recite 3x",
        fawaid: "The Messenger of Allah, sallallahu 'alayhi wa sallam, said: Recite Qul huwallahu ahad, and Al-Mu'awwidhatayn (Al-Falaq and An-Nas) in the evening and morning three times, and it will suffice you (protect you) from everything.",
        source: "HR. Abu Dawud No. 4241"
      },
      {
        title: "Upon Entering The Morning by Asking for Protection from Allah",
        arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَـهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيْكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيْرُ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِيْ هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوْذُ بِكَ مِنْ شَرِّ مَا فِيْ هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوْذُ بِكَ مِنَ الْكَسَلِ وَسُوْءِ الْكِبَرِ، رَبِّ أَعُوْذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
        latin: "asbahna wa asbahal-mulku lillahi, wal-hamdu lillahi, la ilaha illa allah wahdahu la sharika lahu, lahu al-mulku wa lahu al-hamdu wa huwa 'ala kulli shay'in qadir. rabbi as'aluka khayra ma fi hadha al-yawm wa khayra ma ba'dahu, wa a'udhu bika min sharri ma fi hadha al-yawm wa sharri ma ba'dahu. rabbi a'udhu bika mina al-kasali wa su'il-kibar. rabbi a'udhu bika min 'adhabin fin-nar wa 'adhabin fil-qabr",
        translation: "We have entered the morning and the dominion belongs to Allah, and all praise is for Allah. There is no deity worthy of worship except Allah alone, He has no partner. To Him belongs the dominion and to Him is praise, and He is over all things competent. My Lord, I ask You for the good of this day and the good of what follows it, and I seek refuge in You from the evil of this day and the evil of what follows it. My Lord, I seek refuge in You from laziness and the evil of old age. My Lord, I seek refuge in You from the punishment of the Fire and the punishment of the grave.",
        notes: "Recite 1x",
        fawaid: "Asking for protection from evil takes precedence, the rule that shows the importance of this is: \"Preventing harm is more important and takes precedence than bringing good\".",
        source: "HR. Muslim No. 2723 (75), Abu Dawud No. 5071, and at-Tirmidzi 3390, sahih from Abdullah Ibn Mas'ud"
      },
      {
        title: "Upon Entering The Morning with The Grace of Allah",
        arabic: "اَللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوْتُ وَإِلَيْكَ النُّشُوْرُ",
        latin: "allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namutu wa ilaykan-nushur",
        translation: "O Allah, with Your grace and help we enter the morning, and with Your grace and help we enter the evening. By Your grace and will we live and by Your grace and will we die. And to You is the resurrection (for all creatures).",
        notes: "Recite 1x",
        fawaid: "Everything we do from morning to evening, from when we start our life until we die, is all under the control of Allah and to Him we return.",
        source: "HR. al-Bukhari in al-Adab al-Mufrad No. 1199, this wording is the wording of al-Bukhari, at-Tirmidzi No. 3391, Abu Dawud No. 5068, Ahmad 11/354, Ibn Majah No. 3868"
      },
      {
        title: "Sayyid al-Istighfar",
        arabic: "اَللَّهُمَّ أَنْتَ رَبِّيْ ، لَا إِلٰـهَ إِلاَّ أَنْتَ خَلَقْتَنِيْ وَأَنَا عَبْدُكَ ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ ، أَعُوْذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ ، أَبُوْءُ لَكَ بِنِعْمتِكَ عَلَيَّ ، وَأَبُوْءُ بِذَنْبِيْ فَاغْفِرْ لِيْ ، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ",
        latin: "allahumma anta rabbi, la ilaha illa anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastata'tu. a'udhu bika min sharri ma sana'tu, abu'u laka bini'matika 'alayya, wa abu'u bidhanbi faghfir li, fa innahu la yaghfirudh-dhunuba illa anta",
        translation: "O Allah, You are my Lord. There is no deity worthy of worship except You. You created me and I am Your servant. I will be true to my covenant and promise to You as much as I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favor upon me and I acknowledge my sin, therefore, forgive me. Indeed, there is no one who can forgive sins except You.",
        notes: "Recite 1x",
        fawaid: "Whoever reads it with confidence in the evening, then he dies, he will enter heaven, so also if (read) in the morning.",
        source: "HR. al-Bukhari No. 6306, 6323, Ahmad IV/122-125, an-Nasa'i VIII/279-280"
      },
      {
        title: "Dua for Protection and Good Health",
        arabic: "اَللَّهُمَّ عَافِنِيْ فِيْ بَدَنِيْ ، اَللَّهُمَّ عَافِنِيْ فِيْ سَمْعِيْ ، اَللَّهُمَّ عَافِنِيْ فِيْ بَصَرِيْ ، لَا إِلَـهَ إِلَّا أَنْتَ ، اَللَّهُمَّ إِنِّيْ أَعُوْذُ بِكَ مِنَ الْكُفْرِوَالْفَقْرِ ، وَأَعُوْذُ بِكَ مِنْ عَذَابِ الْقَبْرِ ، لَا إِلَـهَ إِلَّا أَنْتَ",
        latin: "allahumma 'afini fi badani, allahumma 'afini fi sam'i, allahumma 'afini fi basari, la ilaha illa anta. allahumma inni a'udhu bika minal-kufri wal-faqr, wa a'udhu bika min 'adhabil-qabr, la ilaha illa anta",
        translation: "O Allah, protect my body (from illness and from what I do not want). O Allah, protect my hearing (from illness and disobedience or from what I do not want). O Allah, protect my sight, there is no deity worthy of worship except You. O Allah, indeed I seek refuge in You from disbelief and poverty. I seek refuge in You from the punishment of the grave, there is no deity worthy of worship except You.",
        notes: "Recite 1x",
        fawaid: "By asking Allah to grant us well-being in our body, we are asking to be cured from all physical and spritual ailments, so that we possess both a healthy body and a pure heart, and therefore use this healthy body in a way that pleases Allah.",
        source: "HR. al-Bukhari in Sahih al-Adab al-Mufrad No. 701, Abu Dawud No. 5090, Ahmad V/42, hasan"
      },
      {
        title: "Dua for Salvation in The World and Hereafter",
        arabic: "اَللَّهُمَّ إِنِّيْ أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَاْلآخِرَةِ، اَللَّهُمَّ إِنِّيْ أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِيْنِيْ وَدُنْيَايَ وَأَهْلِيْ وَمَالِيْ اللَّهُمَّ اسْتُرْ عَوْرَاتِى وَآمِنْ رَوْعَاتِى. اَللَّهُمَّ احْفَظْنِيْ مِنْ بَيْنِ يَدَيَّ، وَمِنْ خَلْفِيْ، وَعَنْ يَمِيْنِيْ وَعَنْ شِمَالِيْ، وَمِنْ فَوْقِيْ، وَأَعُوْذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِيْ",
        latin: "allahumma inni as'alukal-'afwa wal-'afiyah fid-dunya wal-akhirah. allahumma inni as'alukal-'afwa wal-'afiyah fi dini wa dunyaya wa ahli wa mali. allahummastur 'awrati wa amin raw'ati. allahummahfadhni min bayni yadayya, wa min khalfi, wa 'an yamini wa 'an shimali, wa min fawqi. wa a'udhu bi 'adhamatika an ughtala min tahti",
        translation: "O Allah, indeed I ask You for well-being and safety in this world and the Hereafter. O Allah, indeed I ask You for well-being and safety in my religion, my world, my family and my wealth. O Allah, cover my flaws (faults and things that are not appropriate for others to see) and calm me from fear. O Allah, protect me from the front, behind, right, left and above me. I seek refuge in Your greatness, so that I am not snatched from below me (by snakes or swallowed by the earth, etc., which would cause me to fall).",
        notes: "Recite 1x",
        fawaid: "The Prophet sallallahu 'alayhi wa sallam never left this prayer in the morning and evening. It contains protection and safety for religion, the world, family and property from various kinds of disturbances that come from various directions.",
        source: "HR. al-Bukhari in al-Adab al-Mufrad No. 1200, Abu Dawud No. 5074, an-Nasa'i VII/282, Ibn Majah No. 3871, al-Hakim 1/517-518, and others from Ibn Umar radhiyallahu 'anhuma"
      },
      {
        title: "Dua for Protection from Shaytan Whispers",
        arabic: "اَللَّهُمَّ عَالِمَ الْغَيْبِ وَالشَّهَادَةِ فَاطِرَ السَّمَاوَاتِ وَاْلأَرْضِ، رَبَّ كُلِّ شَيْءٍ وَمَلِيْكَهُ، أَشْهَدُ أَنْ لاَ إِلَـهَ إِلاَّ أَنْتَ، أَعُوْذُ بِكَ مِنْ شَرِّ نَفْسِيْ، وَمِنْ شَرِّ الشَّيْطَانِ وَشِرْكِهِ، وَأَنْ أَقْتَرِفَ عَلَى نَفْسِيْ سُوْءًا أَوْ أَجُرَّهُ إِلَى مُسْلِمٍ",
        latin: "allahumma 'alimal-ghaybi wash-shahadati, fatiras-samawati wal-ard, rabbakulli shayin wa malikahu. ashhadu alla ilaha illa anta, a'udhu bika min sharri nafsi, wa min sharri ash-shaytani wa shirkih. wa an aqtarifa 'ala nafsi su'an aw ajurrahu ila muslim",
        translation: "O Allah, Knower of the unseen and the seen, Creator of the heavens and the earth, Lord of all things and their Sovereign. I bear witness that there is no deity worthy of worship except You. I seek refuge in You from the evil of myself, Satan and his soldiers (temptations to commit shirk against Allah), and I (seek refuge in You) from committing evil against myself or dragging it to a Muslim.",
        notes: "Recite 1x",
        fawaid: "The Prophet Muhammad sallallahu 'alayhi wa sallam said to Abu Bakr ash-Shiddiq radhiyallahu 'anhu 'Say morning and evening and when you are going to sleep'.",
        source: "HR. al-Bukhari in al-Adab al-Mufrad No. 1202, at-Tirmidzi No. 3392 and Abu Dawud No. 5067"
      },
      {
        title: "Asking for Protection from All Harms",
        arabic: "بِسْمِ اللَّهِ الَّذِى لاَ يَضُرُّ مَعَ اسْمِهِ شَىْءٌ فِى الأَرْضِ وَلاَ فِى السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
        latin: "bismillahi alladhi la yadurru ma'asmihi shay'un fi'l-ard wa la fi's-sama'i, wa huwa as-sami'u al-'aleem",
        translation: "In the name of Allah with Whose name nothing can harm on earth or in heaven, and He is the All-Hearing, All-Knowing.",
        notes: "Recite 3x",
        fawaid: "Whoever reads it three times in the morning and evening, then nothing will harm him.",
        source: "HR. at-Tirmidzi No. 3388, Abu Dawud No. 5088, Ibn Majah No. 3869, al-Hakim 1/514, and Ahmad No. 446 and 474"
      },
      {
        title: "Declaration of Pleasure with Allah, Islam, and the Prophet Muhammad sallallahu 'alayhi wa sallam",
        arabic: "رَضِيْتُ بِاللهِ رَبًّا، وَبِاْلإِسْلاَمِ دِيْنًا، وَبِمُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا",
        latin: "raditu billahi rabba, wa bil-islami dina, wa bi-muhammadin sallallahu 'alayhi wa sallama nabiyya",
        translation: "I am pleased with Allah as my Lord, Islam as my religion and Muhammad sallallahu 'alayhi wa sallam as my Prophet (sent by Allah).",
        notes: "Recite 3x",
        fawaid: "Whoever reads it three times in the morning and evening, Allah will give His pleasure to him and the Day of Judgment.",
        source: "HR. Ahmad IV/337, Abu Dawud No. 5072, at-Tirmidzi No. 3389, Ibn Majah No. 3870, an-Nasa'i in 'Amalul Yaum wal Lailah No. 4 and Ibnus Sunni No. 68"
      },
      {
        title: "Asking Allah for Guidance",
        arabic: "يَا حَيُّ يَا قَيُّوْمُ بِرَحْمَتِكَ أَسْتَغِيْثُ، وَأَصْلِحْ لِيْ شَأْنِيْ كُلَّهُ وَلاَ تَكِلْنِيْ إِلَى نَفْسِيْ طَرْفَةَ عَيْنٍ أَبَدًا",
        latin: "ya hayyu ya qayyum, bi rahmatika astaghith. wa aslih li sha'ni kullahu wa la takilni ila nafsi tarfata 'aynin abada",
        translation: "O Ever-Living, O Self-Sustaining, by Your mercy I seek help, rectify all my affairs and do not leave me to myself even for the blink of an eye.",
        notes: "Recite 1x",
        fawaid: "The meaning of this prayer is that humans really need Allah and pray that Allah will not leave him even for a moment.",
        source: "HR. an-Nasa'i in 'Amalul Yaum wal Lailah No. 575, and al-Hakim 1/545, Sahih at-Targhib wat Tarhib 1/417 No. 661, As-Sahihah No. 227, hasan"
      },
      {
        title: "Entering The Morning Upon The Natural Religion of Islam",
        arabic: "أَصْبَحْنَا عَلَى فِطْرَةِ اْلإِسْلاَمِ وَعَلَى كَلِمَةِ اْلإِخْلاَصِ، وَعَلَى دِيْنِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ، وَعَلَى مِلَّةِ أَبِيْنَا إِبْرَاهِيْمَ، حَنِيْفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِيْنَ",
        latin: "asbahna 'ala fitratil-islam wa 'ala kalimatil-ikhlas, wa 'ala dini nabiyyina muhammadin sallallahu 'alayhi wa sallam, wa 'ala millati abina ibrahima hanifan musliman wa ma kana minal-mushrikin",
        translation: "In the morning we are upon the fitrah of Islam, the word of sincerity (the testimony of faith), the religion of our Prophet Muhammad, sallallahu 'alayhi wa sallam, and the religion of our father Abraham, who stood upon the straight path, a Muslim, and was not among the polytheists.",
        notes: "Recite 1x",
        fawaid: "'Fitratil Islam' means above the sunnah, 'kalimatil Ikhlas' means the Shahada and 'hanifan' means the heart is inclined to the straight path and goodness.",
        source: "HR. Ahmad III/406, 407, ad-Darimi II/292 and Ibnus Sunni in Amalul Yaum wal Lailah No. 34, Mishkat al-Masabih No. 2415, Sahih al-Jami' as-Saghir No. 4674, sahih"
      },
      {
        title: "Tawheed Dhikr",
        arabic: "لاَ إِلَـهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيْكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيْرُ",
        latin: "la ilaha illa allah wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir",
        translation: "There is no deity worthy of worship except Allah alone, He has no partner. To Him belongs the dominion and all praise. And He is over all things competent.",
        notes: "Recite 1x or 10x in the morning, Recite 100x a day",
        fawaid: "Whoever reads it 100 times a day, then for him (the reward) is like freeing ten slaves, writing a hundred good things, removing a hundred bad things from him, getting protection from the devil that day until the evening. It is not that a person can bring better than what he brought unless he did more than that.",
        source: "HR al-Bukhari No. 3293 and 6403, Muslim IV/2071 No. 2691 (28), at-Tirmidzi No. 3468, Ibn Majah No. 3798"
      },
      {
        title: "Read Tasbih",
        arabic: "سُبْحَانَ اللهِ وَبِحَمْدِهِ عَدَدَ خَلْقَهِ وَرِضَى نَفْسِهِ وَزِنَةَ عَرْشِهِ وَمِدَادَ كَلِمَاتِهِ",
        latin: "subhanallahi wa bihamdihi 'adada khalqihi wa rida nafsihi wa zinata 'arshihi wa midada kalimatihi",
        translation: "Glory to Allah, I praise Him as many as the number of His creatures, Glory to Allah according to His pleasure, as pure as the weight of His Throne, and as pure as the ink (which writes) His words.",
        notes: "Recite 3x",
        fawaid: "The Prophet, sallallahu 'alayhi wa sallam, told Juwairiyah that the dhikr above has surpassed the dhikr recited by Juwairiyah from after Fajr until Dhuha time.",
        source: "HR. Muslim No. 2726. Sharh Muslim XVII/44. From Juwairiyah binti al-Harits radhiyallahu 'anhuma"
      },
      {
        title: "Dua for Useful Knowledge, Good Sustenance, and Accepted Deeds",
        arabic: "اللَّهُمَّ إِنِّى أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلاً مُتَقَبَّلاً",
        latin: "allahumma inni as'aluka 'ilman nafi'an, wa rizqan tayyiban, wa 'amalan mutaqabbalan",
        translation: "O Allah, I really ask You for knowledge that is beneficial, sustenance that is lawful, and deeds that are accepted.",
        notes: "Recite 1x",
        fawaid: "This prayer is recommended in the morning because morning time has more privileges and blessings. As the words of Rasulullah sallallahu 'alayhi wa sallam \"O Allah, bless my people in the morning\".",
        source: "HR. Ibnu Majah No. 925, Sahih Ibni Majah 1/152 No. 753 Ibnus Sunni in 'Amalul Yaum wal Lailah No. 54, 110, and Ahmad VI/294, 305, 318, 322. From Ummu Salamah, sahih"
      },
      {
        title: "Daily Tasbih and Tahmid",
        arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
        latin: "subhanallah wa bihamdihi",
        translation: "Glory be to Allah, I praise Him.",
        notes: "Recite 100x",
        fawaid: "Whoever says the phrase 'subhanallah wa bi hamdih' in the morning and evening 100 times, then no one will come on the Day of Judgement that is better than what he did except the person who said something like or more thant that.",
        source: "HR. Muslim No. 2691 and No. 2692, from Abu Hurairah radhiyallahu 'anhu Sharh Muslim XVII/17-18, Sahih at-Targhib wat Tarhib 1/413 No. 653"
      },
      {
        title: "Istighfar 100x a Day",
        arabic: "أَسْتَغْفِرُ الله وَأَتُوْبُ إِلَيْهِ",
        latin: "astaghfirullah wa atubu ilayh",
        translation: "I seek forgiveness from Allah and repent to Him.",
        notes: "Recite 100x a day",
        fawaid: "Ibn 'Umar said: The Messenger of Allah, sallallahu 'alayhi wa sallam, said: 'O people, repent to Allah, for indeed I repent to Him one hundred times a day'.",
        source: "HR. al-Bukhari/Fat-hul Baari XI/101 and Muslim No. 2702"
      }
    ];

    // Evening Dhikr data - ALL 17 items from dhikr-evening.json
    const eveningDuas = [
      {
        title: "Ayat al-Kursi",
        arabic: "ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُۥ مَا فِى ٱلسَّمَٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۗ مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَىْءٍ مِّنْ عِلْمِهِۦٓ إِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضَ ۖ وَلَا يَـُٔودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ",
        latin: "allahu la ilaha illa huwa, al-hayyul-qayyum. la ta'khudhuhu sinatun wa la nawm. lahu ma fis-samawati wa ma fil-ard. man dhal-ladhi yashfa'u 'indahu illa bi-idhnihi. ya'lamu ma bayna aydihim wa ma khalfahum. wa la yuhituna bishay'in min 'ilmihi illa bima sha'. wa si'a kursiyyuhu as-samawati wal-ard. wa la ya'udu-hu hifdhuhuma. wa huwa al-'aliyyul-'azim",
        translation: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of [all] existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is [presently] before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.",
        notes: "Read 1x",
        benefits: "Whoever recites this verse in the morning will be protected until the evening. And whoever recites it in the evening will be protected until the morning.",
        source: "HR. at-Tirmidzi: 2879"
      },
      {
        title: "Al-Ikhlas",
        arabic: "قُلْ هُوَ ٱللَّهُ أَحَدٌ (1) ٱللَّهُ ٱلصَّمَدُ (2) لَمْ يَلِدْ وَلَمْ يُولَدْ (3) وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ (4)",
        latin: "qul huwa allahu ahad (1) allahu samad (2) lam yalid wa lam yulad (3) wa lam yakun lahu kufuwan ahad (4)",
        translation: "Say, \"He is Allah , [who is] One, (1) Allah , the Eternal Refuge. (2) He neither begets nor is born, (3) Nor is there to Him any equivalent.\" (4)",
        notes: "Read 3x",
        benefits: "The Messenger of Allah, sallallahu 'alayhi wa sallam, said: Recite Qul huwallahu ahad, and Al-Mu'awwidhatayn (Al-Falaq and An-Nas) in the evening and morning three times, and it will suffice you (protect you) from everything.",
        source: "HR. Abu Dawud No. 4241"
      },
      {
        title: "Al-Falaq",
        arabic: "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ (1) مِن شَرِّ مَا خَلَقَ (2) وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ (3) وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلْعُقَدِ (4) وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ (5)",
        latin: "qul a'udhu birabbil-falaq (1) min sharri ma khalaq (2) wa min sharri ghasiqin idha waqab (3) wa min sharri naffathati fil-'uqad (4) wa min sharri hasidin idha hasad (5)",
        translation: "Say, \"I seek refuge in the Lord of daybreak (1) From the evil of that which He created (2) And from the evil of darkness when it settles (3) And from the evil of the blowers in knots (4) And from the evil of an envier when he envies.\" (5)",
        notes: "Read 3x",
        benefits: "The Messenger of Allah, sallallahu 'alayhi wa sallam, said: Recite Qul huwallahu ahad, and Al-Mu'awwidhatayn (Al-Falaq and An-Nas) in the evening and morning three times, and it will suffice you (protect you) from everything.",
        source: "HR. Abu Dawud No. 4241"
      },
      {
        title: "An-Nas",
        arabic: "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ (1) مَلِكِ ٱلنَّاسِ (2) إِلَٰهِ ٱلنَّاسِ (3) مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ (4) ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ (5) مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ (6)",
        latin: "qul a'udhu birabbin-nas (1) malikin-nas (2) ilahin-nas (3) min sharri al-waswasi al-khannas (4) alladhi yuwaswisu fi sudurin-nas (5) mina al-jinnati wan-nas (6)",
        translation: "Say, \"I seek refuge in the Lord of mankind, (1) The King of mankind. (2) The God of mankind, (3) From the evil of the whisperer who withdraws, (4) Who whispers in the breasts of mankind, (5) Of the jinn and mankind.\" (6)",
        notes: "Read 3x",
        benefits: "The Messenger of Allah, sallallahu 'alayhi wa sallam, said: Recite Qul huwallahu ahad, and Al-Mu'awwidhatayn (Al-Falaq and An-Nas) in the evening and morning three times, and it will suffice you (protect you) from everything.",
        source: "HR. Abu Dawud No. 4241"
      },
      {
        title: "Entering the Evening in the Kingdom of Allah and Seeking His Protection",
        arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ للهِ، وَالْحَمْدُ للهِ، لَا إِلَهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُبِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُبِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُبِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
        latin: "amsayna wa amsal-mulku lillahi wal-hamdu lillahi, la ilaha illa allah wahdahu la sharika lahu, lahu al-mulku wa lahu al-hamdu wa huwa 'ala kulli shay'in qadir. rabbi as'aluka khayra ma fi hadhihil-laylah wa khayra ma ba'daha, wa a'udhu bika min sharri ma fi hadhihil-laylah wa sharri ma ba'daha. rabbi a'udhu bika mina al-kasali wa su'il-kibar. rabbi a'udhu bika min 'adhabin fin-nar wa 'adhabin fil-qabr",
        translation: "We have entered the evening and the dominion belongs to Allah, and all praise is for Allah. There is no deity worthy of worship except Allah alone, He has no partner. To Him belongs the dominion and to Him is praise, and He is over all things competent. My Lord, I ask You for the good of this night and the good of what follows it, and I seek refuge in You from the evil of this night and the evil of what follows it. My Lord, I seek refuge in You from laziness and the evil of old age. My Lord, I seek refuge in You from the punishment of the Fire and the punishment of the grave.",
        notes: "Read 1x",
        benefits: "Seeking protection from evil is prioritized, the principle that shows the importance of this is: \"Preventing harm is more important and prioritized than bringing about good.\"",
        source: "HR. Muslim No. 2723 (75), Abu Dawud No. 5071, and at-Tirmidzi 3390, sahih from Abdullah Ibn Mas'ud"
      },
      {
        title: "Entering the Evening by Seeking Allah's Mercy",
        arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا،وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيْرُ",
        latin: "allahumma bika amsayna, wa bika asbahna, wa bika nahya, wa bika namutu wa ilayka al-masir",
        translation: "O Allah, by Your grace and help we have entered the evening, and by Your grace and help we enter the morning. By Your grace and help we live and by Your will we die. And to You is the final return (of all creatures).",
        notes: "Read 1x",
        benefits: "Everything we do from morning to evening, from the beginning of our lives until we die, is all under Allah's control and to Him we return.",
        source: "HR. al-Bukhari in al-Adab al-Mufrad No. 1199, this wording is the wording of al-Bukhari at-Tirmidzi No. 3391, Abu Dawud No. 5068, Ahmad 11/354, Ibn Majah No. 3868"
      },
      {
        title: "The Master of Seeking Forgiveness",
        arabic: "اَللَّهُمَّ أَنْتَ رَبِّيْ ، لَا إِلٰـهَ إِلاَّ أَنْتَ خَلَقْتَنِيْ وَأَنَا عَبْدُكَ ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ ، أَعُوْذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ ، أَبُوْءُ لَكَ بِنِعْمتِكَ عَلَيَّ ، وَأَبُوْءُ بِذَنْبِيْ فَاغْفِرْ لِيْ ، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ",
        latin: "allahumma anta rabbi la ilaha illa anta khalaqtani wa ana 'abduka wa ana 'ala 'ahdika wa wa'dika mastata'tu a'udhu bika min sharri ma sana'tu abu'u laka bini'matika 'alayya wa abu'u bidhanbi faghfir li fa innahu la yaghfirudh-dhunuba illa anta",
        translation: "O Allah, You are my Lord, there is no deity worthy of worship except You, You created me and I am Your servant. I will be true to my covenant and promise to You as much as I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favor upon me and I acknowledge my sin, therefore, forgive me. Indeed, there is no one who can forgive sins except You.",
        notes: "Read 1x",
        benefits: "Whoever recites it with certainty in the evening, and then he dies, he will enter Paradise, and likewise if (recited) in the morning.",
        source: "HR. al-Bukhari No. 6306, 6323, Ahmad IV/122-125, an-Nasa'i VIII/279-280"
      },
      {
        title: "Prayer for Health and Protection",
        arabic: "اَللَّهُمَّ عَافِنِيْ فِيْ بَدَنِيْ ، اَللَّهُمَّ عَافِنِيْ فِيْ سَمْعِيْ ، اَللَّهُمَّ عَافِنِيْ فِيْ بَصَرِيْ ، لَا إِلَـهَ إِلَّا أَنْتَ ، اَللَّهُمَّ إِنِّيْ أَعُوْذُ بِكَ مِنَ الْكُفْرِوَالْفَقْرِ ، وَأَعُوْذُ بِكَ مِنْ عَذَابِ الْقَبْرِ ، لَا إِلَـهَ إِلَّا أَنْتَ",
        latin: "allahumma 'afini fi badani, allahumma 'afini fi sam'i, allahumma 'afini fi basari, la ilaha illa anta. allahumma inni a'udhu bika minal-kufri wal-faqr, allahumma inni a'udhu bika min 'adhabil-qabr, la ilaha illa anta",
        translation: "O Allah, protect my body (from illness and from what I do not want). O Allah, protect my hearing (from illness and disobedience or from what I do not want). O Allah, protect my sight, there is no deity worthy of worship except You. O Allah, indeed I seek refuge in You from disbelief and poverty. I seek refuge in You from the punishment of the grave, there is no deity worthy of worship except You.",
        notes: "Read 1x",
        benefits: "By asking Allah to grant us well-being in our bodies, we ask to be healed from all physical and spiritual illnesses, so that we have a healthy body and a pure heart, and therefore use this healthy body in a way that pleases Allah.",
        source: "HR. al-Bukhari in Sahih al-Adab al-Mufrad No. 701, Abu Dawud No. 5090, Ahmad V/42, hasan"
      },
      {
        title: "Prayer for Safety in This World and the Hereafter",
        arabic: "اَللَّهُمَّ إِنِّيْ أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَاْلآخِرَةِ، اَللَّهُمَّ إِنِّيْ أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِيْنِيْ وَدُنْيَايَ وَأَهْلِيْ وَمَالِيْ اللَّهُمَّ اسْتُرْ عَوْرَاتِى وَآمِنْ رَوْعَاتِى. اَللَّهُمَّ احْفَظْنِيْ مِنْ بَيْنِ يَدَيَّ، وَمِنْ خَلْفِيْ، وَعَنْ يَمِيْنِيْ وَعَنْ شِمَالِيْ، وَمِنْ فَوْقِيْ، وَأَعُوْذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِيْ",
        latin: "allahumma inni as'alukal-'afwa wal-'afiyah fid-dunya wal-akhirah. allahumma inni as'alukal-'afwa wal-'afiyah fi dini wa dunyaya wa ahli wa mali. allahummastur 'awrati wa amin raw'ati. allahummahfadhni min bayni yadayya wa min khalfi wa 'an yamini wa 'an shimali wa min fawqi wa a'udhu bi 'adhamatika an ughtala min tahti",
        translation: "O Allah, indeed I ask You for well-being and safety in this world and the Hereafter. O Allah, indeed I ask You for well-being and safety in my religion, my world, my family and my wealth. O Allah, cover my flaws (faults and things that are not appropriate for others to see) and calm me from fear. O Allah, protect me from the front, behind, right, left and above me. I seek refuge in Your greatness, so that I am not snatched from below me (by snakes or swallowed by the earth, etc., which would cause me to fall).",
        notes: "Read 1x",
        benefits: "The Messenger of Allah, sallallahu 'alayhi wa sallam, never left this supplication in the morning and evening. It contains protection and safety for religion, the world, family, and wealth from various kinds of disturbances that come from all directions.",
        source: "HR. al-Bukhari in al-Adab al-Mufrad No. 1200, Abu Dawud No. 5074, an-Nasa'i VII/282, Ibn Majah No. 3871, al-Hakim 1/517-518, and others from Ibn Umar radhiyallahu 'anhuma"
      },
      {
        title: "Prayer for Seeking Protection from the Whispers of Satan",
        arabic: "اَللَّهُمَّ عَالِمَ الْغَيْبِ وَالشَّهَادَةِ فَاطِرَ السَّمَاوَاتِ وَاْلأَرْضِ، رَبَّ كُلِّ شَيْءٍ وَمَلِيْكَهُ، أَشْهَدُ أَنْ لاَ إِلَـهَ إِلاَّ أَنْتَ، أَعُوْذُ بِكَ مِنْ شَرِّ نَفْسِيْ، وَمِنْ شَرِّ الشَّيْطَانِ وَشِرْكِهِ، وَأَنْ أَقْتَرِفَ عَلَى نَفْسِيْ سُوْءًا أَوْ أَجُرَّهُ إِلَى مُسْلِمٍ",
        latin: "allahumma 'alimal-ghaybi wash-shahadati, fatiras-samawati wal-ard, rabbakulli shayin wa malikahu. ashhadu alla ilaha illa anta, a'udhu bika min sharri nafsi, wa min sharri ash-shaytani wa shirkih. wa an aqtarifa 'ala nafsi su'an aw ajurrahu ila muslim",
        translation: "O Allah, Knower of the unseen and the seen, Creator of the heavens and the earth, Lord of all things and their Sovereign. I bear witness that there is no deity worthy of worship except You. I seek refuge in You from the evil of myself, Satan and his soldiers (temptations to commit shirk against Allah), and I (seek refuge in You) from committing evil against myself or dragging it to a Muslim.",
        notes: "Read 1x",
        benefits: "The Messenger of Allah, sallallahu 'alayhi wa sallam, said to Abu Bakr as-Siddiq, may Allah be pleased with him, \"Say it morning and evening and when you want to sleep.\"",
        source: "HR. al-Bukhari in al-Adab al-Mufrad No. 1202, at-Tirmidzi No. 3392 and Abu Dawud No. 5067"
      },
      {
        title: "Remembrance to Be Protected from All Dangers",
        arabic: "بِسْمِ اللَّهِ الَّذِى لاَ يَضُرُّ مَعَ اسْمِهِ شَىْءٌ فِى الأَرْضِ وَلاَ فِى السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
        latin: "bismillahilladhi la yadurru ma'asmihi shay'un fil-ardi wa la fis-sama' wa huwas-sami'ul-'alim",
        translation: "In the name of Allah, with whose name nothing in the earth or the heavens can cause harm, and He is the All-Hearing, the All-Knowing.",
        notes: "Read 3x",
        benefits: "Whoever recites it three times in the morning and evening, nothing will harm him.",
        source: "HR. at-Tirmidzi No. 3388, Abu Dawud No. 5088, Ibn Majah No. 3869, al-Hakim 1/514, and Ahmad No. 446 and 474"
      },
      {
        title: "Declaration of Contentment with Allah, Islam, and the Prophet Muhammad sallallahu 'alayhi wa sallam",
        arabic: "رَضِيْتُ بِاللهِ رَبًّا، وَبِاْلإِسْلاَمِ دِيْنًا، وَبِمُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا",
        latin: "raditu billahi rabba, wa bil-islami dina, wa bi-muhammadin sallallahu 'alayhi wa sallama nabiyya",
        translation: "I am pleased with Allah as my Lord, Islam as my religion, and Muhammad, sallallahu 'alayhi wa sallam, as my Prophet.",
        notes: "Read 3x",
        benefits: "Whoever recites it three times in the morning and evening, Allah will grant His pleasure to him on the Day of Resurrection.",
        source: "HR. Ahmad IV/337, Abu Dawud No. 5072, at-Tirmidzi No. 3389, Ibn Majah No. 3870, an-Nasa'i in 'Amalul Yaum wal Lailah No. 4 and Ibnus Sunni No. 68"
      },
      {
        title: " Asking for Guidance from Allah",
        arabic: "يَا حَيُّ يَا قَيُّوْمُ بِرَحْمَتِكَ أَسْتَغِيْثُ، وَأَصْلِحْ لِيْ شَأْنِيْ كُلَّهُ وَلاَ تَكِلْنِيْ إِلَى نَفْسِيْ طَرْفَةَ عَيْنٍ أَبَدًا",
        latin: "ya hayyu ya qayyum, bi-rahmatika astaghith, wa aslih li sha'ni kullahu wa la takilni ila nafsi tarfata 'aynin abada",
        translation: "O Ever-Living, O Self-Sustaining, by Your mercy I seek help, rectify all my affairs and do not leave me to myself even for the blink of an eye.",
        notes: "Read 1x",
        benefits: "The meaning of this supplication is that humans are in dire need of Allah and pray that Allah does not abandon them even for a moment.",
        source: "HR. an-Nasa'i in 'Amalul Yaum wal Lailah No. 575, and al-Hakim 1/545, see Sahih at-Targhib wat Tarhib 1/417 No. 661, As-Sahihah No. 227, hasan"
      },
      {
        title: "Entering the Evening on the Natural Disposition of Islam",
        arabic: "أَمْسَيْنَا عَلَى فِطْرَةِ اْلإِسْلاَمِ وَعَلَى كَلِمَةِ اْلإِخْلاَصِ، وَعَلَى دِيْنِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ، وَعَلَى مِلَّةِ أَبِيْنَا إِبْرَاهِيْمَ، حَنِيْفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِيْنَ",
        latin: "amsayna 'ala fitratil-islam wa 'ala kalimatil-ikhlas, wa 'ala dini nabiyyina muhammadin sallallahu 'alayhi wa sallam, wa 'ala millati abina ibrahima hanifan musliman wa ma kana minal-mushrikin",
        translation: "In the evening we are upon the fitrah of Islam, the word of sincerity (the testimony of faith), the religion of our Prophet Muhammad, sallallahu 'alayhi wa sallam, and the religion of our father Abraham, who stood upon the straight path, a Muslim, and was not among the polytheists.",
        notes: "Read 1x",
        benefits: "'Fitratil Islam' means upon the Sunnah, 'kalimatil ikhlas' means the testimony of faith, and 'hanifan' means a heart inclined towards the straight path and goodness.",
        source: "HR. Ahmad III/406, 407, ad-Darimi II/292 and Ibnus Sunni in Amalul Yaum wal Lailah No. 34, Mishkat al-Masabih No. 2415, Sahih al-Jami' as-Saghir No. 4674, sahih"
      },
      {
        title: "Remembrance of the Oneness of Allah",
        arabic: "لاَ إِلَـهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيْكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيْرُ",
        latin: "la ilaha illa allah wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir",
        translation: "There is no deity worthy of worship except Allah alone, He has no partner. To Him belongs the dominion and all praise. He is over all things competent.",
        notes: "Read 1x or 10x in the morning, Read 100x daily",
        benefits: "Whoever says this dhikr 100 times a day, it is like freeing 10 slaves, 100 good deeds are recorded for him, 100 mistakes are erased for him, he will be protected from the disturbances of Satan from morning until evening, and no one is better than what he does except someone who practices more than that.",
        source: "HR al-Bukhari No. 3293 and 6403, Muslim IV/2071 No. 2691 (28), at-Tirmidzi No. 3468, Ibn Majah No. 3798"
      },
      {
        title: "Reciting Praise to Allah",
        arabic: "سُبْحَانَ اللهِ وَبِحَمْدِهِ عَدَدَ خَلْقَهِ وَرِضَى نَفْسِهِ وَزِنَةَ عَرْشِهِ وَمِدَادَ كَلِمَاتِهِ",
        latin: "subhanallahi wa bihamdihi 'adada khalqihi wa rida nafsihi wa zinata 'arshihi wa midada kalimatihi",
        translation: "Glory be to Allah, as many as His creations, Glory be to Allah as much as His pleasure, Glory be to Allah as much as the weight of His Throne, and as much as the ink of His written words.",
        notes: "Read 3x",
        benefits: "The Prophet, sallallahu 'alayhi wa sallam, told Juwairiyah that the dhikr above has surpassed the dhikr recited by Juwairiyah from after Fajr until Dhuha time.",
        source: "HR. Muslim No. 2726. Sharh Muslim XVII/44. From Juwairiyah bint al-Harith radhiyallahu 'anha"
      },
      {
        title: "Daily Praise (Tasbih and Alhamdulillah)",
        arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
        latin: "subhanallahi wa bihamdihi",
        translation: "Glory be to Allah, and praise be to Him.",
        notes: "Read 100x",
        benefits: "Whoever says \"Subhanallah wa bihamdihi\" 100 times in the morning and evening, then nothing will come on the Day of Judgment better than what he has done except one who says the same or more than that.",
        source: "HR. Muslim No. 2691 and No. 2692, from Abu Hurairah radhiyallahu 'anhu Sharh Muslim XVII/17-18, Sahih at-Targhib wat Tarhib 1/413 No. 653"
      },
      {
        title: "Seeking Forgiveness 100 Times a Day",
        arabic: "أَسْتَغْفِرُ الله وَأَتُوْبُ إِلَيْهِ",
        latin: "astaghfirullah wa atubu ilayh",
        translation: "I seek forgiveness from Allah and repent to Him.",
        notes: "Read 100x daily",
        benefits: "Ibn 'Umar said: The Messenger of Allah, sallallahu 'alayhi wa sallam, said: 'O people, repent to Allah, for indeed I repent to Him one hundred times a day.'",
        source: "HR. al-Bukhari/Fat-hul Baari XI/101 and Muslim No. 2702"
      },
      {
        title: "Prayer for Protection from the Evil of Allah's Creation",
        arabic: "أَعُوْذُ بِكَلِمَاتِ اللهِ التَّآمَّاتِ مِنْ شَرِّ مَا خَلَقَ",
        latin: "a'udhu bikalimatillahit-tammati min sharri ma khalaq",
        translation: "I seek refuge in the perfect words of Allah from the evil of what He has created.",
        notes: "Read 3x",
        benefits: "Whoever recites it three times in the evening, they will not be afflicted with fever that night.",
        source: "HR. Ahmad 11/290, an-Nasa'i in 'Amalul Yaum wal Lailah No. 596, Sahih at-Targhib wat Tarhib 1/412 No. 652, Sahih al-Jami' as-Saghir No. 6427"
      }
    ];

    // Daily Dhikr data - ALL 38 items from dhikr-daily.json
    const dailyDuas = [
      { title: "Supplication Before Sleeping", arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوْتُ وَأَحْيَا", latin: "bismika allahumma amutu wa ahya", translation: "In Your name, O Allah, I die and I live.", notes: null, benefits: "The Prophet, sallallahu 'alayhi wa sallam, always started and ended his day with dhikr.", source: "HR. al-Bukhari" },
      { title: "Supplication Upon Waking Up", arabic: "الحَمْدُ للهِ الَّذِي أَحْيَانَا بعْدَ مَا أماتَنَا وإِلَيْهِ النُّشُورُ", latin: "alhamdulillahilladhi ahyana ba'da ma amatana wa ilayhin-nushur", translation: "All praise is for Allah who gives us life after He has caused us to die, and to Him is the resurrection.", notes: null, benefits: "By reciting the supplication above, a servant begins his day by praising the name of Allah, the Giver of Life and the Bringer of Death.", source: "HR. Bukhari: 6327" },
      { title: "Supplication Entering the Bathroom", arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ", latin: "allahumma inni a'udhu bika minal-khubuthi wal-khaba'ith", translation: "O Allah, I seek refuge in You from the evil and the wicked.", notes: null, benefits: "This supplication acts as a barrier between a servant's private parts and the jinn when entering the bathroom.", source: "HR. al-Bukhari and Muslim" },
      { title: "Supplication Leaving the Bathroom", arabic: "غُفْرَانَكَ", latin: "ghufranak", translation: "I ask for Your forgiveness (O Allah).", notes: null, benefits: "The bathroom is one of the homes of the jinn and devils, so it is recommended to ask for forgiveness for any mistakes, intentional or unintentional, made while in the bathroom.", source: "HR. at-Tirmidzi" },
      { title: "Supplication Before Eating", arabic: "بِسْمِ اللَّهِ", latin: "bismillah", translation: "In the name of Allah.", notes: null, benefits: "The benefit of reciting Bismillah before eating is to prevent Satan from joining humans in eating.", source: "HR. al-Bukari No. 5376 and Muslim No. 2022" },
      { title: "Supplication If Forgetting Bismillah at the Beginning of a Meal", arabic: "بِسْمِ اللَّهِ أَوَّلَهُ وَآخِرَهُ", latin: "bismillahi awwalahu wa akhirahu", translation: "In the name of Allah, at its beginning and its end.", notes: null, benefits: "Islam pays great attention to etiquette. If someone forgets to recite the supplication before eating at the beginning, it is still recommended to recite it in the middle, even if there is only a spoonful of rice left.", source: "HR. Abu Dawud" },
      { title: "Supplication After Eating", arabic: "الْحَمْدُ لِلَّهِ الَّذِى أَطْعَمَنِى هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّى وَلاَ قُوَّةٍ", latin: "alhamdulillahilladhi at'amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah", translation: "All praise is to Allah who has fed me this and provided for me without any power or strength from me.", notes: null, benefits: "The Messenger of Allah, sallallahu 'alayhi wa sallam, said that if someone recites this supplication, then his past sins will be forgiven.", source: "Shahih at-Tirmidzi" },
      { title: "Supplication Entering the Mosque", arabic: "اَللَّهُمَّ افْتَحْ لِيْ أَبْوَابَ رَحْمَتِكَ", latin: "allahummaftah li abwaba rahmatik", translation: "O Allah, open the doors of Your mercy for me.", notes: null, benefits: "The mosque is the house of Allah; a servant should honor it and hope for Allah's mercy within it.", source: "HR. Muslim" },
      { title: "Supplication Leaving the Mosque", arabic: "اَللَّهُمَّ إِنِّيْ أَسْأَلُكَ مِنْ فَضْلِكَ", latin: "allahumma inni as'aluka min fadlik", translation: "O Allah, I ask You for Your bounty.", notes: null, benefits: "Allah's earth is vast, and there are many ways to seek provision. A servant should ask for Allah's bounty to be facilitated in obtaining the provision that Allah has distributed to all His servants.", source: "HR. Muslim No. 713" },
      { title: "Supplication Before Performing Ablution", arabic: "بِسْمِ اللَّهِ", latin: "bismillah", translation: "In the name of Allah.", notes: null, benefits: "It is prescribed to begin every important matter by saying Bismillah, whether it be an act of worship or otherwise.", source: "HR. at-Tirmidzi and al-Baihaqi" },
      { title: "Supplication After Performing Ablution", arabic: "أشْهَدُ أنْ لا إله إِلاَّ اللَّهُ وَحْدَهُ لا شَرِيك لَهُ ، وأشْهَدُ أنَّ مُحَمَّداً عَبْدُهُ وَرَسُولُهُ ، اللَّهُمَّ اجْعَلْنِي مِنَ التَوَّابِينَ ، واجْعَلْني مِنَ المُتَطَهِّرِينَ ، سُبْحانَكَ اللَّهُمَّ وبِحَمْدِكَ ، أشْهَدُ أنْ لا إلهَ إِلاَّ أنْتَ ، أسْتَغْفِرُكَ وأتُوبُ إِلَيْكَ", latin: "ashhadu alla ilaha illa allah wahdahu la sharika lahu, wa ashhadu anna muhammadan 'abduhu wa rasuluh. allahummaj'alni minat-tawwabina waj'alni minal-mutatahhirin. subhanakallahumma wa bihamdika ashhadu alla ilaha illa anta astaghfiruka wa atubu ilayk", translation: "I bear witness that there is no deity except Allah alone, with no partner, and I bear witness that Muhammad is His servant and Messenger. O Allah, make me among those who repent and make me among those who purify themselves. Glory be to You, O Allah, and with Your praise, I bear witness that there is no deity except You. I seek Your forgiveness and repent to You.", notes: null, benefits: "Whoever recites this supplication, eight gates of Paradise will be opened for him, and he may enter from whichever gate he wishes.", source: "HR. Muslim, at-Tirmidzi and an-Nasa'i" },
      { title: "Supplication for Breaking the Fast", arabic: "ذَهَبَ الظَّمَأُ وابْتَلَّتِ الْعُرُوقُ وثَبَتَ اْلأَجْرُ إِنْ شَاءَاللهُ", latin: "dhahabadh-dhama'u wabtallatil-'uruqu wa thabatal-ajru insha allah", translation: "The thirst has gone, the veins are moistened, and the reward is confirmed, Insha Allah.", notes: null, benefits: "It is highly recommended for those who are fasting to increase their supplications before and after breaking the fast, because the supplication of a fasting person is one of the three supplications that are not rejected.", source: "HR. Abu Daud, As-Sunan Al-Kubra Lil Baihaqi, Vol. 4, p. 239, al-Hakim in Mustadrak 'alas Shahihain No. 1484" },
      { title: "Supplication Entering the House #1", arabic: "اَلسَّلَامُ عَلَيْكُمْ", latin: "assalamu 'alaykum", translation: "Peace be upon you.", notes: null, benefits: "The greeting is a supplication of hope, a hope that you will be safe from all kinds of sorrow and suffering, and be enveloped in mercy and blessings.", source: "HR. at-Tirmidzi" },
      { title: "Supplication Entering the House #2", arabic: "اَلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَا تُهُ", latin: "assalamu 'alaykum wa rahmatullahi wa barakatuh", translation: "Peace, mercy, and blessings of Allah be upon you.", notes: null, benefits: "The greeting is a supplication of hope, a hope that you will be safe from all kinds of sorrow and suffering, and be enveloped in mercy and blessings.", source: "HR. at-Tirmidzi" },
      { title: "Supplication Leaving the House", arabic: "بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", latin: "bismillah, tawakkaltu 'alallah, la hawla wa la quwwata illa billah", translation: "In the name of Allah, I place my trust in Allah. There is no might nor power except with Allah.", notes: null, benefits: "Whoever recites this supplication, it will be said to him: \"You will be guided, sufficed, and protected.\" Satan will then depart from him. Another satan will say: \"How can you harm someone who has been guided, sufficed, and protected?!\"", source: "HR. Abu Dawud and at-Tirmidzi" },
      { title: "Supplication for Protection from Causing or Experiencing Harm Outside the House", arabic: "اللَّهُمَّ إِنِّى أَعُوذُ بِكَ أَنْ أَضِلَّ أَوْ أُضَلَّ أَوْ أَزِلَّ أَوْ أُزَلَّ أَوْ أَظْلِمَ أَوْ أُظْلَمَ أَوْ أَجْهَلَ أَوْ يُجْهَلَ عَلَىَّ", latin: "allahumma inni a'udhu bika an adilla aw udalla, aw azilla aw uzalla, aw adhlima aw udhlama, aw ajhala aw yujhala 'alayya", translation: "O Allah, I seek refuge in You lest I should stray or be led astray, slip or be tripped, wrong or be wronged, or act foolishly or have foolishness done to me.", notes: null, benefits: "When a person leaves the house, they will encounter all kinds of things, both good and bad, especially harm caused by themselves. Therefore, it is commanded to seek refuge from oneself and from others.", source: "HR. Abu Dawud, at-Tirmidzi, Ibn Majah and an-Nasa'i" },
      { title: "Travel Supplication", arabic: "الله أَكْبَرُ،الله أَكْبَرُ،الله أَكْبَرُ،سُبْحَانَ الَّذِى سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ اللَّهُمَّ إِنَّا نَسْأَلُكَ فِى سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى وَمِنَ الْعَمَلِ مَا تَرْضَى اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ اللَّهُمَّ أَنْتَ الصَّاحِبُ فِى السَّفَرِ وَالْخَلِيفَةُ فِى الأَهْلِ اللَّهُمَّ إِنِّى أَعُوذُ بِكَ مِنْ وَعْثَاءِ السَّفَرِ وَكَآبَةِ الْمَنْظَرِ وَسُوءِ الْمُنْقَلَبِ فِى الْمَالِ وَالأَهْلِ", latin: "allahu akbar, allahu akbar, allahu akbar. subhanalladhi sakhkhara lana hadha wa ma kunna lahu muqrinin wa inna ila rabbina lamunqalibun. allahumma inna nas'aluka fi safarina hadhal-birra wat-taqwa wa minal-'amali ma tarda. allahumma hawwin 'alayna safarana hadha watwi 'anna bu'dah. allahumma antas-sahibu fis-safar. wal-khalifatu fil-ahl. allahumma inni a'udhu bika min wa'tha'is-safar wa ka'abatil-mandhari wa su'il-munqalabi fil-mali wal-ahl", translation: "Allah is the Greatest, Allah is the Greatest, Allah is the Greatest. Glory be to Him who has provided this for us, though we could never have had it by our own efforts. Surely to our Lord we are returning. O Allah, we ask You for righteousness and piety in this journey of ours, and for deeds that please You. O Allah, lighten for us the hardship of this journey and quickly bring us to our destination. O Allah, You are our Companion on the journey and the Guardian of our families. O Allah, I seek refuge in You from the hardship of travel, from a bad return, and from seeing something unpleasant concerning our wealth, family, or children.", notes: null, benefits: "This supplication has two parts. The first is praise of Allah and the submission of the servant. The second is a request to Allah for ease in travel and in the affairs of what the servant has left at home.", source: "HR. Muslim" },
      { title: "Supplication of a Resident for Someone Who is Traveling", arabic: "أَسْتَوْدِعُ اللَّهَ دِينَكَ وَأَمَانَتَكَ وَخَوَاتِيمَ عَمَلِكَ", latin: "astawdi'ullaha dinaka, wa amanataka, wa khawatima 'amalik", translation: "I entrust your religion, your trust, and the end of your deeds to Allah.", notes: null, benefits: "Three priorities of a servant that must be maintained everywhere: religion, trust, and deeds, because a person will be resurrected according to their deeds.", source: "HR. Abu Dawud: 2601" },
      { title: "Supplication for Piety from a Resident to Someone Who is Traveling", arabic: "زَوَّدَكَ اللَّهُ التَّقْوَى وَغَفَرَ ذَنْبَكَ  وَيَسَّرَ لَكَ الْخَيْرَ حَيْثُمَا كُنْتَ", latin: "zawwadakallahut-taqwa, wa ghafara dhanbaka, wa yassara lakal-khayra haythuma kunta", translation: "May Allah provide you with piety, forgive your sins, and ease goodness for you wherever you are.", notes: null, benefits: "Piety is the best provision that a servant must prepare for the Hereafter, because there is no salvation except through piety.", source: "HR. at-Tirmidzi" },
      { title: "Supplication When Wearing New Clothes", arabic: "اللَّهُمَّ لَكَ الْحَمْدُ أَنْتَ كَسَوْتَنِيهِ أَسْأَلُكَ مِنْ خَيْرِهِ وَخَيْرِ مَا صُنِعَ لَهُ وَأَعُوذُ بِكَ مِنْ شَرِّهِ وَشَرِّ مَا صُنِعَ لَهُ", latin: "allahumma lakal-hamdu anta kasawtanihi. as'aluka min khayrihi wa khayri ma suni'a lah, wa a'udhu bika min sharrihi wa sharri ma suni'a lah", translation: "O Allah, to You is all praise. You have clothed me with this. I ask You for its goodness and the goodness for which it was made, and I seek refuge in You from its evil and the evil for which it was made.", notes: null, benefits: "By reciting this supplication, one asks that the clothes they have bought may provide goodness and also be a protection against various evils.", source: "HR. Ahmad, Abu Dawud, at-Tirmidzi and Al-Hakim" },
      { title: "Supplication When Wearing Clothes", arabic: "الْحَمْدُ لِلَّهِ الَّذِى كَسَانِى هَذَا الثَّوْبَ وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّى وَلاَ قُوَّةٍ", latin: "alhamdulillahilladhi kasani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah", translation: "Praise be to Allah who has clothed me with this garment and provided it for me without any power or strength from me.", notes: null, benefits: "The virtue of reciting this supplication is that past sins will be forgiven, Insha Allah.", source: "HR. all compilers of Sunan books, except Nasa'i" },
      { title: "Supplication When Mounting a Vehicle", arabic: "بِسْمِ اللَّهِ، بِسْمِ اللَّهِ، بِسْمِ اللَّهِ، الحَمْدُ للِه، سُبْحَانَ الَّذِى سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ، سُبْحَانَكَ إِنِّى قَدْ ظَلَمْتُ نَفْسِى فَاغْفِرْ لِى فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ", latin: "bismillah, bismillah, bismillah, alhamdulillah, subhanalladhi sakhkhara lana hadha wa ma kunna lahu muqrinin. wa inna ila rabbina lamunqalibun. subhanaka inni qad dhalamtu nafsi, faghfir li fa innahu la yaghfirudh-dhunuba illa anta", translation: "In the name of Allah, in the name of Allah, in the name of Allah. All praise is to Allah. Glory be to Him who has subjected this to us, and we could not have done so by ourselves. And indeed, to our Lord we will return. Glory be to You, indeed I have wronged myself, so forgive me, for none can forgive sins except You.", notes: null, benefits: "By reciting the supplication for mounting a vehicle, our journey will always be under the protection of Allah. In addition, we will also receive rewards, help, and a calmer heart.", source: "HR. Abu Dawud and at-Tirmidzi" },
      { title: "Supplication When it Rains", arabic: "اللَّهُمَّ صَيِّبًا نَافِعًا", latin: "allahumma sayyiban nafi'a", translation: "O Allah, make it a beneficial rain.", notes: null, benefits: "It is encouraged to pray when it rains so that goodness and blessings increase, as well as its benefits.", source: "HR. al-Bukhari No. 1032" },
      { title: "Supplication During Heavy Rain", arabic: "اللَّهُمَّ حَوَالَيْنَا وَلاَ عَلَيْنَا ، اللَّهُمَّ عَلَى الآكَامِ وَالظِّرَابِ وَبُطُونِ الأَوْدِيَةِ وَمَنَابِتِ الشَّجَرِ", latin: "allahumma hawalayna wa la 'alayna. allahumma 'alal-akami wadh-dhirabi, wa butunil-awdiyati, wa manabitish-shajar", translation: "O Allah, (let the rain fall) around us, not on us. O Allah, (let it fall) on the hills, mountains, small mountains, valleys, and places where trees grow.", notes: null, benefits: "The supplication above is recited when the rain gets heavier or there is a concern that the rain will cause harm.", source: "HR. al-Bukhari No. 1014" },
      { title: "Supplication After it Rains", arabic: "مُطِرْنا بفَضْلِ اللهِ ورَحْمَتِهِ", latin: "mutirna bi fadlillahi wa rahmatih", translation: "We have been given rain by the bounty and mercy of Allah.", notes: null, benefits: "By reciting this supplication, one believes that rain falls by the will of Allah (Allah's virtue), not by the stars, so they do not become disbelievers in Allah.", source: "HR. al-Bukhari No. 846 and Muslim No. 71" },
      { title: "Supplication During Strong Wind", arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَهَا، وَأَعُوْذُ بِكَ مِنْ شَرِّهَا", latin: "allahumma inni as'aluka khayraha wa a'udhu bika min sharriha", translation: "O Allah, I ask You for the good of this wind, and I seek refuge in You from its evil.", notes: null, benefits: "Among the signs of Allah's power is a strong wind that can bring blessings and punishment, namely good and bad. Therefore, a servant should continue to ask for good and seek refuge from all harm.", source: "HR. Abu Dawud and Ibn Majah" },
      { title: "The Best Supplication for Seeking Forgiveness (Sayyid al-Istighfar)", arabic: "اَللَّهُمَّ أَنْتَ رَبِّيْ ، لَا إِلٰـهَ إِلاَّ أَنْتَ خَلَقْتَنِيْ وَأَنَا عَبْدُكَ ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ ، أَعُوْذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ ، أَبُوْءُ لَكَ بِنِعْمتِكَ عَلَيَّ ، وَأَبُوْءُ بِذَنْبِيْ فَاغْفِرْ لِيْ ، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ", latin: "allahumma anta rabbi la ilaha illa anta khalaqtani wa ana 'abduka wa ana 'ala 'ahdika wa wa'dika mastata'tu a'udhu bika min sharri ma sana'tu abu'u laka bini'matika 'alayya wa abu'u bidhanbi faghfir li fa innahu la yaghfirudh-dhunuba illa anta", translation: "O Allah, You are my Lord. There is no deity worthy of worship except You. You created me, and I am Your servant. I abide to Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your blessings upon me, and I acknowledge my sin. So forgive me, for none can forgive sins except You.", notes: null, benefits: "Whoever recites it with certainty in the evening, and then he dies, he will enter Paradise, and likewise if (recited) in the morning.", source: "HR. al-Bukhari No. 6306, 6323, Ahmad IV/122-125, an-Nasa'i VIII/279-280" },
      { title: "Supplication for Ease in All Matters", arabic: "اللَّهُمَّ لاَ سَهْلَ إِلاَّ مَا جَعَلْتَهُ سَهْلاً وَأَنْتَ تَجْعَلُ الحَزْنَ إِذَا شِئْتَ سَهْلاً", latin: "allahumma la sahla illa ma ja'altahu sahla, wa anta taj'alul-hazna idha shi'ta sahla", translation: "O Allah, there is no ease except in that which You make easy, and You make the difficult easy if You wish.", notes: null, benefits: "Ease comes only from Allah. Even something difficult can become easy Insha Allah.", source: "HR. Ibn Hibban" },
      { title: "Supplication When Afflicted by Calamity", arabic: "إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ اللَّهُمَّ أْجُرْنِى فِى مُصِيبَتِى وَأَخْلِفْ لِى خَيْرًا مِنْهَا", latin: "inna lillahi wa inna ilayhi raji'un. allahumma'jurni fi musibati wa akhlif li khayran minha", translation: "Indeed we belong to Allah, and indeed to Him we will return. O Allah, reward me for my affliction and replace it with something better.", notes: null, benefits: "A servant should recite the supplication above when afflicted by calamity with certainty and hope. Insha Allah, with this, they will receive a better replacement.", source: "HR. Muslim" },
      { title: "Supplication When in Debt", arabic: "اللَّهُمَّ اكْفِنِى بِحَلاَلِكَ عَنْ حَرَامِكَ وَأَغْنِنِى بِفَضْلِكَ عَمَّنْ سِوَاكَ", latin: "allahummakfini bi halalika 'an haramik, wa aghnini bi fadlika 'amman siwak", translation: "O Allah, suffice me with what is lawful and keep me away from what is unlawful, and enrich me with Your bounty so I do not depend on anyone besides You.", notes: null, benefits: "Lawful provision, even if it is little, is better than abundant unlawful wealth.", source: "HR. at-Tirmidzi No. 2563" },
      { title: "Supplication for Protection from Laziness, Sadness, and Debt", arabic: "اَللّٰهُمَّ إِنِّى أَعُوْذُبِكَ مِنَ الْهَمِّ وَالْحَزْنِ وَأَعُوْذُبِكَ مِنَ الْعَجْزِ وَالْكَسَلِ وَأَعُوْذُبِكَ مِنَ الْجُبْنِ وَالْبُخْلِ وَأَعُوْذُبِكَ مِنْ غَلَبَتِ الدَّيْنِ وَقَهْرِ الرجال", latin: "allahumma inni a'udhu bika minal-hammi wal-hazan. wa a'udhu bika minal-'ajzi wal-kasal. wa a'udhu bika minal-jubni wal-bukhl. wa a'udhu bika min ghalabatid-dayni wa qahrir-rijal", translation: "O Allah, I seek refuge in You from anxiety and grief, and I seek refuge in You from incapacity and laziness, and I seek refuge in You from cowardice and miserliness, and I seek refuge in You from being overpowered by debt and from being overcome by men.", notes: null, benefits: "Abu Umamah then narrated: After I practiced this supplication, Allah truly removed my anxiety and gave me the ability to repay my debt.", source: "HR. Abu Dawud No. 1555" },
      { title: "Supplication After Sneezing", arabic: "الحَمْدُ للهِ", latin: "alhamdulillah", translation: "All praise is to Allah.", notes: null, benefits: "Indeed, Allah loves sneezing because it moves a person to worship. It is encouraged to respond to the praise of Allah by someone who praises Allah, and vice versa.", source: "HR. al-Bukhari" },
      { title: "Supplication Upon Hearing Someone Sneeze", arabic: "يَرْحَمُكَ اللهُ", latin: "yarhamukallah", translation: "May Allah have mercy on you.", notes: null, benefits: "Indeed, Allah loves sneezing because it moves a person to worship. It is encouraged to respond to the praise of Allah by someone who praises Allah, and vice versa.", source: "HR. al-Bukhari" },
      { title: "Response to Someone Who Says 'Yarhamukallah' After You Sneeze", arabic: "يَهْدِيكُمُ اللهُ وَيُصْلِحُ بَالَكُمْ", latin: "yahdikumullah wa yuslihu balakum", translation: "May Allah guide you and improve your condition.", notes: null, benefits: "Indeed, Allah loves sneezing because it moves a person to worship. It is encouraged to respond to the praise of Allah by someone who praises Allah, and vice versa.", source: "HR. al-Bukhari" },
      { title: "Supplication for Good Character", arabic: "اللَّهُمَّ كَمَا حَسَّنْتَ خَلْقِي فَحَسِّنْ خُلُقِي", latin: "allahumma kama hassanta khalqi fahassin khuluqi", translation: "O Allah, just as You have made my external form good, make my character good as well.", notes: null, benefits: "A charming appearance is not enough provision for a Muslim, but it must be accompanied by noble character. Therefore, a Muslim should constantly ask for their character to be improved and beautified.", source: "HR. Ahmad, authenticated by al-Albani in al-Irwa', 1/115" },
      { title: "Prayer for Protection from Satan", arabic: "رَبِّ أَعُوْذُ بِكَ مِنْ هَمَزَاتِ الشَّيَاطِيْنِ وَأَعُوْذُ بِكَ رَبِّ أَنْ يَحْضُرُوْنِ", latin: "rabbi a'udhu bika min hamazatish-shayatin wa a'udhu bika rabbi ay-yahdurun", translation: "My Lord, I seek refuge in You from the whispers of Satan, and I seek refuge in You, my Lord, from their presence around me.", notes: null, fawaid: "Indeed, Allah commands the Prophet Muhammad and all his followers to seek refuge from the whispers of Satan in all activities, especially when approaching death. Satan whispers evil into the hearts of humans, encouraging wrongdoing.", source: "QS. Al-Mu'minun: 97-98" },
      { title: "Prayer After the Adhan", arabic: "اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ", latin: "allahumma rabba hadhihid-da'watit-tammah, was-salatil-qa'imah, ati muhammadanil-wasilata wal-fadilah, wab'ath-hu maqaman mahmudanilladhi wa'adtah", translation: "O Allah, Lord of this perfect call and the established prayer, grant Muhammad the wasilah (a high status in Paradise) and the excellence (above all creation), and raise him to the praiseworthy station that You have promised him.", notes: null, fawaid: "This prayer is recommended by the Prophet Muhammad sallallahu 'alayhi wa sallam for those who hear the call to prayer. It has many benefits, including receiving intercession from the Prophet on the Day of Judgment, attaining the wasilah and honor in Paradise for the Prophet, and receiving great and commendable reward from Allah. It is also a way to show respect and admiration for Allah and His Messenger, expressing love and longing for the Prophet Muhammad, the role model for Muslims.", source: "Narrated by Abu Dawud (529), at-Tirmidhi (211), an-Nasa'i (2:26), Ibn Majah (722)" },
      { title: "Prayer for Forgiveness for Parents", arabic: "رَبَّنَا ٱغْفِرْ لِى وَلِوَٰلِدَىَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ ٱلْحِسَابُ", latin: "rabbanaghfir li wa liwalidayya wa lil-mu'minina yawma yaqumul-hisab", translation: "Our Lord, forgive me and my parents and all the believers on the Day the account is established.", notes: null, fawaid: "This is a prayer of Prophet Ibrahim (peace be upon him), teaching us to honor and love our parents, remember the Day of Judgment, and care for fellow believers. By making this prayer, we hope that Allah will forgive our sins and make us among the faithful.", source: "QS. Ibrahim: 41" }
    ];

    // After Salah Dhikr data - ALL 13 items from dhikr-after-salah.json
    const afterSalahDuas = [
      { title: "Istighfar", arabic: "أَسْتَغْفِرُ اللَّهَ", latin: "astaghfirullah", translation: "I seek forgiveness from Allah.", notes: "Read 3x", benefits: "When the Messenger of Allah, sallallahu 'alayhi wa sallam, finished his prayer, he would seek forgiveness three times and recite the dhikr above. Al-Auza'i stated that the recitation of istighfar is 'Astaghfirullah, Astaghfirullah.'", source: "HR. Muslim No. 591" },
      { title: "Allah, The Giver of Peace", arabic: "اَللَّهُمَّ أَنْتَ السَّلاَمُ، وَمِنْكَ السَّلاَمُ، تَبَارَكْتَ يَا ذَا الْجَلاَلِ وَاْلإِكْرَامِ", latin: "allahumma antas-salam wa minkas-salam tabarakta ya dhal-jalali wal-ikram", translation: "O Allah, You are Peace, and from You is peace. Blessed are You, O Possessor of majesty and honor.", notes: "Read 1x", benefits: "When the Messenger of Allah, sallallahu 'alayhi wa sallam, finished his prayer, he would seek forgiveness three times and recite the dhikr above. Al-Auza'i stated that the recitation of istighfar is 'Astaghfirullah, Astaghfirullah.'", source: "HR. Muslim No. 591" },
      { title: "Allah, The Preventer and The Giver of All Things", arabic: "لاَ إِلَـهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيْكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيْرُ، اَللَّهُمَّ لاَ مَانِعَ لِمَا أَعْطَيْتَ، وَلاَ مُعْطِيَ لِمَا مَنَعْتَ، وَلاَ يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ", latin: "la ilaha illa allah wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir. allahumma la mani'a lima a'tayta wa la mu'tiya lima mana'ta wa la yanfa'u dhal-jaddi minkal-jaddu", translation: "There is no deity worthy of worship except Allah alone, He has no partner. To Him belongs dominion and praise, and He is over all things competent. O Allah, there is no preventer of what You give, and no giver of what You withhold, and wealth and honor do not benefit their possessor (except faith and righteous deeds that save from punishment). Only from You is wealth and honor.", notes: "Read 1x", benefits: null, source: "HR. Bukhari No. 844 and Muslim No. 593" },
      { title: "Allah, The Possessor of All and The Only One Worthy of Worship", arabic: "لاَ إِلَـهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيْكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيْرُ. لاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللهِ، لاَ إِلَـهَ إِلاَّ اللهُ، وَلاَ نَعْبُدُ إِلاَّ إِيَّاهُ، لَهُ النِّعْمَةُ وَلَهُ الْفَضْلُ وَلَهُ الثَّنَاءُ الْحَسَنُ، لاَ إِلَـهَ إِلاَّ اللهُ مُخْلِصِيْنَ لَهُ الدِّيْنَ وَلَوْ كَرِهَ الْكَافِرُوْنَ", latin: "la ilaha illa allah wahdahu la sharika lah. lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir. la hawla wa la quwwata illa billah. la ilaha illa allah wa la na'budu illa iyyah. lahun-ni'mah wa lahul-fadl wa lahuth-thana'ul-hasan. la ilaha illa allah mukhlisina lahud-dina wa law karihal-kafirun", translation: "There is no deity worthy of worship except Allah alone, He has no partner. To Him belongs dominion and praise, and He is over all things competent. There is no power and no strength except by Allah. There is no deity worthy of worship except Allah, and we do not worship except Him. To Him belongs all favor, grace, and good praise. There is no deity worthy of worship except Allah, making our religion sincerely for Him, even if the disbelievers dislike it.", notes: "Read 1x", benefits: "'Abdullah bin Zubair said, \"The Prophet, sallallahu 'alayhi wa sallam, used to recite the tahlil (laa ilaha illallah) at the end of the prayer.\"", source: "HR. Muslim No. 594" },
      { title: "Tasbih", arabic: "سُبْحَانَ اللهِ", latin: "subhanallah", translation: "Glory be to Allah", notes: "Read 33x", benefits: null, source: null },
      { title: "Tahmid", arabic: "الْحَمْدُ لِلَّهِ", latin: "alhamdulillah", translation: "All praise is for Allah", notes: "Read 33x", benefits: null, source: null },
      { title: "Takbir", arabic: "اللهُ أَكْبَرُ", latin: "allahu akbar", translation: "Allah is the Greatest", notes: "Read 33x", benefits: null, source: null },
      { title: "There is No Partner for Allah, and To Him Belongs All Things", arabic: "لاَ إِلَـهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيْكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيْرُ", latin: "la ilaha illa allah wahdahu la sharika lah. lahul-mulku wa lahul-hamdu wa huwa 'ala kulli shay'in qadir", translation: "There is no deity worthy of worship except Allah alone, He has no partner. To Him belongs dominion and praise, and He is over all things competent.", notes: "Read 1x", benefits: "Whoever recites the dhikr above, his sins will be forgiven, even if they are as numerous as the foam on the ocean. Imam Nawawi, may Allah have mercy on him, said that the text of the hadith indicates that 'Subhanallah', 'Alhamdulillah', and 'Allahu akbar' are each recited 33 times separately.", source: "Sharh Shahih Muslim, 5: 84" },
      { title: "Ayat al-Kursi", arabic: "ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُۥ مَا فِى ٱلسَّمَٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۗ مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَىْءٍ مِّنْ عِلْمِهِۦٓ إِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضَ ۖ وَلَا يَـُٔودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ", latin: "allahu la ilaha illa huwa, al-hayyul-qayyum. la ta'khudhuhu sinatun wa la nawm. lahu ma fis-samawati wa ma fil-ard. man dhal-ladhi yashfa'u 'indahu illa bi-idhnihi. ya'lamu ma bayna aydihim wa ma khalfahum. wa la yuhituna bishay'in min 'ilmihi illa bima sha'. wa si'a kursiyyuhu as-samawati wal-ard. wa la ya'udu-hu hifdhuhuma. wa huwa al-'aliyyul-'azim", translation: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of [all] existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is [presently] before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.", notes: "Read 1x", benefits: "Whoever recites Ayat al-Kursi after finishing the prayer, nothing will prevent him from entering Paradise except death.", source: "HR. an-Nasai in Al-Kubro 9: 44. This hadith is declared sahih by Ibn Hibban, as mentioned by Ibn Hajar in Bulugh al-Maram" },
      { title: "Al-Ikhlas", arabic: "قُلْ هُوَ ٱللَّهُ أَحَدٌ (1) ٱللَّهُ ٱلصَّمَدُ (2) لَمْ يَلِدْ وَلَمْ يُولَدْ (3) وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ (4)", latin: "qul huwa allahu ahad (1) allahu samad (2) lam yalid wa lam yulad (3) wa lam yakun lahu kufuwan ahad (4)", translation: "Say, \"He is Allah , [who is] One, (1) Allah , the Eternal Refuge. (2) He neither begets nor is born, (3) Nor is there to Him any equivalent.\" (4)", notes: "Read 3x", benefits: "The Messenger of Allah, sallallahu 'alayhi wa sallam, said: Recite Qul huwallahu ahad, and Al-Mu'awwidhatayn (Al-Falaq and An-Nas) in the evening and morning three times, and it will suffice you (protect you) from everything.", source: "HR. Abu Dawud No. 1523 and an-Nasa'i No. 1337. Al-Hafiz Abu Tahir said that the chain of this hadith is hasan" },
      { title: "Al-Falaq", arabic: "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ (1) مِن شَرِّ مَا خَلَقَ (2) وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ (3) وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلْعُقَدِ (4) وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ (5)", latin: "qul a'udhu birabbil-falaq (1) min sharri ma khalaq (2) wa min sharri ghasiqin idha waqab (3) wa min sharri naffathati fil-'uqad (4) wa min sharri hasidin idha hasad (5)", translation: "Say, \"I seek refuge in the Lord of daybreak (1) From the evil of that which He created (2) And from the evil of darkness when it settles (3) And from the evil of the blowers in knots (4) And from the evil of an envier when he envies.\" (5)", notes: "Read 3x", benefits: "The Messenger of Allah, sallallahu 'alayhi wa sallam, said: Recite Qul huwallahu ahad, and Al-Mu'awwidhatayn (Al-Falaq and An-Nas) in the evening and morning three times, and it will suffice you (protect you) from everything.", source: "HR. Abu Dawud No. 1523 and an-Nasa'i No. 1337. Al-Hafiz Abu Tahir said that the chain of this hadith is hasan" },
      { title: "An-Nas", arabic: "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ (1) مَلِكِ ٱلنَّاسِ (2) إِلَٰهِ ٱلنَّاسِ (3) مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ (4) ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ (5) مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ (6)", latin: "qul a'udhu birabbin-nas (1) malikin-nas (2) ilahin-nas (3) min sharri al-waswasi al-khannas (4) alladhi yuwaswisu fi sudurin-nas (5) mina al-jinnati wan-nas (6)", translation: "Say, \"I seek refuge in the Lord of mankind, (1) The King of mankind. (2) The God of mankind, (3) From the evil of the whisperer who withdraws, (4) Who whispers in the breasts of mankind, (5) Of the jinn and mankind.\" (6)", notes: "Read 3x", benefits: "The Messenger of Allah, sallallahu 'alayhi wa sallam, said: Recite Qul huwallahu ahad, and Al-Mu'awwidhatayn (Al-Falaq and An-Nas) in the evening and morning three times, and it will suffice you (protect you) from everything.", source: "HR. Abu Dawud No. 1523 and an-Nasa'i No. 1337. Al-Hafiz Abu Tahir said that the chain of this hadith is hasan" },
      { title: "Supplication for Beneficial Knowledge, Good Provision, and Accepted Deeds", arabic: "اللَّهُمَّ إِنِّى أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلاً مُتَقَبَّلاً", latin: "allahumma inni as'aluka 'ilman nafi'an, wa rizqan tayyiban, wa 'amalan mutaqabbalan", translation: "O Allah, I ask You for beneficial knowledge, good provision, and accepted deeds.", notes: "Read 1x after the salam of Fajr prayer", benefits: "Beneficial knowledge is a provision that makes life easier, obtaining good provision is a person's goal in working, and accepted deeds are the hope of every person who performs good deeds. Therefore, a servant should always ask for these 3 things every morning before starting their various activities.", source: "HR. Ibn Majah No. 925 and Ahmad 6: 305, 322. Al-Hafiz Abu Tahir said that this hadith is sahih" }
    ];

    // Categories metadata - counts are computed from arrays
    const categories = [
      {
        id: "morning",
        title: "Morning Adhkar",
        titleArabic: "أذكار الصباح",
        description: "Supplications to be recited after Fajr prayer until sunrise. Contains 21 complete adhkar with full Arabic text, transliteration, translation, and benefits.",
        icon: "sunny-outline",
        gradientColors: ["#667eea", "#764ba2"] as [string, string],
        count: morningDuas.length
      },
      {
        id: "evening",
        title: "Evening Adhkar",
        titleArabic: "أذكار المساء",
        description: "Supplications to be recited after Asr prayer until Maghrib. Contains 17 complete adhkar with full Arabic text, transliteration, translation, and benefits.",
        icon: "moon-outline",
        gradientColors: ["#30cfd0", "#330867"] as [string, string],
        count: eveningDuas.length
      },
      {
        id: "daily",
        title: "Daily Duas",
        titleArabic: "أدعية يومية",
        description: "Everyday supplications for various occasions including eating, traveling, sleeping, and more. Contains 38 complete duas.",
        icon: "calendar-outline",
        gradientColors: ["#11998e", "#38ef7d"] as [string, string],
        count: dailyDuas.length
      },
      {
        id: "after-salah",
        title: "After Salah",
        titleArabic: "أذكار بعد الصلاة",
        description: "Dhikr and supplications to recite after each of the five daily prayers. Contains 13 complete adhkar including Ayatul Kursi and Al-Mu'awwidhatayn.",
        icon: "hand-left-outline",
        gradientColors: ["#fa709a", "#fee140"] as [string, string],
        count: afterSalahDuas.length
      }
    ];

    // Write to Firestore
    const batch = db.batch();

    // Categories document
    const categoriesRef = db.collection("duaData").doc("categories");
    batch.set(categoriesRef, { items: categories });

    // Morning duas
    const morningRef = db.collection("duaData").doc("morning");
    batch.set(morningRef, { items: morningDuas });

    // Evening duas
    const eveningRef = db.collection("duaData").doc("evening");
    batch.set(eveningRef, { items: eveningDuas });

    // Daily duas
    const dailyRef = db.collection("duaData").doc("daily");
    batch.set(dailyRef, { items: dailyDuas });

    // After Salah duas
    const afterSalahRef = db.collection("duaData").doc("after-salah");
    batch.set(afterSalahRef, { items: afterSalahDuas });

    await batch.commit();

    res.status(200).json({
      success: true,
      message: "Dua data seeded successfully",
      data: {
        categories: categories.length,
        morning: morningDuas.length,
        evening: eveningDuas.length,
        daily: dailyDuas.length,
        afterSalah: afterSalahDuas.length,
        total: morningDuas.length + eveningDuas.length + dailyDuas.length + afterSalahDuas.length
      }
    });
  } catch (error) {
    console.error("Error seeding dua data:", error);
    res.status(500).json({ error: "Failed to seed dua data" });
  }
});
