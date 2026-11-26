import { migrate } from './repo/migrate.js';
import { createPostgresDb } from './repo/postgres.js';
import { startServer } from './server.js';
import { createPostgresWebStore } from './web/postgres-store.js';

const port = Number(process.env.PORT ?? '3000');
const host = process.env.HOST ?? '127.0.0.1';

const databaseUrl = process.env.DATABASE_URL ?? '';
let webStore;
if (databaseUrl !== '') {
  const db = createPostgresDb(databaseUrl);
  await migrate(db);
  webStore = await createPostgresWebStore({ db });
}

const { url } = await startServer({ port, host, webStore });

console.log(`LeeTKOB listening on ${url}`);
