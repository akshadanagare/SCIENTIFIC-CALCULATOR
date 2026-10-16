/**
 * Preferences Service matching board_exchange service architecture.
 */
import { apiRequest } from '../api/index.js';
import { PREFERENCES_API } from '../config/api.js';

export const preferencesService = {
  /**
   * Get user preferences (theme, angle, mode, memory).
   */
  async getPreferences() {
    return apiRequest(PREFERENCES_API.GET);
  },

  /**
   * Save user preferences patch.
   */
  async savePreferences(patch) {
    return apiRequest(PREFERENCES_API.UPDATE, {
      method: 'PUT',
      body: patch,
    });
  },
};

export default preferencesService;
