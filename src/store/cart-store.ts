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

// Add to CartState definition implicitly by extending the store creation
// But since CartState is imported, we should probably update it there or locally cast it if we can't edit types.d.ts easily.
// Let's assume CartState is defined in @/types/index.ts or similar. 
// Wait, the file imports `CartState` from `@/types`. I need to verify that file. 
// If I can't edit it easily, I can extend the interface here if I change the create call.
// `export const useCartStore = create<CartState & { _hasHydrated: boolean; setHasHydrated: (state: boolean) => void }>()(`


export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      sessionId: null,
      userId: null,
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      setSessionId: (id: string) => set({ sessionId: id }),
      clearSessionId: () => set({ sessionId: null }),
      setUserId: (id: string | null) => set({ userId: id }),
      setUser: (user: UserProfile | null) => set({ user, isAuthenticated: !!user, isAdmin: user?.role === 'admin' }),
      setAuthenticated: (auth: boolean) => set({ isAuthenticated: auth }),
      setAdmin: (isAdmin: boolean) => set({ isAdmin }),
      clearAuth: () => set({ userId: null, user: null, isAuthenticated: false, isAdmin: false }),
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: CART_SESSION_KEY,
      partialize: (state) => ({
        sessionId: state.sessionId,
        userId: state.userId,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated?.(true);
      },
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
  const { user, isAuthenticated, userId, isAdmin, setUser, setAuthenticated } = useCartStore();

  return {
    user,
    isAuthenticated,
    userId,
    isAdmin,
    setUser,
    setAuthenticated,
    is_super_admin: user?.is_super_admin || false,
    store_credit: Number(user?.store_credit || 0),
    permissions: user?.permissions || {
      can_manage_prices: false,
      can_view_metrics: false,
      can_manage_users: false,
      can_manage_designs: false,
      can_view_settings: false,
    },
    isLoggedIn: !!user && isAuthenticated,
    isLoading: !useCartStore.getState()._hasHydrated
  };
}
