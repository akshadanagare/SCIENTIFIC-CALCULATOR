import { Queryable } from '../interfaces/db.interface';
import { migrations } from './migrations';

/** Creates the tables that are missing. Safe to run on every start. */
export async function runMigrations(db: Queryable): Promise<string[]> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name        VARCHAR(200) PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  const done = await db.query<{ name: string }>('SELECT name FROM schema_migrations');
  const applied = new Set(done.rows.map((r) => r.name));
  const ran: string[] = [];

  for (const m of migrations) {
    if (applied.has(m.name)) continue;
    await db.query(m.sql);
    await db.query('INSERT INTO schema_migrations (name) VALUES ($1)', [m.name]);
    ran.push(m.name);
  }
  return ran;
}
