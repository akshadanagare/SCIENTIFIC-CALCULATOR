/**
 * Helper functions to make API calls matching board_exchange pattern.
 * Works seamlessly without bearer tokens on backend side.
 */
import { getClientId } from './clientId.js';
import { API_CONFIG } from '../config/api.js';

export class ApiRequestError extends Error {
  constructor(message, init = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = init.status;
    this.url = init.url;
    this.data = init.data;
    this.offline = init.offline ?? false;
  }
}

/**
 * Extract clean backend error message for UI display.
 */
export function getBackendMessage(error) {
  if (error && typeof error === 'object') {
    const data = error.data || error.response?.data;
    if (data && typeof data === 'object') {
      const preferred = data.error || data.message || data.msg || data.detail;
      if (typeof preferred === 'string' && preferred.trim()) return preferred.trim();
      if (typeof preferred === 'object' && preferred?.message) return String(preferred.message).trim();
    } else if (typeof data === 'string' && data.trim() && !data.trim().startsWith('<')) {
      return data.trim();
    }
    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message.trim();
    }
  } else if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  }

  return 'Something went wrong. Please try again.';
}

function resolveUrl(url) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const base = API_CONFIG.appBackendBaseUrl || '';
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

/**
 * Standard API request helper matching board_exchange apiRequest.
 * Sends x-client-id header for client tracking without requiring any auth token.
 */
export async function apiRequest(endpoint, { method = 'GET', body, headers = {}, timeout = 8000 } = {}) {
  if (!API_CONFIG.appBackendBaseUrl && typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
    throw new ApiRequestError('No backend configured on static host', { offline: true });
  }
  const url = resolveUrl(endpoint);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    let res;
    try {
      res = await fetch(url, {
        method,
        headers: {
          'x-client-id': getClientId(),
          'bypass-tunnel-reminder': '1',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch {
      throw new ApiRequestError('Server not reachable', { url, offline: true });
    }

    if (res.status === 204) return null;

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg = data?.message || data?.error || `Request failed (${res.status})`;
      throw new ApiRequestError(msg, { status: res.status, url, data });
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Public API request helper (for unauthenticated endpoints like /health).
 */
export async function publicApiRequest(endpoint, options = {}) {
  if (!API_CONFIG.appBackendBaseUrl && typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
    throw new ApiRequestError('No backend configured on static host', { offline: true });
  }
  const url = resolveUrl(endpoint);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout ?? 8000);

  try {
    let res;
    try {
      res = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'bypass-tunnel-reminder': '1',
          ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(options.headers || {}),
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    } catch {
      throw new ApiRequestError('Server not reachable', { url, offline: true });
    }

    if (res.status === 204) return null;
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new ApiRequestError(data?.message || `Request failed (${res.status})`, {
        status: res.status,
        url,
        data,
      });
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}
