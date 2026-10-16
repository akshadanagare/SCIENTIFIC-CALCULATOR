import Fastify, { FastifyInstance } from 'fastify';
import { AppConfig, config as defaultConfig } from './config';
import { Queryable } from './interfaces/db.interface';
import { loadDatabase } from './loaders/database.loader';
import { loadPlugins } from './loaders/plugins.loader';
import { loadRoutes } from './loaders/routes.loader';

export interface BuildOptions {
  config?: Partial<AppConfig>;
  /** Use this database instead of connecting with DATABASE_URL (used by the tests). */
  db?: Queryable;
  logger?: boolean | { level: string };
}

export async function buildApp(options: BuildOptions = {}): Promise<FastifyInstance> {
  const cfg: AppConfig = { ...defaultConfig, ...options.config };
  const app = Fastify({ logger: options.logger ?? false });

  const { db, close } = await loadDatabase(cfg, options.db);
  app.addHook('onClose', async () => close());

  await loadPlugins(app, cfg);
  await loadRoutes(app, db);
  return app;
}

// Auto-start when executed directly matching new_platform app.ts
const isDirectRun = Boolean(
  process.argv[1] &&
  (process.argv[1].endsWith('app.ts') || process.argv[1].endsWith('app.js'))
);

if (isDirectRun) {
  (async () => {
    try {
      const app = await buildApp({ logger: { level: defaultConfig.logLevel } });
      await app.listen({ port: defaultConfig.port, host: defaultConfig.host });
      app.log.info(`Server running at http://${defaultConfig.host}:${defaultConfig.port}`);

      for (const signal of ['SIGINT', 'SIGTERM'] as const) {
        process.on(signal, async () => {
          await app.close();
          process.exit(0);
        });
      }
    } catch (err) {
      console.error('Could not start the API:', err);
      process.exit(1);
    }
  })();
}

export default buildApp;
