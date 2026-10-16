import { FastifyInstance } from 'fastify';
import { HealthController } from '../controllers/health.controller';
import { HistoryController } from '../controllers/history.controller';
import { PreferencesController } from '../controllers/preferences.controller';
import { requireClientId } from '../middleware/client-id.middleware';
import { healthRoutes } from './health.route';
import { historyRoutes } from './history.route';
import { preferencesRoutes } from './preferences.route';

export interface Controllers {
  health: HealthController;
  history: HistoryController;
  preferences: PreferencesController;
}

export async function registerRoutes(app: FastifyInstance, c: Controllers): Promise<void> {
  app.get('/', async () => ({ name: 'MathCorner API', docs: '/api/health' }));

  // GET /api/health needs no client id
  await app.register(healthRoutes(c.health), { prefix: '/api' });

  // everything else belongs to one browser, found by the x-client-id header (no bearer token required)
  await app.register(
    async (api) => {
      api.addHook('preHandler', requireClientId);
      await api.register(historyRoutes(c.history));
      await api.register(preferencesRoutes(c.preferences));
    },
    { prefix: '/api' }
  );
}

export default registerRoutes;
