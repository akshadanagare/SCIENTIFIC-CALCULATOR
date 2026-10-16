import cors from '@fastify/cors';
import { FastifyInstance } from 'fastify';
import { CLIENT_ID_HEADER } from '../constants';

export async function registerCors(app: FastifyInstance, corsOrigin: string): Promise<void> {
  const origins = corsOrigin.split(',').map((s) => s.trim()).filter(Boolean);
  await app.register(cors, {
    origin: origins.length ? origins : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', CLIENT_ID_HEADER],
  });
}
