import { randomUUID } from 'node:crypto';
import { MESSAGES } from '../constants';
import { HistoryInput, HistoryItem, HistoryListQuery, HistoryPage } from '../interfaces/history.interface';
import { toHistoryItem } from '../models/history.model';
import { HistoryRepository } from '../repositories/history.repository';
import { notFound } from '../utility/app-error';

export class HistoryService {
  constructor(private readonly repo: HistoryRepository) {}

  async list(clientId: string, query: HistoryListQuery): Promise<HistoryPage> {
    const { rows, total } = await this.repo.list(clientId, query);
    return { items: rows.map(toHistoryItem), total, limit: query.limit, offset: query.offset };
  }

  async create(clientId: string, input: HistoryInput): Promise<HistoryItem> {
    return toHistoryItem(await this.repo.insert(randomUUID(), clientId, input));
  }

  async update(clientId: string, id: string, input: HistoryInput): Promise<HistoryItem> {
    const row = await this.repo.update(id, clientId, input);
    if (!row) throw notFound(MESSAGES.historyNotFound);
    return toHistoryItem(row);
  }

  async remove(clientId: string, id: string): Promise<void> {
    if (!(await this.repo.softDelete(id, clientId))) throw notFound(MESSAGES.historyNotFound);
  }

  async clear(clientId: string): Promise<{ deleted: number }> {
    return { deleted: await this.repo.softDeleteAll(clientId) };
  }
}
