import 'dotenv/config';
import { pool } from './pool.js';
import { runMigrations } from './migrations.js';

const main = async (): Promise<void> => {
  await runMigrations(pool);
  await pool.end();
  // eslint-disable-next-line no-console
  console.log('Migrations completed successfully.');
};

main().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error('Migration failed:', error);
  await pool.end();
  process.exit(1);
});
