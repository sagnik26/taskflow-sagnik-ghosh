import type { Pool, QueryResult, QueryResultRow } from "pg";

export abstract class BaseRepository {
  constructor(protected readonly pool: Pool) {
    if (!pool) throw new Error("Pool is required");
  }

  protected async query<R extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<R>> {
    return this.pool.query<R>(text, params);
  }
}

