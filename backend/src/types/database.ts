export type Priority = 'low' | 'medium' | 'high';

export interface UserRecord {
  id: string;
  username: string;
  password_hash: string;
  created_at: Date;
}

export interface RefreshTokenRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

export interface TodoRecord {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: Date | null;
  priority: Priority;
  completed: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface QueryResultLike<T> {
  rows: T[];
  rowCount: number | null;
}

export interface Queryable {
  query<T>(text: string, params?: unknown[]): Promise<QueryResultLike<T>>;
}
