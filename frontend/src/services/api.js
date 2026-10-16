/**
 * Central API & Services module matching board_exchange services/api.ts pattern.
 */
export {
  API_CONFIG,
  HISTORY_API,
  PREFERENCES_API,
  HEALTH_API,
  apiRequest,
  publicApiRequest,
  getBackendMessage,
  ApiRequestError,
} from '../api/index.js';

export { historyService } from './historyService.js';
export { preferencesService } from './preferencesService.js';
export { healthService } from './healthService.js';

// Legacy composite helper for full backward compatibility
import { historyService } from './historyService.js';
import { preferencesService } from './preferencesService.js';
import { healthService } from './healthService.js';

export const api = {
  listHistory: historyService.listHistory,
  addHistory: historyService.addHistory,
  updateHistory: historyService.updateHistory,
  deleteHistory: historyService.deleteHistory,
  clearHistory: historyService.clearHistory,
  getPreferences: preferencesService.getPreferences,
  savePreferences: preferencesService.savePreferences,
  checkHealth: healthService.checkHealth,
};

export default api;
