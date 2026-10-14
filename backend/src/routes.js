// All API routes. Every route (except /health) belongs to one browser, found by the x-client-id header.

const CLIENT_ID = /^[A-Za-z0-9_-]{8,64}$/;

const historyBody = {
  type: 'object',
  required: ['expression', 'tokens', 'result'],
  additionalProperties: false,
  properties: {
    expression: { type: 'string', minLength: 1, maxLength: 500 },
    tokens: {
      type: 'array',
      minItems: 1,
      maxItems: 300,
      items: { type: 'string', minLength: 1, maxLength: 40 },
    },
    result: { type: 'string', minLength: 1, maxLength: 60 },
    mode: { type: 'string', enum: ['standard', 'scientific'] },
    angle: { type: 'string', enum: ['deg', 'rad'] },
  },
};

const historyQuery = {
  type: 'object',
  additionalProperties: false,
  properties: {
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
    offset: { type: 'integer', minimum: 0, default: 0 },
    q: { type: 'string', maxLength: 100, default: '' },
  },
};

const prefsBody = {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    theme: { type: ['string', 'null'], enum: ['light', 'dark', null] },
    mode: { type: 'string', enum: ['standard', 'scientific'] },
    angle: { type: 'string', enum: ['deg', 'rad'] },
    memory: { type: ['number', 'null'] },
  },
};

export default async function routes(app, { store }) {
  app.get('/health', async () => ({ status: 'ok', time: new Date().toISOString() }));

  // Everything inside this plugin needs a valid x-client-id header.
  await app.register(async (api) => {
    api.addHook('preHandler', async (request, reply) => {
      const id = request.headers['x-client-id'];
      if (typeof id !== 'string' || !CLIENT_ID.test(id)) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'x-client-id header is required (8 to 64 letters, numbers, - or _)',
        });
      }
      request.clientId = id;
    });

    // ----- history -----
    api.get('/history', { schema: { querystring: historyQuery } }, async (request) => {
      const { limit, offset, q } = request.query;
      const { items, total } = store.listHistory(request.clientId, { limit, offset, q });
      return { items, total, limit, offset };
    });

    api.post('/history', { schema: { body: historyBody } }, async (request, reply) => {
      const item = await store.addHistory(request.clientId, request.body);
      return reply.code(201).send(item);
    });

    api.delete('/history/:id', async (request, reply) => {
      const ok = await store.deleteHistory(request.clientId, request.params.id);
      if (!ok) return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: 'History item not found' });
      return reply.code(204).send();
    });

    api.delete('/history', async (request) => {
      const deleted = await store.clearHistory(request.clientId);
      return { deleted };
    });

    // ----- preferences (theme, mode, degree/radian, memory) -----
    api.get('/preferences', async (request) => store.getPrefs(request.clientId));

    api.put('/preferences', { schema: { body: prefsBody } }, async (request) =>
      store.setPrefs(request.clientId, request.body)
    );
  }, { prefix: '/api' });

  // /api/health also works (handy for hosting platforms)
  app.get('/api/health', async () => ({ status: 'ok', time: new Date().toISOString() }));
}
