import { runWorker } from '../src/queue/worker.js';

runWorker({ workerId: process.env.WORKER_ID ?? 'worker-1' }).catch((error) => {
  console.error('worker failed:', error);
  process.exit(1);
});
