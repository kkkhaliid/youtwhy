import { create } from 'zustand';
import api from '../utils/api';

export interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  register: (username: string, email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Safe SSR check for localStorage
  const getInitialToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('waveflow_auth_token');
    }
    return null;
  };

  const initialToken = getInitialToken();

  return {
    user: null,
    token: initialToken,
    isAuthenticated: !!initialToken,
    isLoading: false,
    error: null,

    register: async (username, email, password) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post('/auth/register', { username, email, password });
        const { token, user } = response.data;
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('waveflow_auth_token', token);
        }
        
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } catch (err: any) {
        const errMsg = err.response?.data?.error || 'Registration failed. Please try again.';
        set({ isLoading: false, error: errMsg });
        return false;
      }
    },

    login: async (email, password) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post('/auth/login', { email, password });
        const { token, user } = response.data;

        if (typeof window !== 'undefined') {
          localStorage.setItem('waveflow_auth_token', token);
        }

        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } catch (err: any) {
        const errMsg = err.response?.data?.error || 'Invalid email or password.';
        set({ isLoading: false, error: errMsg });
        return false;
      }
    },

    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('waveflow_auth_token');
      }
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    },

    fetchMe: async () => {
      const currentToken = useAuthStore.getState().token;
      if (!currentToken) return;

      set({ isLoading: true, error: null });
      try {
        const response = await api.get('/auth/me');
        const { user } = response.data;
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (err: any) {
        // Clear auth state on fetch failure (expired token)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('waveflow_auth_token');
        }
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    },

    clearError: () => set({ error: null }),
  };
});

export default useAuthStore;
