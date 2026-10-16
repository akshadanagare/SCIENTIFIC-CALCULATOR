import { HistoryInput, HistoryListQuery } from '../interfaces/history.interface';
import { Queryable } from '../interfaces/db.interface';
import { HISTORY_COLUMNS, HistoryRow } from '../models/history.model';
import { toLikePattern } from '../utility/like';

// Every query here ignores rows that have deleted_at set (soft delete: rows are never removed).
export class HistoryRepository {
  constructor(private readonly db: Queryable) {}

  async list(clientId: string, { limit, offset, q }: HistoryListQuery): Promise<{ rows: HistoryRow[]; total: number }> {
    const params: unknown[] = [clientId];
    let where = 'client_id = $1 AND deleted_at IS NULL';
    if (q.trim()) {
      params.push(toLikePattern(q));
      where += ' AND (expression ILIKE $2 OR result ILIKE $2)';
    }

    const count = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM calculation_history WHERE ${where}`,
      params
    );
    const page = await this.db.query<HistoryRow>(
      `SELECT ${HISTORY_COLUMNS} FROM calculation_history
       WHERE ${where}
       ORDER BY created_at DESC, id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    return { rows: page.rows, total: Number(count.rows[0]?.count ?? 0) };
  }

  async insert(id: string, clientId: string, input: HistoryInput): Promise<HistoryRow> {
    const res = await this.db.query<HistoryRow>(
      `INSERT INTO calculation_history (id, client_id, expression, tokens, result, mode, angle)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)
       RETURNING ${HISTORY_COLUMNS}`,
      [id, clientId, input.expression, JSON.stringify(input.tokens), input.result, input.mode ?? 'standard', input.angle ?? 'deg']
    );
    return res.rows[0];
  }

  /** Changes an existing record in place. Returns null if it does not exist (or was deleted). */
  async update(id: string, clientId: string, input: HistoryInput): Promise<HistoryRow | null> {
    const res = await this.db.query<HistoryRow>(
      `UPDATE calculation_history
          SET expression = $3, tokens = $4::jsonb, result = $5,
              mode = COALESCE($6, mode), angle = COALESCE($7, angle),
              updated_at = now()
        WHERE id = $1 AND client_id = $2 AND deleted_at IS NULL
        RETURNING ${HISTORY_COLUMNS}`,
      [id, clientId, input.expression, JSON.stringify(input.tokens), input.result, input.mode ?? null, input.angle ?? null]
    );
    return res.rows[0] ?? null;
  }

  /** Soft delete: the row stays in the table with deleted_at set. */
  async softDelete(id: string, clientId: string): Promise<boolean> {
    const res = await this.db.query(
      `UPDATE calculation_history SET deleted_at = now()
        WHERE id = $1 AND client_id = $2 AND deleted_at IS NULL`,
      [id, clientId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async softDeleteAll(clientId: string): Promise<number> {
    const res = await this.db.query(
      `UPDATE calculation_history SET deleted_at = now()
        WHERE client_id = $1 AND deleted_at IS NULL`,
      [clientId]
    );
    return res.rowCount ?? 0;
  }
}
