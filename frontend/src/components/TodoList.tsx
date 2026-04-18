import { useState } from 'react';
import type { Priority, Todo, TodoPayload } from '../types/models';
import { formatDueDate, toLocalInputValue, toUtcIso } from '../utils/date';

interface TodoListProps {
  items: Todo[];
  onUpdate: (todoId: string, payload: Partial<TodoPayload>) => Promise<void>;
  onDelete: (todoId: string) => Promise<void>;
}

interface DraftState {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
}

const priorityClassMap: Record<Priority, string> = {
  low: 'priority-low',
  medium: 'priority-medium',
  high: 'priority-high'
};

export const TodoList = ({ items, onUpdate, onDelete }: TodoListProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const startEditing = (todo: Todo): void => {
    setEditingId(todo.id);
    setDraft({
      title: todo.title,
      description: todo.description ?? '',
      priority: todo.priority,
      dueDate: toLocalInputValue(todo.due_date)
    });
  };

  const cancelEditing = (): void => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEditing = async (todoId: string): Promise<void> => {
    if (!draft) {
      return;
    }

    setBusyId(todoId);

    try {
      await onUpdate(todoId, {
        title: draft.title,
        description: draft.description.trim() ? draft.description.trim() : null,
        priority: draft.priority,
        dueDate: draft.dueDate ? toUtcIso(draft.dueDate) : null
      });
      cancelEditing();
    }
    finally {
      setBusyId(null);
    }
  };

  const toggleCompleted = async (todo: Todo): Promise<void> => {
    setBusyId(todo.id);
    try {
      await onUpdate(todo.id, { completed: !todo.completed });
    }
    finally {
      setBusyId(null);
    }
  };

  const remove = async (todoId: string): Promise<void> => {
    setBusyId(todoId);
    try {
      await onDelete(todoId);
    }
    finally {
      setBusyId(null);
    }
  };

  if (items.length === 0) {
    return <div className="empty-state">No todos match your current filters.</div>;
  }

  return (
    <ul className="todo-list">
      {items.map((todo) => {
        const isEditing = editingId === todo.id;

        return (
          <li key={todo.id} className={`todo-item ${todo.completed ? 'is-completed' : ''}`}>
            <div className="todo-main">
              <input
                type="checkbox"
                aria-label={`toggle ${todo.title}`}
                checked={todo.completed}
                onChange={() => {
                  void toggleCompleted(todo);
                }}
                disabled={busyId === todo.id}
              />

              {isEditing && draft ? (
                <div className="todo-edit-form">
                  <input
                    value={draft.title}
                    onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                    maxLength={120}
                    required
                  />
                  <textarea
                    value={draft.description}
                    onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                    rows={2}
                    maxLength={2000}
                  />
                  <div className="todo-edit-controls">
                    <select
                      value={draft.priority}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          priority: event.target.value as Priority
                        })
                      }
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <input
                      type="datetime-local"
                      value={draft.dueDate}
                      onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="todo-content">
                  <h3>{todo.title}</h3>
                  {todo.description ? <p>{todo.description}</p> : null}
                  <div className="todo-meta">
                    <span className={`priority-pill ${priorityClassMap[todo.priority]}`}>{todo.priority}</span>
                    <span>{formatDueDate(todo.due_date)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="todo-actions">
              {isEditing ? (
                <>
                  <button type="button" onClick={() => void saveEditing(todo.id)} disabled={busyId === todo.id}>
                    Save
                  </button>
                  <button type="button" className="ghost" onClick={cancelEditing}>
                    Cancel
                  </button>
                </>
              ) : (
                <button type="button" className="ghost" onClick={() => startEditing(todo)}>
                  Edit
                </button>
              )}
              <button
                type="button"
                className="danger"
                onClick={() => {
                  void remove(todo.id);
                }}
                disabled={busyId === todo.id}
              >
                Delete
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
