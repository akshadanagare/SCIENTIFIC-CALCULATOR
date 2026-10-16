/**
 * Health Service matching board_exchange service architecture.
 */
import { publicApiRequest } from '../api/index.js';
import { HEALTH_API } from '../config/api.js';

export const healthService = {
  /**
   * Check backend server health status.
   */
  async checkHealth() {
    return publicApiRequest(HEALTH_API.CHECK);
  },
};

export default healthService;
