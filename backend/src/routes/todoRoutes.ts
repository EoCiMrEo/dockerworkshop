import { Router } from 'express';
import type { TodoController } from '../modules/todos/todo.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const createTodoRouter = (todoController: TodoController): Router => {
  const router = Router();

  router.use(requireAuth);
  router.get('/', todoController.list);
  router.post('/', todoController.create);
  router.get('/:id', todoController.getById);
  router.put('/:id', todoController.update);
  router.delete('/:id', todoController.delete);

  return router;
};
