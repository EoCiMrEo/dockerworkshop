import { TodoService } from '../../src/modules/todos/todo.service.js';
import { HttpError } from '../../src/utils/httpError.js';
import type { TodoFilters, TodoInput, TodoRepository } from '../../src/modules/todos/todo.repository.js';
import type { TodoRecord } from '../../src/types/database.js';

class MockTodoRepository implements TodoRepository {
  private items: TodoRecord[] = [];

  async create(userId: string, input: TodoInput): Promise<TodoRecord> {
    const item: TodoRecord = {
      id: `todo-${this.items.length + 1}`,
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      due_date: input.dueDate ? new Date(input.dueDate) : null,
      priority: input.priority,
      completed: input.completed ?? false,
      created_at: new Date(),
      updated_at: new Date()
    };

    this.items.push(item);
    return item;
  }

  async findById(todoId: string, userId: string): Promise<TodoRecord | null> {
    return this.items.find((item) => item.id === todoId && item.user_id === userId) ?? null;
  }

  async update(todoId: string, userId: string, input: Partial<TodoInput>): Promise<TodoRecord | null> {
    const todo = await this.findById(todoId, userId);

    if (!todo) {
      return null;
    }

    Object.assign(todo, {
      title: input.title ?? todo.title,
      description: typeof input.description === 'undefined' ? todo.description : input.description,
      due_date: typeof input.dueDate === 'undefined' ? todo.due_date : input.dueDate ? new Date(input.dueDate) : null,
      priority: input.priority ?? todo.priority,
      completed: typeof input.completed === 'undefined' ? todo.completed : input.completed,
      updated_at: new Date()
    });

    return todo;
  }

  async delete(todoId: string, userId: string): Promise<boolean> {
    const initial = this.items.length;
    this.items = this.items.filter((item) => !(item.id === todoId && item.user_id === userId));
    return this.items.length < initial;
  }

  async list(userId: string, filters: TodoFilters): Promise<{ items: TodoRecord[]; total: number; page: number; limit: number }> {
    let filtered = this.items.filter((item) => item.user_id === userId);

    if (filters.status === 'active') {
      filtered = filtered.filter((item) => !item.completed);
    }

    if (filters.status === 'completed') {
      filtered = filtered.filter((item) => item.completed);
    }

    return {
      items: filtered,
      total: filtered.length,
      page: filters.page,
      limit: filters.limit
    };
  }
}

describe('TodoService', () => {
  it('creates and fetches todo', async () => {
    const repository = new MockTodoRepository();
    const service = new TodoService(repository);

    const created = await service.create('user-1', {
      title: 'Study Docker',
      priority: 'high',
      dueDate: new Date().toISOString()
    });

    const loaded = await service.getById('user-1', created.id);
    expect(loaded.title).toBe('Study Docker');
  });

  it('throws not found for missing todo', async () => {
    const repository = new MockTodoRepository();
    const service = new TodoService(repository);

    await expect(service.getById('user-1', 'missing')).rejects.toBeInstanceOf(HttpError);
  });
});
