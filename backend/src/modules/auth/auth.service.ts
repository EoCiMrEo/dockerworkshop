import { env } from '../../config/env.js';
import { HttpError } from '../../utils/httpError.js';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { sha256 } from '../../utils/hash.js';
import type { AuthRepository } from './auth.repository.js';

export interface CredentialsInput {
  username: string;
  password: string;
}

export interface AuthResult {
  user: {
    id: string;
    username: string;
  };
  accessToken: string;
  refreshToken: string;
}

const refreshExpiryDate = (): Date => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_TTL_DAYS);
  return expiresAt;
};

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async register(input: CredentialsInput): Promise<AuthResult> {
    const existing = await this.authRepository.findUserByUsername(input.username);

    if (existing) {
      throw new HttpError(409, 'Username already exists');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.authRepository.createUser(input.username, passwordHash);

    return this.issueTokens(user.id, user.username);
  }

  async login(input: CredentialsInput): Promise<AuthResult> {
    const user = await this.authRepository.findUserByUsername(input.username);

    if (!user) {
      throw new HttpError(401, 'Invalid username or password');
    }

    const validPassword = await verifyPassword(input.password, user.password_hash);

    if (!validPassword) {
      throw new HttpError(401, 'Invalid username or password');
    }

    return this.issueTokens(user.id, user.username);
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    let payload;

    try {
      payload = verifyRefreshToken(refreshToken);
    }
    catch {
      throw new HttpError(401, 'Invalid or expired refresh token');
    }

    const tokenHash = sha256(refreshToken);
    const tokenRecord = await this.authRepository.findRefreshToken(tokenHash);

    if (!tokenRecord || tokenRecord.revoked_at || tokenRecord.expires_at.getTime() < Date.now()) {
      throw new HttpError(401, 'Refresh token is not valid anymore');
    }

    if (tokenRecord.user_id !== payload.sub) {
      throw new HttpError(401, 'Refresh token user mismatch');
    }

    await this.authRepository.revokeRefreshToken(tokenHash);

    return this.issueTokens(payload.sub, payload.username);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = sha256(refreshToken);
    await this.authRepository.revokeRefreshToken(tokenHash);
  }

  private async issueTokens(userId: string, username: string): Promise<AuthResult> {
    const accessToken = createAccessToken({ sub: userId, username });
    const refreshToken = createRefreshToken({ sub: userId, username });

    await this.authRepository.saveRefreshToken(userId, sha256(refreshToken), refreshExpiryDate());

    return {
      user: {
        id: userId,
        username
      },
      accessToken,
      refreshToken
    };
  }
}
