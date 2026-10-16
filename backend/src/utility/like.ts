/** Makes user text safe to use inside a LIKE / ILIKE pattern. */
export const toLikePattern = (text: string): string =>
  `%${text.trim().replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
