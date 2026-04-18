import type { TodoFilters, TodoInput, TodoRepository } from './todo.repository.js';
import { HttpError } from '../../utils/httpError.js';

export class TodoService {
  constructor(private readonly todoRepository: TodoRepository) {}

  create(userId: string, input: TodoInput) {
    return this.todoRepository.create(userId, input);
  }

  list(userId: string, filters: TodoFilters) {
    return this.todoRepository.list(userId, filters);
  }

  async getById(userId: string, todoId: string) {
    const todo = await this.todoRepository.findById(todoId, userId);

    if (!todo) {
      throw new HttpError(404, 'Todo not found');
    }

    return todo;
  }

  async update(userId: string, todoId: string, input: Partial<TodoInput>) {
    const updated = await this.todoRepository.update(todoId, userId, input);

    if (!updated) {
      throw new HttpError(404, 'Todo not found');
    }

    return updated;
  }

  async delete(userId: string, todoId: string) {
    const deleted = await this.todoRepository.delete(todoId, userId);

    if (!deleted) {
      throw new HttpError(404, 'Todo not found');
    }
  }
}
