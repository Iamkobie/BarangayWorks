import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import type { User, Session } from '@supabase/supabase-js';

const mockUser = { id: 'user-123', email: 'test@example.com' } as User;
const mockSession = { access_token: 'token-abc', user: mockUser } as Session;

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      role: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  it('should have correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.role).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(true);
  });

  it('setUser should set user, session, and isAuthenticated to true', () => {
    useAuthStore.getState().setUser(mockUser, mockSession);
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.session).toEqual(mockSession);
    expect(state.isAuthenticated).toBe(true);
  });

  it('setUser with null should set isAuthenticated to false', () => {
    useAuthStore.getState().setUser(mockUser, mockSession);
    useAuthStore.getState().setUser(null, null);
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('clearUser should reset user, session, role, and isAuthenticated', () => {
    useAuthStore.getState().setUser(mockUser, mockSession);
    useAuthStore.getState().setRole('worker');
    useAuthStore.getState().clearUser();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.role).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('setRole should update the role', () => {
    useAuthStore.getState().setRole('client');
    expect(useAuthStore.getState().role).toBe('client');

    useAuthStore.getState().setRole('worker');
    expect(useAuthStore.getState().role).toBe('worker');

    useAuthStore.getState().setRole('admin');
    expect(useAuthStore.getState().role).toBe('admin');
  });

  it('setRole with null should clear the role', () => {
    useAuthStore.getState().setRole('client');
    useAuthStore.getState().setRole(null);
    expect(useAuthStore.getState().role).toBeNull();
  });

  it('setLoading should update isLoading', () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);

    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });
});
