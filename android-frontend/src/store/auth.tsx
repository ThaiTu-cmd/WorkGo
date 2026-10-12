import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, UserInfo, LoginResponse } from '@/api/auth';
import { getStoredToken } from '@/api/client';

export interface UserSession {
  userId: string;
  userName: string;
  role: 'CLIENT' | 'PROVIDER' | 'ADMIN';
  userInfo?: UserInfo;
}

interface AuthContextType {
  session: UserSession | null;
  loading: boolean;
  login: (userName: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  login: async () => ({ token: '' }),
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const token = await getStoredToken('wg_at');
      if (!token) {
        setSession(null);
        return;
      }
      const info = await authApi.me();
      setSession({
        userId: info.id,
        userName: info.userName,
        role: info.role,
        userInfo: info,
      });
    } catch {
      setSession(null);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await refreshProfile();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (userName: string, password: string) => {
    const res = await authApi.login(userName, password);
    await refreshProfile();
    return res;
  };

  const logout = async () => {
    await authApi.logout();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useRequireAuth() {
  const context = useContext(AuthContext);
  return context;
}
