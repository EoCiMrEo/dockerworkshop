import type { Priority, TodoFilters } from '../types/models';

interface TodoFiltersBarProps {
  filters: TodoFilters;
  onChange: (next: TodoFilters) => void;
}

export const TodoFiltersBar = ({ filters, onChange }: TodoFiltersBarProps) => (
  <div className="todo-filters">
    <input
      aria-label="search todos"
      placeholder="Search by title or description"
      value={filters.search ?? ''}
      onChange={(event) => onChange({ ...filters, search: event.target.value })}
    />

    <select
      aria-label="status filter"
      value={filters.status}
      onChange={(event) =>
        onChange({
          ...filters,
          status: event.target.value as TodoFilters['status']
        })
      }
    >
      <option value="all">All</option>
      <option value="active">Active</option>
      <option value="completed">Completed</option>
    </select>

    <select
      aria-label="priority filter"
      value={filters.priority ?? ''}
      onChange={(event) =>
        onChange({
          ...filters,
          priority: event.target.value ? (event.target.value as Priority) : undefined
        })
      }
    >
      <option value="">All Priorities</option>
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
    </select>
  </div>
);
