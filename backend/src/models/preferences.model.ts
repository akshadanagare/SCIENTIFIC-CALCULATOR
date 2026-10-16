import { Preferences } from '../interfaces/preferences.interface';

export interface PreferencesRow {
  client_id: string;
  theme: Preferences['theme'];
  mode: Preferences['mode'];
  angle: Preferences['angle'];
  memory: number | null;
  updated_at: Date | string;
}

export const DEFAULT_PREFERENCES: Readonly<Preferences> = Object.freeze({
  theme: null,
  mode: 'standard',
  angle: 'deg',
  memory: null,
});

export const toPreferences = (row: PreferencesRow): Preferences => ({
  theme: row.theme,
  mode: row.mode,
  angle: row.angle,
  memory: row.memory === null ? null : Number(row.memory),
});
