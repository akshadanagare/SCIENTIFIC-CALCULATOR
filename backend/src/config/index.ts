import 'dotenv/config';

const bool = (value: string | undefined, fallback = false): boolean =>
  value === undefined || value === '' ? fallback : ['1', 'true', 'yes'].includes(value.toLowerCase());

export const config = {
  port: Number(process.env.PORT) || 3001,
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/calculation',
  dbSsl: bool(process.env.DB_SSL),
  corsOrigin: process.env.CORS_ORIGIN || '',
  logLevel: process.env.LOG_LEVEL || 'info',
} as const;

export type AppConfig = typeof config;
