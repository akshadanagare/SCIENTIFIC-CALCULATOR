/**
 * Client-Side Database: IndexedDB (`calculation`)
 * Provides persistent database storage for calculations and preferences
 * when deployed without a live backend connection.
 */

const DB_NAME = 'calculation';
const DB_VERSION = 1;
const STORE_CALCULATION = 'calculation';
const STORE_PREFS = 'preferences';

function getDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_CALCULATION)) {
        const store = db.createObjectStore(STORE_CALCULATION, { keyPath: 'id' });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_PREFS)) {
        db.createObjectStore(STORE_PREFS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function dbAddCalculation(entry) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CALCULATION, 'readwrite');
    const store = tx.objectStore(STORE_CALCULATION);
    const now = new Date().toISOString();
    const item = {
      id: entry.id || (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `calc-${Date.now()}`),
      expression: entry.expression,
      tokens: entry.tokens || [],
      result: entry.result,
      mode: entry.mode || 'standard',
      angle: entry.angle || 'deg',
      created_at: entry.created_at || entry.createdAt || now,
      updated_at: entry.updated_at || entry.updatedAt || now,
      createdAt: entry.createdAt || entry.created_at || now,
      updatedAt: entry.updatedAt || entry.updated_at || now,
    };
    const req = store.put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

export async function dbListCalculations({ limit = 30, offset = 0, q = '' } = {}) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CALCULATION, 'readonly');
    const store = tx.objectStore(STORE_CALCULATION);
    const req = store.getAll();

    req.onsuccess = () => {
      let items = (req.result || []).map((i) => ({
        ...i,
        createdAt: i.createdAt || i.created_at,
        updatedAt: i.updatedAt || i.updated_at,
      }));
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (q && q.trim()) {
        const needle = q.trim().toLowerCase();
        items = items.filter(
          (i) => i.expression?.toLowerCase().includes(needle) || i.result?.toLowerCase().includes(needle)
        );
      }

      const total = items.length;
      const paged = items.slice(offset, offset + limit);
      resolve({ items: paged, total, limit, offset });
    };

    req.onerror = () => reject(req.error);
  });
}

export async function dbUpdateCalculation(id, entry) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CALCULATION, 'readwrite');
    const store = tx.objectStore(STORE_CALCULATION);
    const req = store.get(id);

    req.onsuccess = () => {
      const existing = req.result || { id };
      const now = new Date().toISOString();
      const updated = {
        ...existing,
        ...entry,
        id,
        updated_at: now,
        updatedAt: now,
        createdAt: existing.createdAt || existing.created_at || now,
        created_at: existing.created_at || existing.createdAt || now,
      };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve(updated);
      putReq.onerror = () => reject(putReq.error);
    };

    req.onerror = () => reject(req.error);
  });
}

export async function dbDeleteCalculation(id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CALCULATION, 'readwrite');
    const store = tx.objectStore(STORE_CALCULATION);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function dbClearCalculations() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CALCULATION, 'readwrite');
    const store = tx.objectStore(STORE_CALCULATION);
    const req = store.clear();
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function dbGetPreferences() {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_PREFS, 'readonly');
    const store = tx.objectStore(STORE_PREFS);
    const req = store.get('client_prefs');
    req.onsuccess = () => {
      const data = req.result;
      resolve(
        data || {
          theme: null,
          mode: 'standard',
          angle: 'deg',
          memory: null,
        }
      );
    };
    req.onerror = () =>
      resolve({
        theme: null,
        mode: 'standard',
        angle: 'deg',
        memory: null,
      });
  });
}

export async function dbSavePreferences(patch) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PREFS, 'readwrite');
    const store = tx.objectStore(STORE_PREFS);
    const getReq = store.get('client_prefs');

    getReq.onsuccess = () => {
      const existing = getReq.result || { id: 'client_prefs' };
      const updated = { ...existing, ...patch, id: 'client_prefs' };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve(updated);
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}
