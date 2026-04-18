import { fireEvent, render, screen } from '@testing-library/react';
import { TodoFiltersBar } from '../components/TodoFiltersBar';

describe('TodoFiltersBar', () => {
  it('emits filter changes', () => {
    const onChange = vi.fn();

    render(
      <TodoFiltersBar
        filters={{
          status: 'all',
          search: '',
          priority: undefined
        }}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByLabelText('search todos'), { target: { value: 'docker' } });

    expect(onChange).toHaveBeenCalled();
  });
});
