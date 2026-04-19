import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { normalizeUsername, validateCredentialsInput } from '../utils/authValidation';

export const AuthPanel = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const validationError = validateCredentialsInput(username, password);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const normalizedUsername = normalizeUsername(username);

      if (mode === 'login') {
        await login(normalizedUsername, password);
      }
      else {
        await register(normalizedUsername, password);
      }
    }
    catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : 'Authentication failed';
      setError(message);
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Immersive Todo</h1>
        <p>Focus on what matters and ship your day with clarity.</p>

        <div className="auth-toggle" role="tablist" aria-label="authentication mode">
          <button
            type="button"
            className={mode === 'login' ? 'is-active' : ''}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'is-active' : ''}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="john_doe"
            minLength={3}
            maxLength={32}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 8 characters"
            minLength={8}
            required
          />

          {error ? <div className="error-banner">{error}</div> : null}

          <button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
};
