/**
 * History Service matching board_exchange service architecture.
 * Directly stores calculations in the PostgreSQL backend when available,
 * and seamlessly stores in the client-side database (`calculation`) when deployed.
 */
import { apiRequest } from '../api/index.js';
import { HISTORY_API } from '../config/api.js';
import {
  dbAddCalculation,
  dbListCalculations,
  dbUpdateCalculation,
  dbDeleteCalculation,
  dbClearCalculations,
} from '../utils/db.js';

export const historyService = {
  /**
   * Fetch calculation history from database with pagination and search filter.
   */
  async listHistory({ limit = 30, offset = 0, q = '' } = {}) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (q && q.trim()) params.set('q', q.trim());

    try {
      return await apiRequest(HISTORY_API.LIST(params.toString()));
    } catch {
      // Deployed database fallback (IndexedDB database: calculation)
      return dbListCalculations({ limit, offset, q });
    }
  },

  /**
   * Add a new calculation to database.
   */
  async addHistory(entry) {
    try {
      return await apiRequest(HISTORY_API.CREATE, {
        method: 'POST',
        body: entry,
      });
    } catch {
      // Deployed database fallback (IndexedDB database: calculation)
      return dbAddCalculation(entry);
    }
  },

  /**
   * Update an existing calculation record in database.
   */
  async updateHistory(id, entry) {
    try {
      return await apiRequest(HISTORY_API.UPDATE(id), {
        method: 'PUT',
        body: entry,
      });
    } catch {
      return dbUpdateCalculation(id, entry);
    }
  },

  /**
   * Soft-delete a calculation record in database.
   */
  async deleteHistory(id) {
    try {
      return await apiRequest(HISTORY_API.DELETE(id), {
        method: 'DELETE',
      });
    } catch {
      return dbDeleteCalculation(id);
    }
  },

  /**
   * Clear all calculation history in database.
   */
  async clearHistory() {
    try {
      return await apiRequest(HISTORY_API.CLEAR, {
        method: 'DELETE',
      });
    } catch {
      return dbClearCalculations();
    }
  },
};

export default historyService;
