import { randomUUID } from 'node:crypto';
import type { Priority, Queryable, TodoRecord } from '../../types/database.js';

export interface TodoFilters {
  status: 'all' | 'active' | 'completed';
  priority?: Priority;
  search?: string;
  dueFrom?: string;
  dueTo?: string;
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'dueDate' | 'priority';
  sortOrder: 'asc' | 'desc';
}

export interface TodoInput {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority: Priority;
  completed?: boolean;
}

export interface TodoRepository {
  create(userId: string, input: TodoInput): Promise<TodoRecord>;
  findById(todoId: string, userId: string): Promise<TodoRecord | null>;
  update(todoId: string, userId: string, input: Partial<TodoInput>): Promise<TodoRecord | null>;
  delete(todoId: string, userId: string): Promise<boolean>;
  list(userId: string, filters: TodoFilters): Promise<{ items: TodoRecord[]; total: number; page: number; limit: number }>;
}

const sortByMap: Record<TodoFilters['sortBy'], string> = {
  createdAt: 'created_at',
  dueDate: 'due_date',
  priority: 'priority'
};

const sortOrderMap: Record<TodoFilters['sortOrder'], 'ASC' | 'DESC'> = {
  asc: 'ASC',
  desc: 'DESC'
};

export class PostgresTodoRepository implements TodoRepository {
  constructor(private readonly db: Queryable) {}

  async create(userId: string, input: TodoInput): Promise<TodoRecord> {
    const todoId = randomUUID();

    const result = await this.db.query<TodoRecord>(
      `
        INSERT INTO todos (id, user_id, title, description, due_date, priority, completed)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, user_id, title, description, due_date, priority, completed, created_at, updated_at
      `,
      [
        todoId,
        userId,
        input.title,
        input.description ?? null,
        input.dueDate ? new Date(input.dueDate) : null,
        input.priority,
        input.completed ?? false
      ]
    );

    return result.rows[0];
  }

  async findById(todoId: string, userId: string): Promise<TodoRecord | null> {
    const result = await this.db.query<TodoRecord>(
      `
        SELECT id, user_id, title, description, due_date, priority, completed, created_at, updated_at
        FROM todos
        WHERE id = $1 AND user_id = $2
      `,
      [todoId, userId]
    );

    return result.rows[0] ?? null;
  }

  async update(todoId: string, userId: string, input: Partial<TodoInput>): Promise<TodoRecord | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    if (typeof input.title !== 'undefined') {
      fields.push(`title = $${index++}`);
      values.push(input.title);
    }

    if (typeof input.description !== 'undefined') {
      fields.push(`description = $${index++}`);
      values.push(input.description);
    }

    if (typeof input.dueDate !== 'undefined') {
      fields.push(`due_date = $${index++}`);
      values.push(input.dueDate ? new Date(input.dueDate) : null);
    }

    if (typeof input.priority !== 'undefined') {
      fields.push(`priority = $${index++}`);
      values.push(input.priority);
    }

    if (typeof input.completed !== 'undefined') {
      fields.push(`completed = $${index++}`);
      values.push(input.completed);
    }

    if (fields.length === 0) {
      return this.findById(todoId, userId);
    }

    fields.push('updated_at = NOW()');
    values.push(todoId);
    values.push(userId);

    const result = await this.db.query<TodoRecord>(
      `
        UPDATE todos
        SET ${fields.join(', ')}
        WHERE id = $${index++} AND user_id = $${index}
        RETURNING id, user_id, title, description, due_date, priority, completed, created_at, updated_at
      `,
      values
    );

    return result.rows[0] ?? null;
  }

  async delete(todoId: string, userId: string): Promise<boolean> {
    const result = await this.db.query(
      `
        DELETE FROM todos
        WHERE id = $1 AND user_id = $2
      `,
      [todoId, userId]
    );

    return (result.rowCount ?? 0) > 0;
  }

  async list(
    userId: string,
    filters: TodoFilters
  ): Promise<{ items: TodoRecord[]; total: number; page: number; limit: number }> {
    const whereClauses: string[] = ['user_id = $1'];
    const params: unknown[] = [userId];

    if (filters.status === 'active') {
      whereClauses.push('completed = false');
    }

    if (filters.status === 'completed') {
      whereClauses.push('completed = true');
    }

    if (filters.priority) {
      params.push(filters.priority);
      whereClauses.push(`priority = $${params.length}`);
    }

    if (filters.search && filters.search.trim().length > 0) {
      params.push(`%${filters.search.trim()}%`);
      whereClauses.push(`(title ILIKE $${params.length} OR COALESCE(description, '') ILIKE $${params.length})`);
    }

    if (filters.dueFrom) {
      params.push(new Date(filters.dueFrom));
      whereClauses.push(`due_date >= $${params.length}`);
    }

    if (filters.dueTo) {
      params.push(new Date(filters.dueTo));
      whereClauses.push(`due_date <= $${params.length}`);
    }

    const whereSql = whereClauses.join(' AND ');

    const totalResult = await this.db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM todos WHERE ${whereSql}`,
      params
    );

    const offset = (filters.page - 1) * filters.limit;
    const sortBy = sortByMap[filters.sortBy];
    const sortOrder = sortOrderMap[filters.sortOrder];

    params.push(filters.limit);
    params.push(offset);

    const itemsResult = await this.db.query<TodoRecord>(
      `
        SELECT id, user_id, title, description, due_date, priority, completed, created_at, updated_at
        FROM todos
        WHERE ${whereSql}
        ORDER BY ${sortBy} ${sortOrder}, created_at DESC
        LIMIT $${params.length - 1}
        OFFSET $${params.length}
      `,
      params
    );

    return {
      items: itemsResult.rows,
      total: Number(totalResult.rows[0]?.count ?? 0),
      page: filters.page,
      limit: filters.limit
    };
  }
}
