import type { Pool, QueryResult, QueryResultRow } from "pg";

/**
 * Base for module repositories: holds a pg Pool and a small typed query helper.
 * Concrete repositories extend this and implement domain-specific SQL.
 */
export abstract class BaseRepository {
  constructor(protected readonly pool: Pool) {
    if (!pool) {
      throw new Error("Pool is required");
    }
  }

  protected async query<R extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<R>> {
    return this.pool.query<R>(text, params);
  }
}
