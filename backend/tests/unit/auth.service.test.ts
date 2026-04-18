import { AuthService } from '../../src/modules/auth/auth.service.js';
import { HttpError } from '../../src/utils/httpError.js';
import { sha256 } from '../../src/utils/hash.js';
import type { AuthRepository } from '../../src/modules/auth/auth.repository.js';
import type { RefreshTokenRecord, UserRecord } from '../../src/types/database.js';

class MockAuthRepository implements AuthRepository {
  users: UserRecord[] = [];
  refreshTokens: RefreshTokenRecord[] = [];

  async createUser(username: string, passwordHash: string): Promise<UserRecord> {
    const user: UserRecord = {
      id: `user-${this.users.length + 1}`,
      username,
      password_hash: passwordHash,
      created_at: new Date()
    };

    this.users.push(user);
    return user;
  }

  async findUserByUsername(username: string): Promise<UserRecord | null> {
    return this.users.find((user) => user.username === username) ?? null;
  }

  async findUserById(userId: string): Promise<UserRecord | null> {
    return this.users.find((user) => user.id === userId) ?? null;
  }

  async saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    this.refreshTokens.push({
      id: `token-${this.refreshTokens.length + 1}`,
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      revoked_at: null,
      created_at: new Date()
    });
  }

  async findRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return this.refreshTokens.find((token) => token.token_hash === tokenHash) ?? null;
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    const token = this.refreshTokens.find((item) => item.token_hash === tokenHash);

    if (token) {
      token.revoked_at = new Date();
    }
  }
}

describe('AuthService', () => {
  it('registers user and issues tokens', async () => {
    const repository = new MockAuthRepository();
    const service = new AuthService(repository);

    const result = await service.register({ username: 'alpha_user', password: 'password123' });

    expect(result.user.username).toBe('alpha_user');
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(repository.refreshTokens).toHaveLength(1);
  });

  it('rejects login with wrong password', async () => {
    const repository = new MockAuthRepository();
    const service = new AuthService(repository);

    await service.register({ username: 'beta_user', password: 'password123' });

    await expect(service.login({ username: 'beta_user', password: 'badpassword' })).rejects.toBeInstanceOf(HttpError);
  });

  it('refreshes tokens and revokes old refresh token', async () => {
    const repository = new MockAuthRepository();
    const service = new AuthService(repository);

    const login = await service.register({ username: 'gamma_user', password: 'password123' });
    const oldHash = sha256(login.refreshToken);

    const refreshed = await service.refresh(login.refreshToken);

    const oldToken = repository.refreshTokens.find((item) => item.token_hash === oldHash);

    expect(oldToken?.revoked_at).not.toBeNull();
    expect(refreshed.refreshToken).not.toEqual(login.refreshToken);
  });
});
