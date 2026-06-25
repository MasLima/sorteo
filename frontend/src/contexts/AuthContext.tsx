import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  permissions: string[];
  userId: string;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    loading: true,
    permissions: [],
    userId: '',
  });

  const fetchMe = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setState((prev) => ({
        ...prev,
        loading: false,
        userId: res.data.userId,
        permissions: res.data.permissions || [],
        user: { id: res.data.userId, name: res.data.name || '', email: '', role: res.data.role },
      }));
    } catch {
      localStorage.removeItem('token');
      setState({ user: null, token: null, loading: false, permissions: [], userId: '' });
    }
  }, []);

  useEffect(() => {
    if (state.token) {
      fetchMe();
    } else {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [state.token, fetchMe]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.accessToken);
    setState((prev) => ({
      ...prev,
      loading: false,
      token: res.data.accessToken,
      user: res.data.user,
      permissions: res.data.permissions || [],
      userId: res.data.user?.id || '',
    }));
  };

  const logout = () => {
    localStorage.removeItem('token');
    setState({ user: null, token: null, loading: false, permissions: [], userId: '' });
  };

  const hasPermission = (perm: string) => state.permissions.includes(perm);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}