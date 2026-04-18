import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from './auth.service.js';
import { credentialsSchema, refreshSchema } from '../../validation/authSchemas.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = credentialsSchema.parse(request.body);
      const result = await this.authService.register(payload);
      response.status(201).json(result);
    }
    catch (error) {
      next(error);
    }
  };

  login = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = credentialsSchema.parse(request.body);
      const result = await this.authService.login(payload);
      response.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  };

  refresh = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = refreshSchema.parse(request.body);
      const result = await this.authService.refresh(payload.refreshToken);
      response.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  };

  logout = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = refreshSchema.parse(request.body);
      await this.authService.logout(payload.refreshToken);
      response.status(204).send();
    }
    catch (error) {
      next(error);
    }
  };
}
