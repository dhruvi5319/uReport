import { useState, useEffect, useCallback } from 'react';
import { bookmarksApi, Bookmark } from '@/api/bookmarks';

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    bookmarksApi.list()
      .then(setBookmarks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const deleteBookmark = useCallback(async (id: number) => {
    await bookmarksApi.delete(id);
    setBookmarks(prev => prev.filter(b => b.id !== id));
  }, []);

  return { bookmarks, loading, refresh, deleteBookmark };
};
