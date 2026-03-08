import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { Bookmark, VerseBookmark, ChapterBookmark, BookmarkContextType } from '@/types/bookmark';
import { useToast } from '@/components/common/Toast';

const LEGACY_STORAGE_KEY = '@arkan_bookmarks';
const USER_STORAGE_KEY_PREFIX = '@arkan_bookmarks:';

const BookmarkContext = createContext<BookmarkContextType>({
  bookmarks: [],
  loading: true,
  isVerseBookmarked: () => false,
  isChapterBookmarked: () => false,
  toggleVerseBookmark: () => {},
  toggleChapterBookmark: () => {},
});

export const useBookmarks = () => useContext(BookmarkContext);

const getUserStorageKey = (uid: string) => `${USER_STORAGE_KEY_PREFIX}${uid}`;

const getBookmarkId = (bookmark: Bookmark) =>
  bookmark.type === 'verse' ? `verse:${bookmark.verseKey}` : `chapter:${bookmark.chapterId}`;

const sortBookmarks = (bookmarks: Bookmark[]) =>
  [...bookmarks].sort(
    (a, b) => new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime()
  );

const normalizeBookmarks = (value: unknown): Bookmark[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const deduped = new Map<string, Bookmark>();

  value.forEach((bookmark) => {
    if (!bookmark || typeof bookmark !== 'object' || !('type' in bookmark) || !('bookmarkedAt' in bookmark)) {
      return;
    }

    const candidate = bookmark as Bookmark;
    const key = getBookmarkId(candidate);
    const existing = deduped.get(key);

    if (!existing) {
      deduped.set(key, candidate);
      return;
    }

    const existingTime = new Date(existing.bookmarkedAt).getTime();
    const candidateTime = new Date(candidate.bookmarkedAt).getTime();
    deduped.set(key, candidateTime >= existingTime ? candidate : existing);
  });

  return sortBookmarks(Array.from(deduped.values()));
};

const mergeBookmarks = (...groups: Bookmark[][]) => normalizeBookmarks(groups.flat());

const readLocalBookmarks = async (key: string) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? normalizeBookmarks(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
};

const persistLocalBookmarks = async (key: string, bookmarks: Bookmark[]) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(bookmarks));
  } catch {}
};

export const BookmarkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { user } = useAuth();
  const bookmarksRef = useRef<Bookmark[]>([]);

  useEffect(() => {
    bookmarksRef.current = bookmarks;
  }, [bookmarks]);

  useEffect(() => {
    let isActive = true;

    if (!user?.uid) {
      setLoading(true);
      (async () => {
        const localBookmarks = await readLocalBookmarks(LEGACY_STORAGE_KEY);
        if (!isActive) return;
        setBookmarks(localBookmarks);
        setLoading(false);
      })();
      return () => {
        isActive = false;
      };
    }

    setLoading(true);
    const userRef = doc(db, 'users', user.uid);
    const userStorageKey = getUserStorageKey(user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      async (snapshot) => {
        const remoteBookmarks = normalizeBookmarks(snapshot.data()?.bookmarks);
        const userCachedBookmarks = await readLocalBookmarks(userStorageKey);
        const legacyBookmarks = userCachedBookmarks.length === 0 && remoteBookmarks.length === 0
          ? await readLocalBookmarks(LEGACY_STORAGE_KEY)
          : [];

        if (!isActive) return;

        const mergedBookmarks = mergeBookmarks(remoteBookmarks, userCachedBookmarks, legacyBookmarks);
        const remoteChanged = JSON.stringify(mergedBookmarks) !== JSON.stringify(remoteBookmarks);

        setBookmarks(mergedBookmarks);
        await persistLocalBookmarks(userStorageKey, mergedBookmarks);

        if (legacyBookmarks.length > 0) {
          try {
            await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
          } catch {}
        }

        if (remoteChanged) {
          try {
            await setDoc(userRef, { bookmarks: mergedBookmarks }, { merge: true });
          } catch (error) {
            console.error('Failed to sync bookmarks to Firestore:', error);
          }
        }

        if (isActive) {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Failed to subscribe to bookmarks:', error);
        if (isActive) {
          setLoading(false);
        }
      }
    );

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [user?.uid]);

  const persistBookmarks = useCallback(
    async (nextBookmarks: Bookmark[]) => {
      if (user?.uid) {
        const userRef = doc(db, 'users', user.uid);
        const userStorageKey = getUserStorageKey(user.uid);
        await persistLocalBookmarks(userStorageKey, nextBookmarks);
        try {
          await setDoc(userRef, { bookmarks: nextBookmarks }, { merge: true });
        } catch (error) {
          console.error('Failed to persist bookmarks:', error);
        }
        return;
      }

      await persistLocalBookmarks(LEGACY_STORAGE_KEY, nextBookmarks);
    },
    [user?.uid]
  );

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
      const current = bookmarksRef.current;
      const exists = current.some((b) => b.type === 'verse' && b.verseKey === data.verseKey);
      let next: Bookmark[];
      if (exists) {
        next = current.filter((b) => !(b.type === 'verse' && (b as VerseBookmark).verseKey === data.verseKey));
        showToast({ message: 'Bookmark removed', icon: 'bookmark-outline' });
      } else {
        const newBookmark: VerseBookmark = { ...data, type: 'verse', bookmarkedAt: new Date().toISOString() };
        next = mergeBookmarks([newBookmark], current);
        showToast({ message: 'Verse bookmarked!', icon: 'bookmark' });
      }
      setBookmarks(next);
      void persistBookmarks(next);
    },
    [persistBookmarks, showToast],
  );

  const toggleChapterBookmark = useCallback(
    (data: Omit<ChapterBookmark, 'type' | 'bookmarkedAt'>) => {
      const current = bookmarksRef.current;
      const exists = current.some((b) => b.type === 'chapter' && b.chapterId === data.chapterId);
      let next: Bookmark[];
      if (exists) {
        next = current.filter((b) => !(b.type === 'chapter' && (b as ChapterBookmark).chapterId === data.chapterId));
        showToast({ message: 'Bookmark removed', icon: 'bookmark-outline' });
      } else {
        const newBookmark: ChapterBookmark = { ...data, type: 'chapter', bookmarkedAt: new Date().toISOString() };
        next = mergeBookmarks([newBookmark], current);
        showToast({ message: 'Chapter bookmarked!', icon: 'bookmark' });
      }
      setBookmarks(next);
      void persistBookmarks(next);
    },
    [persistBookmarks, showToast],
  );

  return (
    <BookmarkContext.Provider
      value={{ bookmarks, loading, isVerseBookmarked, isChapterBookmarked, toggleVerseBookmark, toggleChapterBookmark }}
    >
      {children}
    </BookmarkContext.Provider>
  );
};
