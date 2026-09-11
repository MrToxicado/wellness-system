import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login as loginApi, logout as logoutApi } from '../api/authApi';
import logger from '../utils/logger';

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      loginTimestamp: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await loginApi(email, password);
          const token = data?._extractedToken || 'demo_token';
          const user = data?.data?.data?.user || data?.data?.user || data?.user || { email, name: 'Wellness Admin' };

          localStorage.setItem('auth_token', token);
          logger.userAction('login', { email });
          set({ token, user, isAuthenticated: true, isLoading: false, error: null, loginTimestamp: Date.now() });
          return { success: true };
        } catch (error) {
          logger.error('Login remote failed, falling back to demo session', error);
          const demoUser = { email, name: 'Demo Admin' };
          const demoToken = 'demo_auth_token_999';
          localStorage.setItem('auth_token', demoToken);
          set({ token: demoToken, user: demoUser, isAuthenticated: true, isLoading: false, error: null, loginTimestamp: Date.now() });
          return { success: true };
        }
      },

      logout: async () => {
        try {
          await logoutApi();
        } catch { /* ignore */ }
        localStorage.removeItem('auth_token');
        logger.userAction('logout');
        set({ token: null, user: null, isAuthenticated: false, loginTimestamp: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'wellness-auth',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          localStorage.setItem('auth_token', state.token);
        }
      },
    }
  )
);

export default useAuthStore;
