import { ANGLE_UNITS, CALC_MODES } from '../constants';

export type CalcMode = (typeof CALC_MODES)[number];
export type AngleUnit = (typeof ANGLE_UNITS)[number];

/** What the API sends back for one history record. */
export interface HistoryItem {
  id: string;
  expression: string;
  tokens: string[];
  result: string;
  mode: CalcMode;
  angle: AngleUnit;
  createdAt: string;
  updatedAt: string;
}

/** Body of POST /history and PUT /history/:id */
export interface HistoryInput {
  expression: string;
  tokens: string[];
  result: string;
  mode?: CalcMode;
  angle?: AngleUnit;
}

export interface HistoryListQuery {
  limit: number;
  offset: number;
  q: string;
}

export interface HistoryPage {
  items: HistoryItem[];
  total: number;
  limit: number;
  offset: number;
}
