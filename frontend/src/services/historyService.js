/**
 * History Service matching board_exchange service architecture.
 * Strictly communicates with PostgreSQL backend API.
 */
import { apiRequest } from '../api/index.js';
import { HISTORY_API } from '../config/api.js';

export const historyService = {
  /**
   * Fetch calculation history from database with pagination and search filter.
   */
  async listHistory({ limit = 30, offset = 0, q = '' } = {}) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (q && q.trim()) params.set('q', q.trim());
    return apiRequest(HISTORY_API.LIST(params.toString()));
  },

  /**
   * Add a new calculation to database.
   */
  async addHistory(entry) {
    return apiRequest(HISTORY_API.CREATE, {
      method: 'POST',
      body: entry,
    });
  },

  /**
   * Update an existing calculation record in database.
   */
  async updateHistory(id, entry) {
    return apiRequest(HISTORY_API.UPDATE(id), {
      method: 'PUT',
      body: entry,
    });
  },

  /**
   * Soft-delete a calculation record in database.
   */
  async deleteHistory(id) {
    return apiRequest(HISTORY_API.DELETE(id), {
      method: 'DELETE',
    });
  },

  /**
   * Clear all calculation history for current client in database.
   */
  async clearHistory() {
    return apiRequest(HISTORY_API.CLEAR, {
      method: 'DELETE',
    });
  },
};

export default historyService;
