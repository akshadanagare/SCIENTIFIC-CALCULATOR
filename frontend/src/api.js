// Talks to the Fastify backend. In development Vite forwards /api to http://localhost:3001.
// For a deployed website set VITE_API_URL (for example https://mathcorner-api.onrender.com).
const BASE = `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/api`;

let memoryId = null;
const makeId = () =>
  globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `c${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

// Every browser gets its own random id, so each person sees only their own history.
export function getClientId() {
  try {
    let id = localStorage.getItem('mathcorner-client-id');
    if (!id) {
      id = makeId();
      localStorage.setItem('mathcorner-client-id', id);
    }
    return id;
  } catch {
    memoryId = memoryId || makeId();
    return memoryId;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    let res;
    try {
      res = await fetch(`${BASE}${path}`, {
        method,
        headers: {
          'x-client-id': getClientId(),
          // only send a content type when there is a body (an empty JSON body is invalid)
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch {
      throw Object.assign(new Error('Server not reachable'), { offline: true });
    }
    if (res.status === 204) return null;
    const data = await res.json().catch(() => null);
    if (!res.ok) throw Object.assign(new Error(data?.message || `Request failed (${res.status})`), { status: res.status });
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  listHistory: ({ limit = 30, offset = 0, q = '' } = {}) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (q.trim()) params.set('q', q.trim());
    return request(`/history?${params}`);
  },
  addHistory: (entry) => request('/history', { method: 'POST', body: entry }),
  deleteHistory: (id) => request(`/history/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  clearHistory: () => request('/history', { method: 'DELETE' }),
  getPreferences: () => request('/preferences'),
  savePreferences: (patch) => request('/preferences', { method: 'PUT', body: patch }),
};
