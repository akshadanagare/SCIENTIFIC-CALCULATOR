import { Pool } from 'pg';
import { AppConfig } from '../config';

export function createPool(cfg: Pick<AppConfig, 'databaseUrl' | 'dbSsl'>): Pool {
  return new Pool({
    connectionString: cfg.databaseUrl,
    ssl: cfg.dbSsl ? { rejectUnauthorized: false } : undefined,
    max: 10,
  });
}
