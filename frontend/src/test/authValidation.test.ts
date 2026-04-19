import { normalizeUsername, validateCredentialsInput } from '../utils/authValidation';

describe('web auth validation', () => {
  it('rejects passwords shorter than backend minimum', () => {
    expect(validateCredentialsInput('valid_user', '12345')).toBe('Password must be at least 8 characters.');
  });

  it('rejects usernames with unsupported characters', () => {
    expect(validateCredentialsInput('bad user', 'password123')).toBe(
      'Username can include letters, numbers, and underscore only.'
    );
  });

  it('trims usernames before submission', () => {
    expect(normalizeUsername('  valid_user  ')).toBe('valid_user');
  });
});
