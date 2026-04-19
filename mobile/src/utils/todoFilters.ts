import type { Todo, TodoFilters } from '../types/models';

const normalize = (value: string): string => value.trim().toLowerCase();

export const matchesFilters = (todo: Todo, filters: TodoFilters): boolean => {
  if (filters.status === 'active' && todo.completed) {
    return false;
  }

  if (filters.status === 'completed' && !todo.completed) {
    return false;
  }

  if (filters.priority && todo.priority !== filters.priority) {
    return false;
  }

  if (filters.search) {
    const searchValue = normalize(filters.search);

    if (searchValue.length > 0) {
      const haystack = normalize(`${todo.title} ${todo.description ?? ''}`);
      return haystack.includes(searchValue);
    }
  }

  return true;
};
