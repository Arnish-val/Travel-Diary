import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '@/api/auth.api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,

      setTokens: (accessToken) => set({ accessToken }),

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authApi.register(data);
          set({ user: res.data.user, accessToken: res.data.accessToken, isLoading: false });
          return { success: true };
        } catch (err) {
          const msg = err.response?.data?.message || 'Registration failed';
          set({ error: msg, isLoading: false });
          return { success: false, error: msg };
        }
      },

      login: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authApi.login(data);
          set({ user: res.data.user, accessToken: res.data.accessToken, isLoading: false });
          return { success: true };
        } catch (err) {
          const msg = err.response?.data?.message || 'Login failed';
          set({ error: msg, isLoading: false });
          return { success: false, error: msg };
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch { /* Ignore errors on logout */ }
        set({ user: null, accessToken: null });
      },

      refreshToken: async () => {
        try {
          const res = await authApi.refresh();
          set({ accessToken: res.data.accessToken });
          return res.data.accessToken;
        } catch {
          set({ user: null, accessToken: null });
          return null;
        }
      },

      fetchMe: async () => {
        try {
          const res = await authApi.getMe();
          set({ user: res.data.user });
        } catch {
          set({ user: null, accessToken: null });
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true });
        try {
          const res = await authApi.updateMe(data);
          set({ user: res.data.user, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, error: err.response?.data?.message };
        }
      },

      clearError: () => set({ error: null }),
      isAuthenticated: () => !!get().user && !!get().accessToken,
    }),
    {
      name: 'travel-diary-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    }
  )
);

export default useAuthStore;
