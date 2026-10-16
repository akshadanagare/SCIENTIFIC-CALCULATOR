import { THEMES } from '../constants';
import { AngleUnit, CalcMode } from './history.interface';

export type Theme = (typeof THEMES)[number];

export interface Preferences {
  theme: Theme | null; // null = follow the device setting
  mode: CalcMode;
  angle: AngleUnit;
  memory: number | null;
}

export type PreferencesPatch = Partial<Preferences>;
