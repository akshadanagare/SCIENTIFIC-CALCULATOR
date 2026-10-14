import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

const PAGE_SIZE = 30;

// Keeps the history list in sync with the server.
// If the server is not reachable, new calculations are still shown for this session (marked "not saved").
export function useHistory() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0); // number of items on the server for the current search
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const requestId = useRef(0);
  const queryRef = useRef('');
  queryRef.current = query;

  const load = useCallback(async (q, offset = 0) => {
    const id = ++requestId.current; // an older, slower answer must not overwrite a newer one
    setLoading(true);
    try {
      const data = await api.listHistory({ q, offset, limit: PAGE_SIZE });
      if (id !== requestId.current) return;
      setItems((prev) => {
        const unsaved = prev.filter((i) => i.local && !q);
        return offset === 0 ? [...unsaved, ...data.items] : [...prev, ...data.items];
      });
      setTotal(data.total);
      setOffline(false);
    } catch {
      if (id === requestId.current) setOffline(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // first load, and a new search (after a short pause while typing)
  useEffect(() => {
    const timer = setTimeout(() => load(query, 0), query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [query, load]);

  const add = useCallback(async (entry) => {
    try {
      const saved = await api.addHistory(entry);
      setOffline(false);
      if (queryRef.current.trim()) {
        load(queryRef.current, 0); // a search is active: reload so the list stays correct
      } else {
        setItems((prev) => [saved, ...prev]);
        setTotal((t) => t + 1);
      }
    } catch {
      setOffline(true);
      const local = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        ...entry,
        createdAt: new Date().toISOString(),
        local: true,
      };
      setItems((prev) => [local, ...prev]);
    }
  }, [load]);

  const remove = useCallback(async (id) => {
    if (!id.startsWith('local-')) {
      try {
        await api.deleteHistory(id);
        setTotal((t) => Math.max(0, t - 1));
      } catch (err) {
        if (err.status !== 404) { setOffline(Boolean(err.offline)); return; } // keep the item if it was not deleted
        setTotal((t) => Math.max(0, t - 1));
      }
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(async () => {
    try {
      await api.clearHistory();
      setItems([]);
      setTotal(0);
      setOffline(false);
    } catch (err) {
      setOffline(Boolean(err.offline));
    }
  }, []);

  const savedCount = items.filter((i) => !i.local).length;
  const loadMore = useCallback(() => load(queryRef.current, savedCount), [load, savedCount]);
  const retry = useCallback(() => load(queryRef.current, 0), [load]);

  return {
    items, total, query, setQuery, loading, offline,
    hasMore: savedCount < total,
    remaining: Math.max(0, total - savedCount),
    add, remove, clear, loadMore, retry,
  };
}
