import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import type { Queryable } from './types/database.js';
import { pool } from './db/pool.js';
import { env } from './config/env.js';
import { PostgresAuthRepository } from './modules/auth/auth.repository.js';
import { AuthService } from './modules/auth/auth.service.js';
import { AuthController } from './modules/auth/auth.controller.js';
import { PostgresTodoRepository } from './modules/todos/todo.repository.js';
import { TodoService } from './modules/todos/todo.service.js';
import { TodoController } from './modules/todos/todo.controller.js';
import { createAuthRouter } from './routes/authRoutes.js';
import { createTodoRouter } from './routes/todoRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export const buildApp = (db: Queryable = pool): Express => {
  const app = express();

  const authRepository = new PostgresAuthRepository(db);
  const authService = new AuthService(authRepository);
  const authController = new AuthController(authService);

  const todoRepository = new PostgresTodoRepository(db);
  const todoService = new TodoService(todoRepository);
  const todoController = new TodoController(todoService);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
      credentials: false
    })
  );
  app.use(morgan('dev'));
  app.use(express.json());

  app.get('/api/health', (_request, response) => {
    response.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  });

  app.use('/api/auth', createAuthRouter(authController));
  app.use('/api/todos', createTodoRouter(todoController));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
