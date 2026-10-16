import { FastifyInstance } from 'fastify';
import { ANGLE_UNITS, CALC_MODES, HISTORY_LIMITS as L } from '../constants';
import { HistoryController } from '../controllers/history.controller';
import { HistoryInput, HistoryListQuery } from '../interfaces/history.interface';

const historyBody = {
  type: 'object',
  required: ['expression', 'tokens', 'result'],
  additionalProperties: false,
  properties: {
    expression: { type: 'string', minLength: 1, maxLength: L.maxExpressionLength },
    tokens: {
      type: 'array',
      minItems: 1,
      maxItems: L.maxTokens,
      items: { type: 'string', minLength: 1, maxLength: L.maxTokenLength },
    },
    result: { type: 'string', minLength: 1, maxLength: L.maxResultLength },
    mode: { type: 'string', enum: [...CALC_MODES] },
    angle: { type: 'string', enum: [...ANGLE_UNITS] },
  },
} as const;

const listQuery = {
  type: 'object',
  additionalProperties: false,
  properties: {
    limit: { type: 'integer', minimum: 1, maximum: L.maxPageSize, default: L.defaultPageSize },
    offset: { type: 'integer', minimum: 0, default: 0 },
    q: { type: 'string', maxLength: L.maxSearchLength, default: '' },
  },
} as const;

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', format: 'uuid' } },
} as const;

export function historyRoutes(controller: HistoryController) {
  return async (app: FastifyInstance): Promise<void> => {
    app.get<{ Querystring: HistoryListQuery }>('/history', { schema: { querystring: listQuery } }, controller.list);
    app.post<{ Body: HistoryInput }>('/history', { schema: { body: historyBody } }, controller.create);
    app.put<{ Params: { id: string }; Body: HistoryInput }>(
      '/history/:id',
      { schema: { params: idParams, body: historyBody } },
      controller.update
    );
    app.delete<{ Params: { id: string } }>('/history/:id', { schema: { params: idParams } }, controller.remove);
    app.delete('/history', controller.clear);
  };
}

export default historyRoutes;
