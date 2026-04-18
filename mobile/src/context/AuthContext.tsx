import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/client';
import type { AuthResponse, User } from '../types/models';

const STORAGE_KEY = 'todo-mobile-session';

interface SessionState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthContextValue {
  session: SessionState;
  ready: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccess: () => Promise<string>;
}

const emptySession: SessionState = {
  user: null,
  accessToken: null,
  refreshToken: null
};

const AuthContext = createContext<AuthContextValue | null>(null);

const fromAuthResponse = (response: AuthResponse): SessionState => ({
  user: response.user,
  accessToken: response.accessToken,
  refreshToken: response.refreshToken
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<SessionState>(emptySession);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async (): Promise<void> => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);

      if (raw) {
        try {
          setSession(JSON.parse(raw) as SessionState);
        }
        catch {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }

      setReady(true);
    };

    void load();
  }, []);

  const persist = async (next: SessionState): Promise<void> => {
    setSession(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const login = async (username: string, password: string): Promise<void> => {
    const response = await authApi.login(username, password);
    await persist(fromAuthResponse(response));
  };

  const register = async (username: string, password: string): Promise<void> => {
    const response = await authApi.register(username, password);
    await persist(fromAuthResponse(response));
  };

  const refreshAccess = async (): Promise<string> => {
    if (!session.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await authApi.refresh(session.refreshToken);
    const next = fromAuthResponse(response);
    await persist(next);
    return next.accessToken ?? '';
  };

  const logout = async (): Promise<void> => {
    if (session.refreshToken) {
      try {
        await authApi.logout(session.refreshToken);
      }
      catch {
        // Ignore logout request failures.
      }
    }

    setSession(emptySession);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      ready,
      isAuthenticated: Boolean(session.user && session.accessToken),
      login,
      register,
      logout,
      refreshAccess
    }),
    [session, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
