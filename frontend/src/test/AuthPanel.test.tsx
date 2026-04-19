import { fireEvent, render, screen, within } from '@testing-library/react';
import { AuthPanel } from '../components/AuthPanel';
import { useAuth } from '../context/AuthContext';

const mockLogin = vi.fn();
const mockRegister = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn()
}));

describe('AuthPanel', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockRegister.mockReset();

    vi.mocked(useAuth).mockReturnValue({
      session: {
        user: null,
        accessToken: null,
        refreshToken: null
      },
      isAuthenticated: false,
      login: mockLogin,
      register: mockRegister,
      logout: vi.fn(),
      refreshSession: vi.fn()
    });
  });

  it('switches between login and register modes', () => {
    render(<AuthPanel />);

    const tabList = screen.getByRole('tablist', { name: 'authentication mode' });

    expect(within(tabList).getByRole('button', { name: 'Login' })).toHaveClass('is-active');

    fireEvent.click(within(tabList).getByRole('button', { name: 'Register' }));

    expect(within(tabList).getByRole('button', { name: 'Register' })).toHaveClass('is-active');
  });

  it('shows local validation feedback for weak passwords', async () => {
    render(<AuthPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'hshhs' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: '12345' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });
});
