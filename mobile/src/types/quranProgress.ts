export type ChapterProgress = {
  chapterId: number;
  listenProgress: number; // 0-100 percentage
  readProgress: number; // 0-100 percentage
  lastListenPosition: number; // ms position in audio
  lastReadVerse: number; // verse number (1-indexed)
  lastUpdated: string; // ISO date
};

export type QuranProgressData = {
  chapters: Record<number, ChapterProgress>;
  updatedAt: string;
};

export interface QuranProgressContextType {
  progress: QuranProgressData;
  loading: boolean;
  updateListenProgress: (
    chapterId: number,
    position: number,
    duration: number
  ) => void;
  updateReadProgress: (
    chapterId: number,
    currentVerse: number,
    totalVerses: number
  ) => void;
  getChapterProgress: (chapterId: number) => {
    progress: number;
    lastReadVerse: number;
    lastListenPosition: number;
  };
  getOverallProgress: (
    chapters: Array<{ id: number; verses_count: number }>
  ) => number;
}
