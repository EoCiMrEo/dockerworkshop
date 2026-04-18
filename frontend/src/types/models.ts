export type Priority = 'low' | 'medium' | 'high';

export interface User {
  id: string;
  username: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: Priority;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TodoListResponse {
  items: Todo[];
  total: number;
  page: number;
  limit: number;
}

export interface TodoFilters {
  status: 'all' | 'active' | 'completed';
  priority?: Priority;
  search?: string;
}

export interface TodoPayload {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority: Priority;
  completed?: boolean;
}
