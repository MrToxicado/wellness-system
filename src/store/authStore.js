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
          // authApi already extracted the token into _extractedToken
          const token = data?._extractedToken;
          const user = data?.data?.data?.user || data?.data?.user || data?.user;

          if (token) {
            localStorage.setItem('auth_token', token);
          }

          logger.userAction('login', { email });
          // Always mark as authenticated on 200 response — token may use non-standard field
          set({ token, user, isAuthenticated: true, isLoading: false, error: null, loginTimestamp: Date.now() });
          return { success: true };
        } catch (error) {
          logger.error('Login failed', error);
          set({ isLoading: false, error: error.message || 'Login failed' });
          return { success: false, error: error.message };
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
        // Re-sync token to localStorage on rehydrate
        if (state?.token) {
          localStorage.setItem('auth_token', state.token);
        }
      },
    }
  )
);

export default useAuthStore;
