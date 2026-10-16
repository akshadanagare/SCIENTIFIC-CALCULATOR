import { FastifyInstance } from 'fastify';
import { MESSAGES } from '../constants';
import { badRequest } from '../utility/app-error';

/** Accept an empty body even when the browser sends "Content-Type: application/json" (for example on DELETE). */
export function registerJsonParser(app: FastifyInstance): void {
  app.removeContentTypeParser('application/json');
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_request, body, done) => {
    if (!body) return done(null, undefined);
    try {
      done(null, JSON.parse(body as string));
    } catch {
      done(badRequest(MESSAGES.invalidJson));
    }
  });
}
