import { newDb } from 'pg-mem';
import type { Queryable } from '../../src/types/database.js';
import { runMigrations } from '../../src/db/migrations.js';

export interface IntegrationDb {
  db: Queryable;
  close: () => Promise<void>;
}

export const createIntegrationDb = async (): Promise<IntegrationDb> => {
  const memoryDb = newDb({ autoCreateForeignKeyIndices: true });

  const pgAdapter = memoryDb.adapters.createPg();
  const pool = new pgAdapter.Pool();

  await runMigrations(pool);

  return {
    db: pool,
    close: async () => {
      await pool.end();
    }
  };
};
