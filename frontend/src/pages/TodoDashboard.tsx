import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, todoApi } from '../api/client';
import { TodoComposer } from '../components/TodoComposer';
import { TodoFiltersBar } from '../components/TodoFiltersBar';
import { TodoList } from '../components/TodoList';
import { useAuth } from '../context/AuthContext';
import type { TodoFilters, TodoPayload } from '../types/models';

const QUERY_KEY = ['todos'];

export const TodoDashboard = () => {
  const { session, refreshSession, logout } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TodoFilters>({
    status: 'all',
    search: '',
    priority: undefined
  });

  const runWithAuthRetry = async <T,>(requester: (token: string) => Promise<T>): Promise<T> => {
    const token = session.accessToken;

    if (!token) {
      throw new Error('Session expired. Please login again.');
    }

    try {
      return await requester(token);
    }
    catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        const newAccessToken = await refreshSession();
        return requester(newAccessToken);
      }

      throw requestError;
    }
  };

  const todosQuery = useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: () => runWithAuthRetry((token) => todoApi.list(token, filters))
  });

  const createMutation = useMutation({
    mutationFn: (payload: TodoPayload) => runWithAuthRetry((token) => todoApi.create(token, payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ todoId, payload }: { todoId: string; payload: Partial<TodoPayload> }) =>
      runWithAuthRetry((token) => todoApi.update(token, todoId, payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (todoId: string) => runWithAuthRetry((token) => todoApi.remove(token, todoId)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }
  });

  const stats = useMemo(() => {
    const items = todosQuery.data?.items ?? [];
    const completed = items.filter((item) => item.completed).length;
    return {
      total: items.length,
      completed,
      active: items.length - completed
    };
  }, [todosQuery.data?.items]);

  const safeAction = async (action: () => Promise<void>): Promise<void> => {
    setError(null);

    try {
      await action();
    }
    catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Action failed';
      setError(message);
    }
  };

  return (
    <div className="dashboard-shell">
      <header>
        <div>
          <h1>Your Todo Flight Deck</h1>
          <p>Logged in as @{session.user?.username}</p>
        </div>
        <button
          className="ghost"
          type="button"
          onClick={() => {
            void logout();
          }}
        >
          Logout
        </button>
      </header>

      <section className="stats-row" aria-label="todo summary stats">
        <article>
          <span>Total</span>
          <strong>{stats.total}</strong>
        </article>
        <article>
          <span>Active</span>
          <strong>{stats.active}</strong>
        </article>
        <article>
          <span>Completed</span>
          <strong>{stats.completed}</strong>
        </article>
      </section>

      <TodoComposer
        onSubmit={(payload) =>
          safeAction(async () => {
            await createMutation.mutateAsync(payload);
          })
        }
      />

      <TodoFiltersBar filters={filters} onChange={setFilters} />

      {error ? <div className="error-banner">{error}</div> : null}

      {todosQuery.isLoading ? <div className="loading">Loading todos...</div> : null}

      {todosQuery.data ? (
        <TodoList
          items={todosQuery.data.items}
          onUpdate={(todoId, payload) =>
            safeAction(async () => {
              await updateMutation.mutateAsync({ todoId, payload });
            })
          }
          onDelete={(todoId) =>
            safeAction(async () => {
              await deleteMutation.mutateAsync(todoId);
            })
          }
        />
      ) : null}
    </div>
  );
};
