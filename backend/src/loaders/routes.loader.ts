import { FastifyInstance } from 'fastify';
import { HealthController } from '../controllers/health.controller';
import { HistoryController } from '../controllers/history.controller';
import { PreferencesController } from '../controllers/preferences.controller';
import { Queryable } from '../interfaces/db.interface';
import { HistoryRepository } from '../repositories/history.repository';
import { PreferencesRepository } from '../repositories/preferences.repository';
import { registerRoutes } from '../routes/index';
import { HistoryService } from '../services/history.service';
import { PreferencesService } from '../services/preferences.service';

/** Wires repository -> service -> controller -> routes. */
export async function loadRoutes(app: FastifyInstance, db: Queryable): Promise<void> {
  const history = new HistoryController(new HistoryService(new HistoryRepository(db)));
  const preferences = new PreferencesController(new PreferencesService(new PreferencesRepository(db)));
  const health = new HealthController(db);
  await registerRoutes(app, { health, history, preferences });
}
