import { matchesFilters } from '../utils/todoFilters';
import type { Todo } from '../types/models';

const baseTodo: Todo = {
  id: 'todo-1',
  title: 'Prepare Docker workshop',
  description: 'Update mobile checklist',
  due_date: null,
  priority: 'medium',
  completed: false
};

describe('matchesFilters', () => {
  it('matches by active/completed status', () => {
    expect(matchesFilters(baseTodo, { status: 'active' })).toBe(true);
    expect(matchesFilters(baseTodo, { status: 'completed' })).toBe(false);
  });

  it('matches by priority', () => {
    expect(matchesFilters(baseTodo, { status: 'all', priority: 'medium' })).toBe(true);
    expect(matchesFilters(baseTodo, { status: 'all', priority: 'high' })).toBe(false);
  });

  it('matches by search text across title and description', () => {
    expect(matchesFilters(baseTodo, { status: 'all', search: 'docker' })).toBe(true);
    expect(matchesFilters(baseTodo, { status: 'all', search: 'checklist' })).toBe(true);
    expect(matchesFilters(baseTodo, { status: 'all', search: 'backend' })).toBe(false);
  });
});
