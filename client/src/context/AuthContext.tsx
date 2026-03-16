import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '../services/api';
import { wsService } from '../services/websocket';

interface Profile {
  id: string;
  name: string;
  email?: string;
  role_type: 'manager' | 'developer';
  specialization: string;
  skills: string[];
}

interface AuthState {
  token: string | null;
  profile: Profile | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    name: string;
    role_type: string;
    specialization?: string;
    skills?: string[];
  }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: localStorage.getItem('token'),
    profile: null,
    isLoading: true,
  });

  const setAuth = (token: string | null, profile: Profile | null) => {
    if (token) {
      localStorage.setItem('token', token);
      api.setToken(token);
      wsService.connect(token);
    } else {
      localStorage.removeItem('token');
      api.setToken(null);
      wsService.disconnect();
    }
    setState({ token, profile, isLoading: false });
  };

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    setAuth(data.token, data.profile);
  };

  const signup = async (signupData: {
    email: string;
    password: string;
    name: string;
    role_type: string;
    specialization?: string;
    skills?: string[];
  }) => {
    await api.signup(signupData);
    // Auto-login after signup
    await login(signupData.email, signupData.password);
  };

  const logout = () => {
    setAuth(null, null);
  };

  const refreshProfile = useCallback(async () => {
    try {
      const data = await api.getMe();
      setState((prev) => ({ ...prev, profile: data.profile }));
    } catch {
      // Ignore
    }
  }, []);

  // Initialize from stored token
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        api.setToken(token);
        try {
          const data = await api.getMe();
          wsService.connect(token);
          setState({ token, profile: data.profile, isLoading: false });
        } catch {
          setAuth(null, null);
        }
      } else {
        setState({ token: null, profile: null, isLoading: false });
      }
    };
    init();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
