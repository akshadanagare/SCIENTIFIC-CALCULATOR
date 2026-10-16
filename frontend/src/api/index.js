/**
 * Central API module matching board_exchange pattern.
 * Import from here wherever an API helper or endpoint constant is needed.
 */
export {
  apiRequest,
  publicApiRequest,
  getBackendMessage,
  ApiRequestError,
} from '../utils/apiHelper.js';

export {
  API_CONFIG,
  HISTORY_API,
  PREFERENCES_API,
  HEALTH_API,
} from '../config/api.js';
