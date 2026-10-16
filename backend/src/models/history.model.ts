import { HistoryItem } from '../interfaces/history.interface';

/** One row of the calculation_history table. */
export interface HistoryRow {
  id: string;
  client_id: string;
  expression: string;
  tokens: string[];
  result: string;
  mode: HistoryItem['mode'];
  angle: HistoryItem['angle'];
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
}

export const HISTORY_COLUMNS = 'id, expression, tokens, result, mode, angle, created_at, updated_at';

const iso = (d: Date | string): string => new Date(d).toISOString();

/** Database row -> API object (never leaks client_id or deleted_at). */
export const toHistoryItem = (row: HistoryRow): HistoryItem => ({
  id: row.id,
  expression: row.expression,
  tokens: row.tokens,
  result: row.result,
  mode: row.mode,
  angle: row.angle,
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
});
