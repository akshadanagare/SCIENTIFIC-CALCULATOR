import { FastifyReply, FastifyRequest } from 'fastify';
import { HistoryInput, HistoryListQuery } from '../interfaces/history.interface';
import { HistoryService } from '../services/history.service';

type WithId = { Params: { id: string } };

export class HistoryController {
  constructor(private readonly service: HistoryService) {}

  list = async (request: FastifyRequest<{ Querystring: HistoryListQuery }>) =>
    this.service.list(request.clientId, request.query);

  create = async (request: FastifyRequest<{ Body: HistoryInput }>, reply: FastifyReply) =>
    reply.code(201).send(await this.service.create(request.clientId, request.body));

  update = async (request: FastifyRequest<WithId & { Body: HistoryInput }>) =>
    this.service.update(request.clientId, request.params.id, request.body);

  remove = async (request: FastifyRequest<WithId>, reply: FastifyReply) => {
    await this.service.remove(request.clientId, request.params.id);
    return reply.code(204).send();
  };

  clear = async (request: FastifyRequest) => this.service.clear(request.clientId);
}
