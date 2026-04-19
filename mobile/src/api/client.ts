import type { AuthResponse, Todo, TodoFilters, TodoListResponse, TodoPayload } from '../types/models';

const apiUrlFromEnv = process.env.EXPO_PUBLIC_API_URL;
const apiUrlHostFallback = process.env.EXPO_PUBLIC_API_URL_HOST;

export const apiBaseUrl = apiUrlFromEnv ?? apiUrlHostFallback ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  token?: string;
  body?: unknown;
}

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    let message = 'Request failed';

    try {
      const payload = (await response.json()) as { error?: string; details?: string[] };
      message = payload.details?.length ? payload.details.join('\n') : payload.error ?? message;
    }
    catch {
      message = response.statusText || message;
    }

    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const authApi = {
  register: (username: string, password: string) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: { username, password } }),
  login: (username: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: { username, password } }),
  refresh: (refreshToken: string) =>
    request<AuthResponse>('/auth/refresh', { method: 'POST', body: { refreshToken } }),
  logout: (refreshToken: string) => request<void>('/auth/logout', { method: 'POST', body: { refreshToken } })
};

const buildQuery = (filters: TodoFilters): string => {
  const params = new URLSearchParams();
  params.set('status', filters.status);

  if (filters.priority) {
    params.set('priority', filters.priority);
  }

  if (filters.search?.trim()) {
    params.set('search', filters.search.trim());
  }

  return params.toString();
};

export const todoApi = {
  list: (token: string, filters: TodoFilters) => request<TodoListResponse>(`/todos?${buildQuery(filters)}`, { token }),
  create: (token: string, payload: TodoPayload) => request<Todo>('/todos', { method: 'POST', token, body: payload }),
  update: (token: string, todoId: string, payload: Partial<TodoPayload>) =>
    request<Todo>(`/todos/${todoId}`, {
      method: 'PUT',
      token,
      body: payload
    }),
  remove: (token: string, todoId: string) => request<void>(`/todos/${todoId}`, { method: 'DELETE', token })
};
