import { FastifyInstance } from 'fastify';
import { HealthController } from '../controllers/health.controller';

export function healthRoutes(controller: HealthController) {
  return async (app: FastifyInstance): Promise<void> => {
    app.get('/health', controller.check);
  };
}

export default healthRoutes;
