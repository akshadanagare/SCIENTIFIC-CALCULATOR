import { FastifyInstance } from 'fastify';
import { ANGLE_UNITS, CALC_MODES, THEMES } from '../constants';
import { PreferencesController } from '../controllers/preferences.controller';
import { PreferencesPatch } from '../interfaces/preferences.interface';

const preferencesBody = {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    theme: { type: ['string', 'null'], enum: [...THEMES, null] },
    mode: { type: 'string', enum: [...CALC_MODES] },
    angle: { type: 'string', enum: [...ANGLE_UNITS] },
    memory: { type: ['number', 'null'] },
  },
} as const;

export function preferencesRoutes(controller: PreferencesController) {
  return async (app: FastifyInstance): Promise<void> => {
    app.get('/preferences', controller.get);
    app.put<{ Body: PreferencesPatch }>('/preferences', { schema: { body: preferencesBody } }, controller.update);
  };
}

export default preferencesRoutes;
