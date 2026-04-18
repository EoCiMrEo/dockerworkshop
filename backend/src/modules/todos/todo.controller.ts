import type { Request, Response, NextFunction } from 'express';
import type { TodoService } from './todo.service.js';
import { createTodoSchema, todoFilterSchema, updateTodoSchema } from '../../validation/todoSchemas.js';

const requireUserId = (request: Request): string => {
  if (!request.authUser?.userId) {
    throw new Error('auth user missing');
  }

  return request.authUser.userId;
};

export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  create = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = requireUserId(request);
      const payload = createTodoSchema.parse(request.body);
      const created = await this.todoService.create(userId, payload);
      response.status(201).json(created);
    }
    catch (error) {
      next(error);
    }
  };

  list = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = requireUserId(request);
      const filters = todoFilterSchema.parse(request.query);
      const list = await this.todoService.list(userId, filters);
      response.status(200).json(list);
    }
    catch (error) {
      next(error);
    }
  };

  getById = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = requireUserId(request);
      const item = await this.todoService.getById(userId, request.params.id);
      response.status(200).json(item);
    }
    catch (error) {
      next(error);
    }
  };

  update = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = requireUserId(request);
      const payload = updateTodoSchema.parse(request.body);
      const item = await this.todoService.update(userId, request.params.id, payload);
      response.status(200).json(item);
    }
    catch (error) {
      next(error);
    }
  };

  delete = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = requireUserId(request);
      await this.todoService.delete(userId, request.params.id);
      response.status(204).send();
    }
    catch (error) {
      next(error);
    }
  };
}
