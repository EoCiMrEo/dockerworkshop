const usernamePattern = /^[a-zA-Z0-9_]+$/;

export const validateCredentialsInput = (username: string, password: string): string | null => {
  const normalizedUsername = username.trim();

  if (normalizedUsername.length < 3) {
    return 'Username must be at least 3 characters.';
  }

  if (normalizedUsername.length > 32) {
    return 'Username must be at most 32 characters.';
  }

  if (!usernamePattern.test(normalizedUsername)) {
    return 'Username can include letters, numbers, and underscore only.';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }

  if (password.length > 128) {
    return 'Password must be at most 128 characters.';
  }

  return null;
};

export const normalizeUsername = (username: string): string => username.trim();
