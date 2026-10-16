import { Pool } from 'pg';
import { AppConfig } from '../config';
import { runMigrations } from '../db/migrate';
import { createPool } from '../db/pool';
import { Queryable } from '../interfaces/db.interface';

export interface LoadedDatabase {
  db: Queryable;
  close: () => Promise<void>;
}

/** Connects to PostgreSQL (or uses the one given, e.g. in tests) and creates missing tables. */
export async function loadDatabase(cfg: AppConfig, existing?: Queryable): Promise<LoadedDatabase> {
  if (existing) {
    await runMigrations(existing);
    return { db: existing, close: async () => {} };
  }
  const pool: Pool = createPool(cfg);
  try {
    await runMigrations(pool);
  } catch (err) {
    await pool.end();
    throw err;
  }
  return { db: pool, close: () => pool.end() };
}
