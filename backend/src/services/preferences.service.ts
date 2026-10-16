import { Preferences, PreferencesPatch } from '../interfaces/preferences.interface';
import { DEFAULT_PREFERENCES, toPreferences } from '../models/preferences.model';
import { PreferencesRepository } from '../repositories/preferences.repository';

export class PreferencesService {
  constructor(private readonly repo: PreferencesRepository) {}

  async get(clientId: string): Promise<Preferences> {
    const row = await this.repo.find(clientId);
    return row ? toPreferences(row) : { ...DEFAULT_PREFERENCES };
  }

  async update(clientId: string, patch: PreferencesPatch): Promise<Preferences> {
    const merged: Preferences = { ...(await this.get(clientId)), ...patch };
    return toPreferences(await this.repo.save(clientId, merged));
  }
}
