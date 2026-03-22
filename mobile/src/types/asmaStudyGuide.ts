export type StudyGuideOutcome = 'correct' | 'wrong';

export type AsmaStudyGuideStat = {
  nameNumber: number;
  wrongCount: number;
  correctCount: number;
  lastSeenAt: string;
  lastOutcome: StudyGuideOutcome;
};

export type AsmaStudyGuideState = {
  strugglingNameNumbers: number[];
  statsByName: Record<string, AsmaStudyGuideStat>;
  totalAttempts: number;
  lastUpdatedAt: string | null;
};

export type AsmaStudyGuideContextType = {
  studyGuide: AsmaStudyGuideState;
  loading: boolean;
  hasGameHistory: boolean;
  recordCorrect: (nameNumbers: number | number[]) => void;
  recordIncorrect: (nameNumbers: number | number[]) => void;
};
