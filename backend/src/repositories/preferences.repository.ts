import { Queryable } from '../interfaces/db.interface';
import { Preferences } from '../interfaces/preferences.interface';
import { PreferencesRow } from '../models/preferences.model';

export class PreferencesRepository {
  constructor(private readonly db: Queryable) {}

  async find(clientId: string): Promise<PreferencesRow | null> {
    const res = await this.db.query<PreferencesRow>(
      'SELECT client_id, theme, mode, angle, memory, updated_at FROM user_preferences WHERE client_id = $1',
      [clientId]
    );
    return res.rows[0] ?? null;
  }

  async save(clientId: string, p: Preferences): Promise<PreferencesRow> {
    const res = await this.db.query<PreferencesRow>(
      `INSERT INTO user_preferences (client_id, theme, mode, angle, memory, updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (client_id) DO UPDATE
         SET theme = EXCLUDED.theme, mode = EXCLUDED.mode, angle = EXCLUDED.angle,
             memory = EXCLUDED.memory, updated_at = now()
       RETURNING client_id, theme, mode, angle, memory, updated_at`,
      [clientId, p.theme, p.mode, p.angle, p.memory]
    );
    return res.rows[0];
  }
}
