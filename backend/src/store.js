// A tiny file-based database (no native packages needed, works on every OS).
// Everything is kept in memory and written to one JSON file after each change.
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

export const MAX_HISTORY_PER_CLIENT = 1000;

export const DEFAULT_PREFS = Object.freeze({
  theme: null, // null = follow the device setting
  mode: 'standard',
  angle: 'deg',
  memory: null,
});

export class JsonStore {
  constructor(file) {
    this.file = file;
    this.data = { history: [], prefs: {} };
    this.queue = Promise.resolve(); // makes sure writes happen one after another
  }

  async init() {
    await mkdir(path.dirname(this.file), { recursive: true });
    try {
      const parsed = JSON.parse(await readFile(this.file, 'utf8'));
      this.data = {
        history: Array.isArray(parsed.history) ? parsed.history : [],
        prefs: parsed.prefs && typeof parsed.prefs === 'object' ? parsed.prefs : {},
      };
    } catch (err) {
      if (err.code !== 'ENOENT') {
        // A broken file must never crash the server: start fresh but keep a copy of the bad file.
        try { await rename(this.file, `${this.file}.broken-${Date.now()}`); } catch { /* ignore */ }
      }
      await this.save();
    }
    return this;
  }

  // Save to a temporary file first, then replace the real file (safe against power cuts).
  save() {
    this.queue = this.queue
      .catch(() => {})
      .then(async () => {
        const tmp = `${this.file}.tmp`;
        await writeFile(tmp, JSON.stringify(this.data, null, 2), 'utf8');
        await rename(tmp, this.file);
      });
    return this.queue;
  }

  // ---------- history ----------
  listHistory(clientId, { limit = 30, offset = 0, q = '' } = {}) {
    const needle = q.trim().toLowerCase();
    // The array is in the order things were added, so reversing it gives newest first.
    const mine = [...this.data.history]
      .reverse()
      .filter((h) => h.clientId === clientId)
      .filter((h) => !needle || h.expression.toLowerCase().includes(needle) || h.result.toLowerCase().includes(needle));
    return {
      items: mine.slice(offset, offset + limit).map(({ clientId: _c, ...item }) => item),
      total: mine.length,
    };
  }

  async addHistory(clientId, entry) {
    const item = {
      id: randomUUID(),
      clientId,
      expression: entry.expression,
      tokens: entry.tokens,
      result: entry.result,
      mode: entry.mode ?? 'standard',
      angle: entry.angle ?? 'deg',
      createdAt: new Date().toISOString(),
    };
    this.data.history.push(item);

    // keep only the newest MAX_HISTORY_PER_CLIENT items of this client
    const mine = this.data.history.filter((h) => h.clientId === clientId);
    if (mine.length > MAX_HISTORY_PER_CLIENT) {
      const drop = new Set(mine.slice(0, mine.length - MAX_HISTORY_PER_CLIENT).map((h) => h.id));
      this.data.history = this.data.history.filter((h) => !drop.has(h.id));
    }
    await this.save();
    const { clientId: _c, ...publicItem } = item;
    return publicItem;
  }

  async deleteHistory(clientId, id) {
    const before = this.data.history.length;
    this.data.history = this.data.history.filter((h) => !(h.clientId === clientId && h.id === id));
    const removed = before - this.data.history.length;
    if (removed) await this.save();
    return removed > 0;
  }

  async clearHistory(clientId) {
    const before = this.data.history.length;
    this.data.history = this.data.history.filter((h) => h.clientId !== clientId);
    const removed = before - this.data.history.length;
    if (removed) await this.save();
    return removed;
  }

  // ---------- preferences ----------
  getPrefs(clientId) {
    return { ...DEFAULT_PREFS, ...(this.data.prefs[clientId] ?? {}) };
  }

  async setPrefs(clientId, patch) {
    this.data.prefs[clientId] = { ...this.getPrefs(clientId), ...patch };
    await this.save();
    return this.getPrefs(clientId);
  }
}
