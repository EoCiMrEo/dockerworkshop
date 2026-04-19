import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { AuthScreen } from '../screens/AuthScreen';

const mockLogin = jest.fn();
const mockRegister = jest.fn();

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister
  })
}));

describe('AuthScreen', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockRegister.mockReset();
  });

  it('renders authentication title', () => {
    const { getByText } = render(<AuthScreen />);

    expect(getByText('Immersive Todo Mobile')).toBeTruthy();
  });

  it('shows local validation feedback instead of generic backend validation errors', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<AuthScreen />);

    fireEvent.press(getByText('Register'));
    fireEvent.changeText(getByPlaceholderText('Username'), 'hshhs');
    fireEvent.changeText(getByPlaceholderText('Password'), '12345');
    fireEvent.press(getByText('Create account'));

    expect(await findByText('Password must be at least 8 characters.')).toBeTruthy();
    expect(mockRegister).not.toHaveBeenCalled();
  });
});
