import { randomUUID } from 'node:crypto';
import type { Queryable, RefreshTokenRecord, UserRecord } from '../../types/database.js';

export interface AuthRepository {
  createUser(username: string, passwordHash: string): Promise<UserRecord>;
  findUserByUsername(username: string): Promise<UserRecord | null>;
  findUserById(userId: string): Promise<UserRecord | null>;
  saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  findRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revokeRefreshToken(tokenHash: string): Promise<void>;
}

export class PostgresAuthRepository implements AuthRepository {
  constructor(private readonly db: Queryable) {}

  async createUser(username: string, passwordHash: string): Promise<UserRecord> {
    const userId = randomUUID();

    const result = await this.db.query<UserRecord>(
      `
        INSERT INTO users (id, username, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, username, password_hash, created_at
      `,
      [userId, username, passwordHash]
    );

    return result.rows[0];
  }

  async findUserByUsername(username: string): Promise<UserRecord | null> {
    const result = await this.db.query<UserRecord>(
      `
        SELECT id, username, password_hash, created_at
        FROM users
        WHERE username = $1
      `,
      [username]
    );

    return result.rows[0] ?? null;
  }

  async findUserById(userId: string): Promise<UserRecord | null> {
    const result = await this.db.query<UserRecord>(
      `
        SELECT id, username, password_hash, created_at
        FROM users
        WHERE id = $1
      `,
      [userId]
    );

    return result.rows[0] ?? null;
  }

  async saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    const tokenId = randomUUID();

    await this.db.query(
      `
        INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
        VALUES ($1, $2, $3, $4)
      `,
      [tokenId, userId, tokenHash, expiresAt]
    );
  }

  async findRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const result = await this.db.query<RefreshTokenRecord>(
      `
        SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
        FROM refresh_tokens
        WHERE token_hash = $1
      `,
      [tokenHash]
    );

    return result.rows[0] ?? null;
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await this.db.query(
      `
        UPDATE refresh_tokens
        SET revoked_at = NOW()
        WHERE token_hash = $1 AND revoked_at IS NULL
      `,
      [tokenHash]
    );
  }
}
