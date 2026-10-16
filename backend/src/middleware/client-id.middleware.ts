import { FastifyReply, FastifyRequest } from 'fastify';
import '../interfaces/fastify.interface';
import { CLIENT_ID_HEADER, CLIENT_ID_PATTERN, MESSAGES } from '../constants';
import { badRequest } from '../utility/app-error';

/** Every browser sends its own random id; this reads it and puts it on the request. */
export async function requireClientId(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const id = request.headers[CLIENT_ID_HEADER];
  if (typeof id !== 'string' || !CLIENT_ID_PATTERN.test(id)) throw badRequest(MESSAGES.clientIdRequired);
  request.clientId = id;
}
