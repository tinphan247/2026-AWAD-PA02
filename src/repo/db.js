/**
 * The small database interface the queue and worker use. Both the Postgres
 * pool (`createPostgresDb`) and the in-process pglite used by tests provide it.
 *
 * @typedef {{
 *   query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }>,
 *   exec: (text: string) => Promise<unknown>,
 * }} Queryable
 *
 * @typedef {Queryable & {
 *   transaction: <T>(fn: (tx: Queryable) => Promise<T>) => Promise<T>,
 * }} Db
 */

export {};
