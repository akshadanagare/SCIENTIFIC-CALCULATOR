import { FastifyInstance } from 'fastify';
import { AppConfig } from '../config';
import { registerErrorHandlers } from '../middleware/error-handler.middleware';
import { registerCors } from '../plugins/cors.plugin';
import { registerJsonParser } from '../plugins/json-parser.plugin';

export async function loadPlugins(app: FastifyInstance, cfg: AppConfig): Promise<void> {
  registerJsonParser(app);
  await registerCors(app, cfg.corsOrigin);
  registerErrorHandlers(app);
}
