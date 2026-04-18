import 'dotenv/config';
import { buildApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';

const app = buildApp();

const server = app.listen(env.API_PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on port ${env.API_PORT}`);
});

const shutdown = async (): Promise<void> => {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
