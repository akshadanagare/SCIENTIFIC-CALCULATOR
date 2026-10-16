/**
 * Central API configuration matching board_exchange pattern.
 */
const APP_BACKEND_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const API_CONFIG = {
  appBackendBaseUrl: APP_BACKEND_BASE,
  apiPrefix: '/api',
};

export const HISTORY_API = {
  LIST: (queryString = '') => `${API_CONFIG.apiPrefix}/history${queryString ? `?${queryString}` : ''}`,
  CREATE: `${API_CONFIG.apiPrefix}/history`,
  UPDATE: (id) => `${API_CONFIG.apiPrefix}/history/${encodeURIComponent(id)}`,
  DELETE: (id) => `${API_CONFIG.apiPrefix}/history/${encodeURIComponent(id)}`,
  CLEAR: `${API_CONFIG.apiPrefix}/history`,
};

export const PREFERENCES_API = {
  GET: `${API_CONFIG.apiPrefix}/preferences`,
  UPDATE: `${API_CONFIG.apiPrefix}/preferences`,
};

export const HEALTH_API = {
  CHECK: `${API_CONFIG.apiPrefix}/health`,
};
