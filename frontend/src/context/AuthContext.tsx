import { createContext, useContext, useMemo, useState } from 'react';
import { authApi } from '../api/client';
import type { AuthResponse, User } from '../types/models';

const STORAGE_KEY = 'todo-auth-session';

interface SessionState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthContextValue {
  session: SessionState;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string>;
}

const emptySession: SessionState = {
  user: null,
  accessToken: null,
  refreshToken: null
};

const loadSession = (): SessionState => {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return emptySession;
  }

  try {
    return JSON.parse(stored) as SessionState;
  }
  catch {
    localStorage.removeItem(STORAGE_KEY);
    return emptySession;
  }
};

const saveSession = (state: SessionState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const AuthContext = createContext<AuthContextValue | null>(null);

const persistAuthResponse = (response: AuthResponse): SessionState => ({
  user: response.user,
  accessToken: response.accessToken,
  refreshToken: response.refreshToken
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<SessionState>(() => loadSession());

  const setAndPersist = (nextSession: SessionState): void => {
    setSession(nextSession);
    saveSession(nextSession);
  };

  const login = async (username: string, password: string): Promise<void> => {
    const response = await authApi.login(username, password);
    setAndPersist(persistAuthResponse(response));
  };

  const register = async (username: string, password: string): Promise<void> => {
    const response = await authApi.register(username, password);
    setAndPersist(persistAuthResponse(response));
  };

  const refreshSession = async (): Promise<string> => {
    if (!session.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await authApi.refresh(session.refreshToken);
    const nextSession = persistAuthResponse(response);
    setAndPersist(nextSession);
    return response.accessToken;
  };

  const logout = async (): Promise<void> => {
    if (session.refreshToken) {
      try {
        await authApi.logout(session.refreshToken);
      }
      catch {
        // Ignore remote logout failures and clear local session regardless.
      }
    }

    setSession(emptySession);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session.accessToken && session.user),
      login,
      register,
      logout,
      refreshSession
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
