import type { QueryResult, QueryResultRow } from 'pg';

/** The small part of pg.Pool that the repositories need (also makes testing easy). */
export interface Queryable {
  query<R extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<R>>;
}
