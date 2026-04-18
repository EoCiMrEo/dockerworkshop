import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { HttpError } from '../utils/httpError.js';

export interface AuthUser {
  userId: string;
  username: string;
}

export const requireAuth = (request: Request, _response: Response, next: NextFunction): void => {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new HttpError(401, 'Authorization token is missing'));
    return;
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    request.authUser = {
      userId: payload.sub,
      username: payload.username
    };
    next();
  }
  catch {
    next(new HttpError(401, 'Invalid or expired access token'));
  }
};
