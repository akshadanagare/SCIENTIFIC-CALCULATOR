import { STATUS_CODES } from 'node:http';
import { FastifyInstance } from 'fastify';
import { MESSAGES } from '../constants';

/** One JSON shape for every error: { statusCode, error, message }. */
export function registerErrorHandlers(app: FastifyInstance): void {
  app.setErrorHandler((err: Error & { statusCode?: number }, request, reply) => {
    const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
    if (statusCode >= 500) request.log.error(err);
    reply.code(statusCode).send({
      statusCode,
      error: STATUS_CODES[statusCode] ?? 'Error',
      message: statusCode >= 500 ? MESSAGES.internal : err.message,
    });
  });

  app.setNotFoundHandler((request, reply) =>
    reply.code(404).send({ statusCode: 404, error: 'Not Found', message: `Route ${request.method} ${request.url} not found` })
  );
}
