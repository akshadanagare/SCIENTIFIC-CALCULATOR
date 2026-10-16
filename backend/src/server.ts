import { buildApp } from './app';
import { config } from './config';

async function main(): Promise<void> {
  const app = await buildApp({ logger: { level: config.logLevel } });

  try {
    await app.listen({ port: config.port, host: config.host });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // stop cleanly on Ctrl+C
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, async () => {
      await app.close();
      process.exit(0);
    });
  }
}

main().catch((err) => {
  console.error('Could not start the API:', err instanceof Error ? err.message : err);
  process.exit(1);
});
