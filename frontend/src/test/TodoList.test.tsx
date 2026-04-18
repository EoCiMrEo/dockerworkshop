import { render, screen } from '@testing-library/react';
import { TodoList } from '../components/TodoList';

describe('TodoList', () => {
  it('shows empty state when no todos are present', () => {
    render(<TodoList items={[]} onUpdate={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('No todos match your current filters.')).toBeInTheDocument();
  });
});
