/**
 * Prayer Steps Generator
 * Generates complete step-by-step guides for each prayer from beginning to end.
 * Each prayer is a standalone walkthrough - no references to other prayers.
 */

import type { PrayerStep } from '@/types/prayer';

// Common recitations used across prayers
const RECITATIONS = {
  takbir: {
    arabic: 'اللهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    translation: 'Allah is the Greatest',
  },
  fatiha: {
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
    transliteration: "Bismillahir Rahmanir Raheem. Al-hamdu lillahi Rabbil 'aalameen. Ar-Rahmanir Raheem. Maaliki yawmid-deen. Iyyaaka na'budu wa iyyaaka nasta'een. Ihdinas-siraatal-mustaqeem. Siraatal-lazeena an'amta 'alayhim, ghayril-maghdoobi 'alayhim wa lad-daaalleen. (Ameen)",
    translation: 'In the name of Allah, the Most Gracious, the Most Merciful. All praise is due to Allah, Lord of all the worlds. The Most Gracious, the Most Merciful. Master of the Day of Judgment. You alone we worship, and You alone we ask for help. Guide us on the Straight Path. The path of those who have received Your grace; not the path of those who have brought down wrath upon themselves, nor of those who have gone astray. (Amen)',
  },
  ruku: {
    arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ',
    transliteration: 'Subhana Rabbiyal Adheem',
    translation: 'Glory be to my Lord, the Magnificent',
  },
  risingFromRuku: {
    arabic: 'سَمِعَ اللهُ لِمَنْ حَمِدَهُ',
    transliteration: "Sami' Allahu liman hamidah",
    translation: 'Allah hears those who praise Him',
  },
  standingAfterRuku: {
    arabic: 'رَبَّنَا وَلَكَ الْحَمْدُ',
    transliteration: 'Rabbana wa lakal hamd',
    translation: 'Our Lord, to You belongs all praise',
  },
  sujud: {
    arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى',
    transliteration: "Subhana Rabbiyal A'la",
    translation: 'Glory be to my Lord, the Most High',
  },
  sittingBetweenSujud: {
    arabic: 'رَبِّ اغْفِرْ لِي رَبِّ اغْفِرْ لِي',
    transliteration: 'Rabbighfir li, Rabbighfir li',
    translation: 'My Lord, forgive me. My Lord, forgive me',
  },
  tashahhud: {
    arabic: 'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    transliteration: "At-tahiyyatu lillahi was-salawatu wat-tayyibat. As-salamu 'alayka ayyuhan-Nabiyyu wa rahmatullahi wa barakatuh. As-salamu 'alayna wa 'ala 'ibadillahis-saliheen. Ash-hadu an la ilaha illallah, wa ash-hadu anna Muhammadan 'abduhu wa rasuluh",
    translation: 'All greetings, prayers and good things are due to Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings. Peace be upon us and upon the righteous servants of Allah. I bear witness that there is no god but Allah, and I bear witness that Muhammad is His servant and messenger.',
  },
  ibrahimiyya: {
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
    transliteration: "Allahumma salli 'ala Muhammadin wa 'ala aali Muhammad, kama sallayta 'ala Ibrahima wa 'ala aali Ibrahim, innaka Hamidun Majeed. Allahumma barik 'ala Muhammadin wa 'ala aali Muhammad, kama barakta 'ala Ibrahima wa 'ala aali Ibrahim, innaka Hamidun Majeed",
    translation: 'O Allah, send prayers upon Muhammad and upon the family of Muhammad, as You sent prayers upon Ibrahim and upon the family of Ibrahim. Indeed, You are Praiseworthy and Glorious. O Allah, bless Muhammad and the family of Muhammad, as You blessed Ibrahim and the family of Ibrahim. Indeed, You are Praiseworthy and Glorious.',
  },
  tasleem: {
    arabic: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ',
    transliteration: 'As-salamu alaykum wa rahmatullah',
    translation: 'Peace and mercy of Allah be upon you',
  },
};

// Sample short surahs for additional surah options
const SAMPLE_SURAHS = {
  ikhlas: {
    name: 'Surah Al-Ikhlas (Chapter 112)',
    arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
    transliteration: 'Qul huwa Allahu ahad. Allahus-samad. Lam yalid wa lam yulad. Wa lam yakun lahu kufuwan ahad',
    translation: 'Say: He is Allah, the One. Allah, the Eternal, Absolute. He begets not, nor was He begotten. And there is none comparable to Him.',
  },
};

const PROSTRATION_NOTE = 'This is the closest a servant can be to Allah. This is the perfect time to make dua (supplication) and ask Allah for literally anything - healing for yourself or others, guidance, knowledge, wealth, forgiveness, or anything your heart desires. Pour your heart out to Allah in this blessed position.';

const SUNNAH_SURAH_NOTE = 'This is Sunnah (recommended) and optional. You may recite only Al-Fatiha and your prayer is still valid. Reciting an additional Surah is highly rewarded but not obligatory.';

type PrayerType = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

interface PrayerConfig {
  rakaat: number;
  reciteAloudRakaat: number[]; // Which rakaat are recited aloud (1-indexed)
}

const PRAYER_CONFIGS: Record<PrayerType, PrayerConfig> = {
  fajr: { rakaat: 2, reciteAloudRakaat: [1, 2] },
  dhuhr: { rakaat: 4, reciteAloudRakaat: [] },
  asr: { rakaat: 4, reciteAloudRakaat: [] },
  maghrib: { rakaat: 3, reciteAloudRakaat: [1, 2] },
  isha: { rakaat: 4, reciteAloudRakaat: [1, 2] },
};

/**
 * Generates a complete, standalone step-by-step guide for any prayer
 */
export function generatePrayerSteps(prayerId: string): PrayerStep[] {
  const config = PRAYER_CONFIGS[prayerId as PrayerType];
  if (!config) {
    return [];
  }

  const steps: PrayerStep[] = [];
  let stepOrder = 1;

  const isAloudRakaat = (rakaatNum: number) => config.reciteAloudRakaat.includes(rakaatNum);
  const recitationMode = (rakaatNum: number) => isAloudRakaat(rakaatNum) ? 'aloud' : 'silently';

  // Step: Intention (Niyyah)
  steps.push({
    order: stepOrder++,
    name: 'Intention (Niyyah)',
    nameArabic: 'النية',
    position: 'standing',
    arabicText: '',
    transliteration: '',
    translation: '',
    instruction: `Make the intention in your heart to pray ${config.rakaat} rakaat of ${prayerId.charAt(0).toUpperCase() + prayerId.slice(1)} prayer. The intention does not need to be spoken out loud - it is in your heart. Face the Qiblah (direction of the Ka'bah in Makkah).`,
    note: 'The intention is made in the heart, not verbally. Simply have a clear intention of which prayer you are performing.',
  });

  // Step: Opening Takbir
  steps.push({
    order: stepOrder++,
    name: 'Opening Takbir (Takbiratul Ihram)',
    nameArabic: 'تكبيرة الإحرام',
    position: 'standing',
    arabicText: RECITATIONS.takbir.arabic,
    transliteration: RECITATIONS.takbir.transliteration,
    translation: RECITATIONS.takbir.translation,
    instruction: 'Raise both hands up to your ears (men) or shoulders (women) and say "Allahu Akbar". Then place your right hand over your left hand on your chest. This begins your prayer - from this point, focus only on your prayer.',
  });

  // Generate steps for each rakaat
  for (let rakaatNum = 1; rakaatNum <= config.rakaat; rakaatNum++) {
    const isFirstRakaat = rakaatNum === 1;
    const isLastRakaat = rakaatNum === config.rakaat;
    const isMiddleTashahhud = (config.rakaat === 4 && rakaatNum === 2) || (config.rakaat === 3 && rakaatNum === 2);
    const mode = recitationMode(rakaatNum);
    const modeText = mode === 'aloud' ? 'aloud' : 'silently (in your heart)';

    // Surah Al-Fatiha
    if (rakaatNum === 1) {
      steps.push({
        order: stepOrder++,
        name: `Rakaat ${rakaatNum}: Recite Al-Fatiha`,
        nameArabic: 'سورة الفاتحة',
        position: 'standing',
        arabicText: RECITATIONS.fatiha.arabic,
        transliteration: RECITATIONS.fatiha.transliteration,
        translation: RECITATIONS.fatiha.translation,
        instruction: `While standing, recite Surah Al-Fatiha ${modeText}. This is the opening chapter of the Quran and must be recited in every rakaat. Say "Ameen" at the end.`,
      });
    } else {
      // For subsequent rakaat, need to stand up first (if not first)
      if (!isFirstRakaat) {
        steps.push({
          order: stepOrder++,
          name: `Rakaat ${rakaatNum}: Stand for Next Unit`,
          nameArabic: 'القيام',
          position: 'standing',
          arabicText: RECITATIONS.takbir.arabic,
          transliteration: RECITATIONS.takbir.transliteration,
          translation: RECITATIONS.takbir.translation,
          instruction: `Say "Allahu Akbar" and stand up straight for Rakaat ${rakaatNum}. Place your right hand over your left hand on your chest.`,
        });
      }

      steps.push({
        order: stepOrder++,
        name: `Rakaat ${rakaatNum}: Recite Al-Fatiha`,
        nameArabic: 'سورة الفاتحة',
        position: 'standing',
        arabicText: RECITATIONS.fatiha.arabic,
        transliteration: RECITATIONS.fatiha.transliteration,
        translation: RECITATIONS.fatiha.translation,
        instruction: `Recite Surah Al-Fatiha ${modeText}. This must be recited in every rakaat of the prayer.`,
      });
    }

    // Additional Surah (only in first two rakaat)
    if (rakaatNum <= 2) {
      steps.push({
        order: stepOrder++,
        name: `Rakaat ${rakaatNum}: Additional Surah`,
        nameArabic: 'سورة إضافية',
        position: 'standing',
        arabicText: SAMPLE_SURAHS.ikhlas.arabic,
        transliteration: SAMPLE_SURAHS.ikhlas.transliteration,
        translation: SAMPLE_SURAHS.ikhlas.translation,
        instruction: `After Al-Fatiha, recite another Surah or some verses from the Quran ${modeText}. ${SAMPLE_SURAHS.ikhlas.name} is shown as an example, but you may recite any Surah you have memorized.`,
        note: SUNNAH_SURAH_NOTE,
      });
    }

    // Ruku (Bowing)
    steps.push({
      order: stepOrder++,
      name: `Rakaat ${rakaatNum}: Bow (Ruku)`,
      nameArabic: 'الركوع',
      position: 'bowing',
      arabicText: RECITATIONS.ruku.arabic,
      transliteration: RECITATIONS.ruku.transliteration,
      translation: RECITATIONS.ruku.translation,
      instruction: 'Say "Allahu Akbar" and bow down with your back straight and parallel to the ground. Place your hands on your knees with fingers spread. In this position, say "Subhana Rabbiyal Adheem" (Glory be to my Lord, the Magnificent).',
      repetitions: 3,
    });

    // Rising from Ruku
    steps.push({
      order: stepOrder++,
      name: `Rakaat ${rakaatNum}: Rise from Bowing`,
      nameArabic: 'الاعتدال',
      position: 'standing',
      arabicText: `${RECITATIONS.risingFromRuku.arabic}\n${RECITATIONS.standingAfterRuku.arabic}`,
      transliteration: `${RECITATIONS.risingFromRuku.transliteration}\n${RECITATIONS.standingAfterRuku.transliteration}`,
      translation: `${RECITATIONS.risingFromRuku.translation}\n${RECITATIONS.standingAfterRuku.translation}`,
      instruction: 'Rise from bowing while saying "Sami\' Allahu liman hamidah" (Allah hears those who praise Him). When standing straight, say "Rabbana wa lakal hamd" (Our Lord, to You belongs all praise).',
    });

    // First Prostration
    steps.push({
      order: stepOrder++,
      name: `Rakaat ${rakaatNum}: First Prostration (Sujud)`,
      nameArabic: 'السجود الأول',
      position: 'prostrating',
      arabicText: RECITATIONS.sujud.arabic,
      transliteration: RECITATIONS.sujud.transliteration,
      translation: RECITATIONS.sujud.translation,
      instruction: 'Say "Allahu Akbar" and go down into prostration. Place your forehead, nose, both palms, both knees, and toes on the ground. In this position, say "Subhana Rabbiyal A\'la" (Glory be to my Lord, the Most High).',
      repetitions: 3,
      note: PROSTRATION_NOTE,
    });

    // Sitting between prostrations
    steps.push({
      order: stepOrder++,
      name: `Rakaat ${rakaatNum}: Sit Between Prostrations`,
      nameArabic: 'الجلوس بين السجدتين',
      position: 'sitting',
      arabicText: RECITATIONS.sittingBetweenSujud.arabic,
      transliteration: RECITATIONS.sittingBetweenSujud.transliteration,
      translation: RECITATIONS.sittingBetweenSujud.translation,
      instruction: 'Say "Allahu Akbar" and sit up straight with your left foot under you and right foot upright. Say "Rabbighfir li" (My Lord, forgive me) while sitting.',
      repetitions: 2,
    });

    // Second Prostration
    steps.push({
      order: stepOrder++,
      name: `Rakaat ${rakaatNum}: Second Prostration (Sujud)`,
      nameArabic: 'السجود الثاني',
      position: 'prostrating',
      arabicText: RECITATIONS.sujud.arabic,
      transliteration: RECITATIONS.sujud.transliteration,
      translation: RECITATIONS.sujud.translation,
      instruction: 'Say "Allahu Akbar" and go into prostration again. Say "Subhana Rabbiyal A\'la" (Glory be to my Lord, the Most High).',
      repetitions: 3,
      note: PROSTRATION_NOTE,
    });

    // Tashahhud (Middle or Final)
    if (isMiddleTashahhud || isLastRakaat) {
      const isMiddle = isMiddleTashahhud && !isLastRakaat;

      steps.push({
        order: stepOrder++,
        name: isMiddle ? `Rakaat ${rakaatNum}: Middle Tashahhud` : 'Final Tashahhud (At-Tahiyyat)',
        nameArabic: isMiddle ? 'التشهد الأوسط' : 'التشهد الأخير',
        position: 'sitting',
        arabicText: RECITATIONS.tashahhud.arabic,
        transliteration: RECITATIONS.tashahhud.transliteration,
        translation: RECITATIONS.tashahhud.translation,
        instruction: `Say "Allahu Akbar" and sit. Recite the Tashahhud (At-Tahiyyat). Point your right index finger during the testimony of faith (when saying "Ash-hadu an la ilaha illallah").`,
        note: isMiddle ? 'After the middle Tashahhud, you will stand up for the next rakaat.' : undefined,
      });

      // Add Salawat on the Prophet (only in final Tashahhud)
      if (isLastRakaat) {
        steps.push({
          order: stepOrder++,
          name: 'Salawat upon the Prophet (Durood Ibrahim)',
          nameArabic: 'الصلاة الإبراهيمية',
          position: 'sitting',
          arabicText: RECITATIONS.ibrahimiyya.arabic,
          transliteration: RECITATIONS.ibrahimiyya.transliteration,
          translation: RECITATIONS.ibrahimiyya.translation,
          instruction: 'After the Tashahhud, recite the Durood Ibrahim (prayers upon Prophet Ibrahim and Prophet Muhammad, peace be upon them).',
        });
      }
    }
  }

  // Tasleem (Ending the prayer)
  steps.push({
    order: stepOrder++,
    name: 'Tasleem (Ending the Prayer)',
    nameArabic: 'التسليم',
    position: 'sitting',
    arabicText: RECITATIONS.tasleem.arabic,
    transliteration: RECITATIONS.tasleem.transliteration,
    translation: RECITATIONS.tasleem.translation,
    instruction: 'Turn your head to the right and say "As-salamu alaykum wa rahmatullah" (Peace and mercy of Allah be upon you). Then turn your head to the left and repeat the same. This completes your prayer.',
    note: 'After completing the prayer, it is Sunnah to make dhikr (remembrance of Allah) such as saying SubhanAllah, Alhamdulillah, and Allahu Akbar 33 times each.',
  });

  return steps;
}

/**
 * Gets complete prayer steps for a prayer by ID
 * Can be used to override or supplement Firestore data
 */
export function getCompletePrayerSteps(prayerId: string): PrayerStep[] {
  return generatePrayerSteps(prayerId);
}
