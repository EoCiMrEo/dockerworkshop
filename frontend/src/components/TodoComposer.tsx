import { useState } from 'react';
import type { Priority, TodoPayload } from '../types/models';
import { toUtcIso } from '../utils/date';

interface TodoComposerProps {
  onSubmit: (payload: TodoPayload) => Promise<void>;
}

export const TodoComposer = ({ onSubmit }: TodoComposerProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    setSaving(true);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        priority,
        dueDate: dueDate ? toUtcIso(dueDate) : null,
        completed: false
      });

      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
    }
    finally {
      setSaving(false);
    }
  };

  return (
    <form className="todo-composer" onSubmit={handleSubmit}>
      <div className="composer-row">
        <input
          aria-label="todo title"
          placeholder="What needs to be done next?"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          required
        />
        <button type="submit" disabled={saving}>
          {saving ? 'Adding...' : 'Add Todo'}
        </button>
      </div>

      <div className="composer-row composer-row-secondary">
        <textarea
          aria-label="todo description"
          placeholder="Optional details"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          maxLength={2000}
        />

        <select
          aria-label="priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value as Priority)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <input
          aria-label="due date"
          type="datetime-local"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
      </div>
    </form>
  );
};
