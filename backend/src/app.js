import Fastify from 'fastify';
import cors from '@fastify/cors';
import routes from './routes.js';
import { JsonStore } from './store.js';

export async function buildApp({ dbFile, corsOrigin = '', logger = false } = {}) {
  const app = Fastify({ logger });
  const store = await new JsonStore(dbFile).init();

  // Accept an empty body even when the browser sends "Content-Type: application/json" (for example on DELETE).
  app.removeContentTypeParser('application/json');
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (request, body, done) => {
    if (!body) return done(null, undefined);
    try {
      done(null, JSON.parse(body));
    } catch {
      const err = new Error('Body is not valid JSON');
      err.statusCode = 400;
      done(err);
    }
  });

  const origins = corsOrigin.split(',').map((s) => s.trim()).filter(Boolean);
  await app.register(cors, {
    origin: origins.length ? origins : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-client-id'],
  });

  app.get('/', async () => ({ name: 'MathCorner API', docs: '/api/health' }));
  await app.register(routes, { store });

  app.setNotFoundHandler((request, reply) =>
    reply.code(404).send({ statusCode: 404, error: 'Not Found', message: `Route ${request.method} ${request.url} not found` })
  );

  return app;
}
