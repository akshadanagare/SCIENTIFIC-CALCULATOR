export const CLIENT_ID_HEADER = 'x-client-id';
export const CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

export const HISTORY_LIMITS = {
  defaultPageSize: 30,
  maxPageSize: 100,
  maxExpressionLength: 500,
  maxTokens: 300,
  maxTokenLength: 40,
  maxResultLength: 60,
  maxSearchLength: 100,
} as const;

export const CALC_MODES = ['standard', 'scientific'] as const;
export const ANGLE_UNITS = ['deg', 'rad'] as const;
export const THEMES = ['light', 'dark'] as const;

export const MESSAGES = {
  clientIdRequired: 'x-client-id header is required (8 to 64 letters, numbers, - or _)',
  historyNotFound: 'History item not found',
  invalidJson: 'Body is not valid JSON',
  internal: 'Something went wrong on the server',
} as const;
