type ViewMode = 'all' | 'arabic' | 'english';
type Surface = 'mobile' | 'web';

export type QuranReadPage = {
  pageKey: string;
  verseKey: string;
  verseNumber: number;
  continuationIndex: number;
  continuationCount: number;
  badgeLabel: string;
  subtitleLabel: string;
  arabicText: string;
  translationText: string;
};

const normalizeText = (text: string): string => text.replace(/\s+/g, ' ').trim();

const getMaxChars = (viewMode: ViewMode, surface: Surface) => {
  if (surface === 'web') {
    if (viewMode === 'arabic') {
      return { arabic: 300, translation: 0 };
    }
    if (viewMode === 'english') {
      return { arabic: 0, translation: 900 };
    }
    return { arabic: 240, translation: 560 };
  }

  if (viewMode === 'arabic') {
    return { arabic: 220, translation: 0 };
  }
  if (viewMode === 'english') {
    return { arabic: 0, translation: 680 };
  }
  return { arabic: 180, translation: 440 };
};

const splitByMaxChars = (text: string, maxChars: number): string[] => {
  const normalized = normalizeText(text);
  if (!normalized) return [''];
  if (maxChars <= 0 || normalized.length <= maxChars) return [normalized];

  const words = normalized.split(' ');
  const segments: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && next.length > maxChars) {
      segments.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    segments.push(current);
  }

  return segments.length > 0 ? segments : [normalized];
};

const rebalanceSegments = (
  text: string,
  maxChars: number,
  targetSegments: number
): string[] => {
  const normalized = normalizeText(text);
  if (targetSegments <= 1) {
    return [normalized];
  }
  if (!normalized) {
    return Array.from({ length: targetSegments }, () => '');
  }

  const words = normalized.split(' ');
  const totalChars = normalized.length;
  const segments: string[] = [];
  let wordIndex = 0;
  let charsUsed = 0;

  for (let segmentIndex = 0; segmentIndex < targetSegments; segmentIndex += 1) {
    const remainingSegments = targetSegments - segmentIndex;
    const remainingWords = words.length - wordIndex;

    if (remainingWords <= 0) {
      segments.push('');
      continue;
    }

    const remainingChars = totalChars - charsUsed;
    const targetChars = Math.min(
      maxChars,
      Math.max(1, Math.ceil(remainingChars / remainingSegments))
    );

    let current = '';
    let segmentChars = 0;

    while (wordIndex < words.length) {
      const nextWord = words[wordIndex];
      const next = current ? `${current} ${nextWord}` : nextWord;
      const wordsLeftAfterThis = words.length - (wordIndex + 1);

      if (
        current &&
        next.length > targetChars &&
        wordsLeftAfterThis >= remainingSegments - 1
      ) {
        break;
      }

      current = next;
      segmentChars = current.length;
      wordIndex += 1;

      if (
        segmentChars >= targetChars &&
        words.length - wordIndex >= remainingSegments - 1
      ) {
        break;
      }
    }

    charsUsed += current.length;
    segments.push(current);
  }

  return segments;
};

export const buildQuranReadPages = ({
  verseKey,
  verseNumber,
  arabicText,
  translationText,
  viewMode,
  surface,
}: {
  verseKey: string;
  verseNumber: number;
  arabicText: string;
  translationText: string;
  viewMode: ViewMode;
  surface: Surface;
}): QuranReadPage[] => {
  const limits = getMaxChars(viewMode, surface);
  const arabicSource = viewMode === 'english' ? '' : arabicText;
  const translationSource = viewMode === 'arabic' ? '' : translationText;

  const initialArabicSegments = splitByMaxChars(arabicSource, limits.arabic);
  const initialTranslationSegments = splitByMaxChars(translationSource, limits.translation);
  const segmentCount = Math.max(
    initialArabicSegments.length,
    initialTranslationSegments.length,
    1
  );

  const arabicSegments = rebalanceSegments(arabicSource, limits.arabic, segmentCount);
  const translationSegments = rebalanceSegments(
    translationSource,
    limits.translation,
    segmentCount
  );

  return Array.from({ length: segmentCount }, (_, index) => {
    const continuationIndex = index;
    const isContinuation = continuationIndex > 0;
    const badgeLabel = isContinuation ? `${verseNumber} cont.` : `${verseNumber}`;
    const subtitleLabel =
      segmentCount > 1
        ? `Verse ${verseNumber} ${isContinuation ? 'cont.' : ''} ${continuationIndex + 1}/${segmentCount}`.replace(
            /\s+/g,
            ' '
          ).trim()
        : `Verse ${verseNumber}`;

    return {
      pageKey: `${verseKey}::${index}`,
      verseKey,
      verseNumber,
      continuationIndex,
      continuationCount: segmentCount,
      badgeLabel,
      subtitleLabel,
      arabicText: arabicSegments[index] || '',
      translationText: translationSegments[index] || '',
    };
  });
};
