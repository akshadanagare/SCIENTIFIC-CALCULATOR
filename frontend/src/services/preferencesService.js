/**
 * Preferences Service matching board_exchange service architecture.
 * Strictly communicates with PostgreSQL backend API.
 */
import { apiRequest } from '../api/index.js';
import { PREFERENCES_API } from '../config/api.js';

export const preferencesService = {
  /**
   * Get user preferences from database (theme, angle, mode, memory).
   */
  async getPreferences() {
    return apiRequest(PREFERENCES_API.GET);
  },

  /**
   * Save user preferences patch to database.
   */
  async savePreferences(patch) {
    return apiRequest(PREFERENCES_API.UPDATE, {
      method: 'PUT',
      body: patch,
    });
  },
};

export default preferencesService;
