import { FastifyRequest } from 'fastify';
import { PreferencesPatch } from '../interfaces/preferences.interface';
import { PreferencesService } from '../services/preferences.service';

export class PreferencesController {
  constructor(private readonly service: PreferencesService) {}

  get = async (request: FastifyRequest) => this.service.get(request.clientId);

  update = async (request: FastifyRequest<{ Body: PreferencesPatch }>) =>
    this.service.update(request.clientId, request.body);
}
