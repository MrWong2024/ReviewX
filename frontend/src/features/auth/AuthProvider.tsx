'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError } from '@/src/lib/api/errors';
import { clearSelectedRole } from './roleStorage';
import type { CurrentUser, LoginInput, SmsLoginInput } from './types';
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  smsLogin as smsLoginRequest,
} from './api';

type AuthContextValue = {
  loading: boolean;
  login: (input: LoginInput) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<CurrentUser | null>;
  setUser: (user: CurrentUser | null) => void;
  smsLogin: (input: SmsLoginInput) => Promise<CurrentUser>;
  user: CurrentUser | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);

  const refresh = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
        return null;
      }

      throw error;
    }
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [refresh]);

  const login = useCallback(async (input: LoginInput) => {
    const nextUser = await loginRequest(input);
    setUser(nextUser);
    return nextUser;
  }, []);

  const smsLogin = useCallback(async (input: SmsLoginInput) => {
    const nextUser = await smsLoginRequest(input);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearSelectedRole();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      loading,
      login,
      logout,
      refresh,
      setUser,
      smsLogin,
      user,
    }),
    [loading, login, logout, refresh, smsLogin, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
