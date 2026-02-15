import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartState, UserProfile } from '@/types';

const CART_SESSION_KEY = 'cart-session-id';
const AUTH_KEY = 'auth-state';

interface AuthState {
  userId: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      sessionId: null,
      userId: null,
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      hasHydrated: false,
      setSessionId: (id: string) => set({ sessionId: id }),
      clearSessionId: () => set({ sessionId: null }),
      setUserId: (id: string | null) => set({ userId: id }),
      setUser: (user: UserProfile | null) => set({ user, isAuthenticated: !!user, isAdmin: user?.role === 'admin' }),
      setAuthenticated: (auth: boolean) => set({ isAuthenticated: auth }),
      setAdmin: (isAdmin: boolean) => set({ isAdmin }),
      setHasHydrated: (val: boolean) => set({ hasHydrated: val }),
      clearAuth: () => set({ userId: null, user: null, isAuthenticated: false, isAdmin: false }),
    }),
    {
      name: CART_SESSION_KEY,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        sessionId: state.sessionId,
        userId: state.userId,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin
      }),
    }
  )
);

// Helper function to generate a unique session ID
export function generateSessionId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Hook to get or create a session ID
export function useCartSession() {
  const { sessionId, setSessionId, clearSessionId } = useCartStore();

  const getOrCreateSessionId = () => {
    if (!sessionId) {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      return newSessionId;
    }
    return sessionId;
  };

  return { sessionId, getOrCreateSessionId, setSessionId, clearSessionId };
}

// Auth state management
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      user: null,
      isAuthenticated: false,
    }),
    {
      name: AUTH_KEY,
    }
  )
);

// Combined hook for auth
export function useAuth() {
  const { user, isAuthenticated, userId, isAdmin } = useCartStore();

  return {
    user,
    isAuthenticated,
    userId,
    isAdmin,
    isLoggedIn: !!user && isAuthenticated
  };
}
