import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Queryable } from '../types/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationTableSql = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL UNIQUE,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

export const runMigrations = async (db: Queryable): Promise<void> => {
  await db.query(migrationTableSql);

  const migrationDir = path.resolve(__dirname, '../../sql');
  const files = readdirSync(migrationDir)
    .filter((filename) => filename.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  for (const filename of files) {
    const existing = await db.query<{ filename: string }>(
      'SELECT filename FROM schema_migrations WHERE filename = $1',
      [filename]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      continue;
    }

    const migrationSql = readFileSync(path.join(migrationDir, filename), 'utf8');

    await db.query('BEGIN');
    try {
      await db.query(migrationSql);
      await db.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
      await db.query('COMMIT');
    }
    catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }
};
