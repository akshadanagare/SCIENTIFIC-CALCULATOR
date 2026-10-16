/**
 * Preferences Service matching board_exchange service architecture.
 * Directly stores user preferences in PostgreSQL backend when available,
 * and seamlessly stores in client-side database (`calculation`) when deployed.
 */
import { apiRequest } from '../api/index.js';
import { PREFERENCES_API } from '../config/api.js';
import { dbGetPreferences, dbSavePreferences } from '../utils/db.js';

export const preferencesService = {
  /**
   * Get user preferences from database (theme, angle, mode, memory).
   */
  async getPreferences() {
    try {
      return await apiRequest(PREFERENCES_API.GET);
    } catch {
      return dbGetPreferences();
    }
  },

  /**
   * Save user preferences patch to database.
   */
  async savePreferences(patch) {
    try {
      return await apiRequest(PREFERENCES_API.UPDATE, {
        method: 'PUT',
        body: patch,
      });
    } catch {
      return dbSavePreferences(patch);
    }
  },
};

export default preferencesService;
