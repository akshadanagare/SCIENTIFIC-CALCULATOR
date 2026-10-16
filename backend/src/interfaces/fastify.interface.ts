import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by the client-id middleware. */
    clientId: string;
  }
}
