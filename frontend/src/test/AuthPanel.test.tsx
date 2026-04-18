import { fireEvent, render, screen, within } from '@testing-library/react';
import { AuthPanel } from '../components/AuthPanel';
import { AuthProvider } from '../context/AuthContext';

const Wrapper = () => (
  <AuthProvider>
    <AuthPanel />
  </AuthProvider>
);

describe('AuthPanel', () => {
  it('switches between login and register modes', () => {
    render(<Wrapper />);

    const tabList = screen.getByRole('tablist', { name: 'authentication mode' });

    expect(within(tabList).getByRole('button', { name: 'Login' })).toHaveClass('is-active');

    fireEvent.click(within(tabList).getByRole('button', { name: 'Register' }));

    expect(within(tabList).getByRole('button', { name: 'Register' })).toHaveClass('is-active');
  });
});
