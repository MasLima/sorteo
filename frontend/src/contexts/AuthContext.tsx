import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
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
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    loading: true,
  });

  useEffect(() => {
    if (state.token) {
      api.get('/auth/me')
        .then((res) => {
          setState((prev) => ({ ...prev, loading: false, user: res.data }));
        })
        .catch(() => {
          localStorage.removeItem('token');
          setState({ user: null, token: null, loading: false });
        });
    } else {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.accessToken);
    setState({
      user: res.data.user,
      token: res.data.accessToken,
      loading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setState({ user: null, token: null, loading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
