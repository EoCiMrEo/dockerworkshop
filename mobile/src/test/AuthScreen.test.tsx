import React from 'react';
import { render } from '@testing-library/react-native';
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
  it('renders authentication title', () => {
    const { getByText } = render(<AuthScreen />);

    expect(getByText('Immersive Todo Mobile')).toBeTruthy();
  });
});
