import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { MeResponse } from '../api/auth';
import { login as apiLogin, register as apiRegister, getMe, logout as apiLogout, refresh as apiRefresh } from '../api/auth';
import { setTokens, getAccessToken, getRefreshToken, setUserInfo, getUserInfo, clearAll } from '../utils/authStorage';

interface AuthContextType {
  user: MeResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<MeResponse>;
  register: (name: string, email: string, password: string) => Promise<MeResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(getUserInfo());
  const [isLoading, setIsLoading] = useState(true);

  // On mount: validate stored token by calling /api/auth/me
  useEffect(() => {
    const validateSession = async () => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const me = await getMe(accessToken);
        setUser(me);
        setUserInfo(me);
      } catch {
        // Token might be expired, try refreshing
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          try {
            const tokens = await apiRefresh(refreshToken);
            setTokens(tokens);
            const me = await getMe(tokens.accessToken);
            setUser(me);
            setUserInfo(me);
          } catch {
            // Refresh also failed — clear everything
            clearAll();
            setUser(null);
          }
        } else {
          clearAll();
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<MeResponse> => {
    const tokens = await apiLogin(email, password);
    setTokens(tokens);
    const me = await getMe(tokens.accessToken);
    setUser(me);
    setUserInfo(me);
    return me;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<MeResponse> => {
    const tokens = await apiRegister(name, email, password);
    setTokens(tokens);
    const me = await getMe(tokens.accessToken);
    setUser(me);
    setUserInfo(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await apiLogout(refreshToken);
      } catch {
        // Ignore logout API errors — we'll clear local state regardless
      }
    }
    clearAll();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
