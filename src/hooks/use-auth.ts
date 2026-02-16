'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '@/store/cart-store';
import type { UserProfile, ApiResponse } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';

const API_BASE = '/api';

// Get current user profile
export function useUser() {
  const { setUser, setAuthenticated } = useCartStore();

  return useQuery<UserProfile | null>({
    queryKey: ['user'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setUser(null);
        setAuthenticated(false);
        return null;
      }

      const response = await fetch(`${API_BASE}/auth/profile`);
      if (!response.ok) {
        setUser(null);
        setAuthenticated(false);
        return null;
      }

      const profile = await response.json();
      setUser(profile);
      setAuthenticated(true);
      return profile;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Login mutation
export function useLogin() {
  const queryClient = useQueryClient();
  const { setUser, setAuthenticated } = useCartStore();

  return useMutation<ApiResponse<UserProfile>, Error, { email: string; password: string }>({
    mutationFn: async ({ email, password }) => {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Login failed');
      }

      // Get profile
      const profileResponse = await fetch(`${API_BASE}/auth/profile`);
      if (!profileResponse.ok) {
        throw new Error('No se pudo cargar el perfil del usuario');
      }
      const profile = await profileResponse.json();

      return { data: profile };
    },
    onSuccess: (data) => {
      if (data.data) {
        setUser(data.data);
        setAuthenticated(true);
      }
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// Register mutation
export function useRegister() {
  const queryClient = useQueryClient();
  const { setUser, setAuthenticated } = useCartStore();

  return useMutation<ApiResponse<UserProfile>, Error, { email: string; password: string; fullName: string; whatsapp: string }>({
    mutationFn: async ({ email, password, fullName, whatsapp }) => {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            whatsapp: whatsapp,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Registro fallido');
      }

      // Wait a bit for the trigger to create profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get profile
      const profileResponse = await fetch(`${API_BASE}/auth/profile`);
      if (!profileResponse.ok) {
        throw new Error('Perfil creado, pero hubo un error al sincronizar. Por favor inicia sesión.');
      }
      const profile = await profileResponse.json();

      return { data: profile };
    },
    onSuccess: (data) => {
      if (data.data) {
        setUser(data.data);
        setAuthenticated(true);
      }
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// Logout mutation
export function useLogout() {
  const queryClient = useQueryClient();
  const { clearAuth } = useCartStore();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      clearAuth();
      queryClient.removeQueries();
    },
  });
}

// Hook to check auth state on mount
export function useAuthCheck() {
  const { setUser, setAuthenticated, isAuthenticated } = useCartStore();

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          try {
            const response = await fetch(`${API_BASE}/auth/profile`);
            if (response.ok) {
              const profile = await response.json();
              setUser(profile);
              setAuthenticated(true);
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
          }
        }
      }
    };

    checkAuth();
  }, [isAuthenticated, setUser, setAuthenticated]);
}

// Update password mutation
export function useUpdatePassword() {
  return useMutation<void, Error, { password: string }>({
    mutationFn: async ({ password }) => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw new Error(error.message);
      }
    },
  });
}

// Request password reset mutation
export function useResetPassword() {
  return useMutation<void, Error, { email: string }>({
    mutationFn: async ({ email }) => {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw new Error(error.message);
      }
    },
  });
}
