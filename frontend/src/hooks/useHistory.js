import { useCallback, useEffect, useRef, useState } from 'react';
import { historyService } from '../services/historyService.js';

export const PAGE_SIZE = 5;

// Keeps the history list in sync with the database (through the API).
// The list loads PAGE_SIZE records at a time; loadMore() adds the next page when the user scrolls down.
export function useHistory({ onError } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false); // the list could not be loaded
  const requestId = useRef(0);
  const queryRef = useRef('');
  const itemsRef = useRef([]);
  const loadingRef = useRef(false);
  queryRef.current = query;
  itemsRef.current = items;
  const errorRef = useRef(onError);
  errorRef.current = onError;
  const fail = (message) => errorRef.current?.(message);

  const load = useCallback(async (q, offset = 0) => {
    const id = ++requestId.current; // an older, slower answer must not overwrite a newer one
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await historyService.listHistory({ q, offset, limit: PAGE_SIZE });
      if (id !== requestId.current) return;
      setItems((prev) => (offset === 0 ? data.items : [...prev, ...data.items]));
      setTotal(data.total);
      setFailed(false);
    } catch {
      if (id === requestId.current) setFailed(true);
    } finally {
      if (id === requestId.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, []);

  // first load, and a new search (after a short pause while typing)
  useEffect(() => {
    const timer = setTimeout(() => load(query, 0), query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [query, load]);

  const refresh = useCallback(() => load(queryRef.current, 0), [load]);

  const loadMore = useCallback(() => {
    if (loadingRef.current || itemsRef.current.length >= total) return;
    load(queryRef.current, itemsRef.current.length);
  }, [load, total]);

  // a finished calculation -> new record
  const add = useCallback(async (entry) => {
    try {
      const saved = await historyService.addHistory(entry);
      if (queryRef.current.trim()) load(queryRef.current, 0);
      else {
        setItems((prev) => [saved, ...prev]);
        setTotal((t) => t + 1);
      }
    } catch {
      fail('Could not save this calculation. Check your connection.');
    }
  }, [load]);

  // an edited calculation -> the SAME record is changed (no new record)
  const update = useCallback(async (id, entry) => {
    try {
      const saved = await historyService.updateHistory(id, entry);
      setItems((prev) => prev.map((i) => (i.id === id ? saved : i)));
    } catch (err) {
      if (err.status === 404) { await add(entry); return; } // deleted meanwhile: keep it as a new record
      fail('Could not update this calculation. Check your connection.');
    }
  }, [add]);

  const remove = useCallback(async (id) => {
    try {
      await historyService.deleteHistory(id);
    } catch (err) {
      if (err.status !== 404) { fail('Could not delete. Check your connection.'); return; }
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }, []);

  const clear = useCallback(async () => {
    try {
      await historyService.clearHistory();
      setItems([]);
      setTotal(0);
    } catch {
      fail('Could not clear the history. Check your connection.');
    }
  }, []);

  return {
    items, total, query, setQuery, loading, failed,
    hasMore: items.length < total,
    add, update, remove, clear, loadMore, refresh,
  };
}
