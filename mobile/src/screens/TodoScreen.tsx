import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { ApiError, todoApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { colors } from '../styles/theme';
import type { Priority, Todo, TodoFilters } from '../types/models';
import { formatDueDate, normalizeDueDateInput } from '../utils/date';
import { matchesFilters } from '../utils/todoFilters';

const allPriorities: Priority[] = ['low', 'medium', 'high'];

const nextPriority = (priority: Priority): Priority => {
  const index = allPriorities.indexOf(priority);
  return allPriorities[(index + 1) % allPriorities.length];
};

export const TodoScreen = () => {
  const { session, refreshAccess, logout } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');

  const [filters, setFilters] = useState<TodoFilters>({
    status: 'all',
    priority: undefined,
    search: ''
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');

  const latestLoadRequestId = useRef(0);
  const debouncedSearch = useDebouncedValue(filters.search ?? '', 250);

  const effectiveFilters = useMemo<TodoFilters>(
    () => ({
      status: filters.status,
      priority: filters.priority,
      search: debouncedSearch
    }),
    [filters.priority, filters.status, debouncedSearch]
  );

  const runWithAuthRetry = useCallback(
    async <T,>(requester: (token: string) => Promise<T>): Promise<T> => {
      if (!session.accessToken) {
        throw new Error('Missing access token');
      }

      try {
        return await requester(session.accessToken);
      }
      catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 401) {
          const freshToken = await refreshAccess();
          return requester(freshToken);
        }

        throw requestError;
      }
    },
    [refreshAccess, session.accessToken]
  );

  const loadTodos = useCallback(async (): Promise<void> => {
    const requestId = ++latestLoadRequestId.current;
    setError(null);

    try {
      const response = await runWithAuthRetry((token) => todoApi.list(token, effectiveFilters));

      if (requestId === latestLoadRequestId.current) {
        setTodos(response.items);
      }
    }
    catch (loadError) {
      if (requestId === latestLoadRequestId.current) {
        const message = loadError instanceof Error ? loadError.message : 'Failed to load todos';
        setError(message);
      }
    }
  }, [effectiveFilters, runWithAuthRetry]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    void loadTodos().finally(() => {
      if (active) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [loadTodos]);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadTodos();
    setRefreshing(false);
  };

  const upsertTodoInList = useCallback(
    (updatedTodo: Todo): void => {
      setTodos((current) => {
        const withoutCurrent = current.filter((item) => item.id !== updatedTodo.id);

        if (!matchesFilters(updatedTodo, effectiveFilters)) {
          return withoutCurrent;
        }

        return [updatedTodo, ...withoutCurrent];
      });
    },
    [effectiveFilters]
  );

  const createTodo = async (): Promise<void> => {
    if (!title.trim()) {
      return;
    }

    setError(null);

    try {
      const created = await runWithAuthRetry((token) =>
        todoApi.create(token, {
          title: title.trim(),
          description: description.trim() ? description.trim() : null,
          dueDate: normalizeDueDateInput(dueDate),
          priority,
          completed: false
        })
      );

      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('medium');
      upsertTodoInList(created);
    }
    catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Failed to create todo';
      setError(message);
    }
  };

  const toggleTodo = async (todo: Todo): Promise<void> => {
    try {
      const updated = await runWithAuthRetry((token) => todoApi.update(token, todo.id, { completed: !todo.completed }));
      upsertTodoInList(updated);
    }
    catch (toggleError) {
      const message = toggleError instanceof Error ? toggleError.message : 'Failed to update todo';
      setError(message);
    }
  };

  const cycleTodoPriority = async (todo: Todo): Promise<void> => {
    try {
      const updated = await runWithAuthRetry((token) =>
        todoApi.update(token, todo.id, { priority: nextPriority(todo.priority) })
      );
      upsertTodoInList(updated);
    }
    catch (priorityError) {
      const message = priorityError instanceof Error ? priorityError.message : 'Failed to update priority';
      setError(message);
    }
  };

  const deleteTodo = async (todoId: string): Promise<void> => {
    const snapshot = todos;
    setTodos((current) => current.filter((item) => item.id !== todoId));

    try {
      await runWithAuthRetry((token) => todoApi.remove(token, todoId));
    }
    catch (deleteError) {
      setTodos(snapshot);
      const message = deleteError instanceof Error ? deleteError.message : 'Failed to delete todo';
      setError(message);
    }
  };

  const startEdit = (todo: Todo): void => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDescription(todo.description ?? '');
    setEditDueDate(todo.due_date ? todo.due_date.slice(0, 16) : '');
    setEditPriority(todo.priority);
  };

  const saveEdit = async (): Promise<void> => {
    if (!editingId) {
      return;
    }

    try {
      const updated = await runWithAuthRetry((token) =>
        todoApi.update(token, editingId, {
          title: editTitle.trim(),
          description: editDescription.trim() ? editDescription.trim() : null,
          dueDate: normalizeDueDateInput(editDueDate),
          priority: editPriority
        })
      );

      setEditingId(null);
      upsertTodoInList(updated);
    }
    catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Failed to save todo';
      setError(message);
    }
  };

  const stats = useMemo(() => {
    const completed = todos.filter((item) => item.completed).length;
    return {
      total: todos.length,
      active: todos.length - completed,
      completed
    };
  }, [todos]);

  return (
    <View style={styles.screen}>
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.accent} />
        }
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Todo Flight Deck</Text>
                <Text style={styles.subtitle}>@{session.user?.username}</Text>
              </View>
              <Pressable style={styles.logoutButton} onPress={() => void logout()}>
                <Text style={styles.logoutText}>Logout</Text>
              </Pressable>
            </View>

            <View style={styles.statsRow}>
              <Text style={styles.statBox}>Total: {stats.total}</Text>
              <Text style={styles.statBox}>Active: {stats.active}</Text>
              <Text style={styles.statBox}>Done: {stats.completed}</Text>
            </View>

            <View style={styles.composer}>
              <TextInput
                style={styles.input}
                placeholder="Todo title"
                placeholderTextColor={colors.muted}
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                placeholderTextColor={colors.muted}
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="Due date (e.g. 2026-04-21T17:30)"
                placeholderTextColor={colors.muted}
                value={dueDate}
                onChangeText={setDueDate}
              />
              <Pressable style={styles.secondaryButton} onPress={() => setPriority(nextPriority(priority))}>
                <Text style={styles.secondaryButtonText}>Priority: {priority}</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={() => void createTodo()}>
                <Text style={styles.primaryButtonText}>Add Todo</Text>
              </Pressable>

              <View style={styles.filtersRow}>
                {(['all', 'active', 'completed'] as const).map((status) => (
                  <Pressable
                    key={status}
                    style={[styles.filterButton, filters.status === status && styles.filterButtonActive]}
                    onPress={() => setFilters((current) => ({ ...current, status }))}
                  >
                    <Text style={styles.filterButtonText}>{status}</Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Search todos"
                placeholderTextColor={colors.muted}
                value={filters.search}
                onChangeText={(value) => setFilters((current) => ({ ...current, search: value }))}
              />

              <Pressable
                style={styles.secondaryButton}
                onPress={() =>
                  setFilters((current) => ({
                    ...current,
                    priority: current.priority ? nextPriority(current.priority) : 'low'
                  }))
                }
              >
                <Text style={styles.secondaryButtonText}>Filter priority: {filters.priority ?? 'all'}</Text>
              </Pressable>

              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
          </>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>{loading ? 'Loading todos...' : 'No todos found for this filter.'}</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.todoCard}>
            <Pressable onPress={() => void toggleTodo(item)}>
              <Text style={[styles.todoTitle, item.completed && styles.todoDone]}>{item.title}</Text>
            </Pressable>
            <Text style={styles.todoText}>{item.description || 'No description'}</Text>
            <Text style={styles.todoText}>Priority: {item.priority}</Text>
            <Text style={styles.todoText}>Due: {formatDueDate(item.due_date)}</Text>

            {editingId === item.id ? (
              <View style={styles.editCard}>
                <TextInput style={styles.input} value={editTitle} onChangeText={setEditTitle} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  multiline
                />
                <TextInput
                  style={styles.input}
                  value={editDueDate}
                  onChangeText={setEditDueDate}
                  placeholder="YYYY-MM-DDTHH:mm"
                  placeholderTextColor={colors.muted}
                />
                <Pressable style={styles.secondaryButton} onPress={() => setEditPriority(nextPriority(editPriority))}>
                  <Text style={styles.secondaryButtonText}>Edit priority: {editPriority}</Text>
                </Pressable>
                <View style={styles.actionRow}>
                  <Pressable style={styles.primaryButtonSmall} onPress={() => void saveEdit()}>
                    <Text style={styles.primaryButtonText}>Save</Text>
                  </Pressable>
                  <Pressable style={styles.secondaryButtonSmall} onPress={() => setEditingId(null)}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.actionRow}>
                <Pressable style={styles.secondaryButtonSmall} onPress={() => startEdit(item)}>
                  <Text style={styles.secondaryButtonText}>Edit</Text>
                </Pressable>
                <Pressable style={styles.secondaryButtonSmall} onPress={() => void cycleTodoPriority(item)}>
                  <Text style={styles.secondaryButtonText}>Cycle Priority</Text>
                </Pressable>
                <Pressable style={styles.dangerButtonSmall} onPress={() => void deleteTodo(item.id)}>
                  <Text style={styles.dangerText}>Delete</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 14
  },
  listContent: {
    paddingTop: 14,
    paddingBottom: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700'
  },
  subtitle: {
    color: colors.muted
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border
  },
  logoutText: {
    color: colors.text,
    fontWeight: '600'
  },
  statsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  statBox: {
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surface
  },
  composer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    color: colors.text,
    marginBottom: 8,
    backgroundColor: colors.surfaceAlt
  },
  textArea: {
    minHeight: 68,
    textAlignVertical: 'top'
  },
  primaryButton: {
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    paddingVertical: 11,
    marginBottom: 8
  },
  primaryButtonSmall: {
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  primaryButtonText: {
    color: '#03281a',
    fontWeight: '700'
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: 9,
    marginBottom: 8
  },
  secondaryButtonSmall: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: '600'
  },
  dangerButtonSmall: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,111,121,0.15)'
  },
  dangerText: {
    color: colors.danger,
    fontWeight: '700'
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  },
  filterButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 10
  },
  filterButtonActive: {
    backgroundColor: colors.surfaceAlt
  },
  filterButtonText: {
    color: colors.text,
    textTransform: 'capitalize'
  },
  error: {
    color: colors.danger,
    marginBottom: 8
  },
  empty: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 20
  },
  todoCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    backgroundColor: colors.surface
  },
  todoTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700'
  },
  todoDone: {
    color: colors.muted,
    textDecorationLine: 'line-through'
  },
  todoText: {
    color: colors.muted,
    marginTop: 4
  },
  actionRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  editCard: {
    marginTop: 10
  }
});
