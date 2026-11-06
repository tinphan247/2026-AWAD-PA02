import { startServer } from './server.js';

const port = Number(process.env.PORT ?? '3000');
const host = process.env.HOST ?? '127.0.0.1';

const { url } = await startServer({ port, host });

console.log(`LeeTKOB PA#2 skeleton listening on ${url}`);
