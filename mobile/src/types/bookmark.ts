export interface VerseBookmark {
  type: 'verse';
  verseKey: string;
  chapterId: number;
  chapterName: string;
  chapterArabicName: string;
  verseNumber: number;
  arabicText: string;
  translationPreview: string;
  bookmarkedAt: string;
}

export interface ChapterBookmark {
  type: 'chapter';
  chapterId: number;
  chapterName: string;
  chapterArabicName: string;
  versesCount: number;
  bookmarkedAt: string;
}

export type Bookmark = VerseBookmark | ChapterBookmark;

export interface BookmarkContextType {
  bookmarks: Bookmark[];
  loading: boolean;
  isVerseBookmarked: (verseKey: string) => boolean;
  isChapterBookmarked: (chapterId: number) => boolean;
  toggleVerseBookmark: (bookmark: Omit<VerseBookmark, 'type' | 'bookmarkedAt'>) => void;
  toggleChapterBookmark: (bookmark: Omit<ChapterBookmark, 'type' | 'bookmarkedAt'>) => void;
}
