import { randomUUID } from 'node:crypto';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AccessTokenPayload {
  sub: string;
  username: string;
  type: 'access';
  jti: string;
}

export interface RefreshTokenPayload {
  sub: string;
  username: string;
  type: 'refresh';
  jti: string;
}

const accessSecret: Secret = env.ACCESS_TOKEN_SECRET;
const refreshSecret: Secret = env.REFRESH_TOKEN_SECRET;

const accessExpiresIn = env.ACCESS_TOKEN_TTL as SignOptions['expiresIn'];
const refreshExpiresIn = `${env.REFRESH_TOKEN_TTL_DAYS}d` as SignOptions['expiresIn'];

export const createAccessToken = (payload: Omit<AccessTokenPayload, 'type' | 'jti'>): string =>
  jwt.sign(
    {
      ...payload,
      type: 'access',
      jti: randomUUID()
    },
    accessSecret,
    { expiresIn: accessExpiresIn }
  );

export const createRefreshToken = (payload: Omit<RefreshTokenPayload, 'type' | 'jti'>): string =>
  jwt.sign(
    {
      ...payload,
      type: 'refresh',
      jti: randomUUID()
    },
    refreshSecret,
    { expiresIn: refreshExpiresIn }
  );

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const decoded = jwt.verify(token, accessSecret) as AccessTokenPayload;

  if (decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }

  return decoded;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const decoded = jwt.verify(token, refreshSecret) as RefreshTokenPayload;

  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }

  return decoded;
};
