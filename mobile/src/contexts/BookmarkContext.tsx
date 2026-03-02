import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Bookmark, VerseBookmark, ChapterBookmark, BookmarkContextType } from '@/types/bookmark';
import { useToast } from '@/components/common/Toast';

const STORAGE_KEY = '@arkan_bookmarks';

const BookmarkContext = createContext<BookmarkContextType>({
  bookmarks: [],
  loading: true,
  isVerseBookmarked: () => false,
  isChapterBookmarked: () => false,
  toggleVerseBookmark: () => {},
  toggleChapterBookmark: () => {},
});

export const useBookmarks = () => useContext(BookmarkContext);

const persist = async (bookmarks: Bookmark[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  } catch {}
};

export const BookmarkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setBookmarks(JSON.parse(raw));
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  const isVerseBookmarked = useCallback(
    (verseKey: string) => bookmarks.some((b) => b.type === 'verse' && b.verseKey === verseKey),
    [bookmarks],
  );

  const isChapterBookmarked = useCallback(
    (chapterId: number) => bookmarks.some((b) => b.type === 'chapter' && b.chapterId === chapterId),
    [bookmarks],
  );

  const toggleVerseBookmark = useCallback(
    (data: Omit<VerseBookmark, 'type' | 'bookmarkedAt'>) => {
      setBookmarks((prev) => {
        const exists = prev.some((b) => b.type === 'verse' && b.verseKey === data.verseKey);
        let next: Bookmark[];
        if (exists) {
          next = prev.filter((b) => !(b.type === 'verse' && (b as VerseBookmark).verseKey === data.verseKey));
          showToast({ message: 'Bookmark removed', icon: 'bookmark-outline' });
        } else {
          const newBookmark: VerseBookmark = { ...data, type: 'verse', bookmarkedAt: new Date().toISOString() };
          next = [newBookmark, ...prev];
          showToast({ message: 'Verse bookmarked!', icon: 'bookmark' });
        }
        persist(next);
        return next;
      });
    },
    [showToast],
  );

  const toggleChapterBookmark = useCallback(
    (data: Omit<ChapterBookmark, 'type' | 'bookmarkedAt'>) => {
      setBookmarks((prev) => {
        const exists = prev.some((b) => b.type === 'chapter' && b.chapterId === data.chapterId);
        let next: Bookmark[];
        if (exists) {
          next = prev.filter((b) => !(b.type === 'chapter' && (b as ChapterBookmark).chapterId === data.chapterId));
          showToast({ message: 'Bookmark removed', icon: 'bookmark-outline' });
        } else {
          const newBookmark: ChapterBookmark = { ...data, type: 'chapter', bookmarkedAt: new Date().toISOString() };
          next = [newBookmark, ...prev];
          showToast({ message: 'Chapter bookmarked!', icon: 'bookmark' });
        }
        persist(next);
        return next;
      });
    },
    [showToast],
  );

  return (
    <BookmarkContext.Provider
      value={{ bookmarks, loading, isVerseBookmarked, isChapterBookmarked, toggleVerseBookmark, toggleChapterBookmark }}
    >
      {children}
    </BookmarkContext.Provider>
  );
};
