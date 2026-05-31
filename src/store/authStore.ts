import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import type { UserRole } from '../types';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null, session: Session | null) => void;
  clearUser: () => void;
  setRole: (role: UserRole | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user, session) =>
    set({
      user,
      session,
      isAuthenticated: user !== null,
    }),

  clearUser: () =>
    set({
      user: null,
      session: null,
      role: null,
      isAuthenticated: false,
    }),

  setRole: (role) => set({ role }),

  setLoading: (loading) => set({ isLoading: loading }),
}));
