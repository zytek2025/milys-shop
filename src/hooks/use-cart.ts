'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCartSession } from '@/store/cart-store';
import type { CartWithItems, CartItem, Product, ApiResponse } from '@/types';

const API_BASE = '/api';

// Fetch all products
export function useProducts(category?: string) {
  return useQuery<Product[]>({
    queryKey: ['products', category],
    queryFn: async () => {
      const url = category
        ? `${API_BASE}/products?category=${encodeURIComponent(category)}`
        : `${API_BASE}/products`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });
}

// Fetch single product
export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/products/${id}`);
      if (!response.ok) throw new Error('Failed to fetch product');
      return response.json();
    },
    enabled: !!id,
  });
}

// Fetch cart with items
export function useCart() {
  const { sessionId } = useCartSession();

  return useQuery<CartWithItems | null>({
    queryKey: ['cart', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const response = await fetch(`${API_BASE}/cart?sessionId=${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch cart');
      const data = await response.json();
      return data.cart || null;
    },
    enabled: !!sessionId,
  });
}

// Create or get cart
export function useCreateCart() {
  const queryClient = useQueryClient();
  const { setSessionId, sessionId } = useCartSession();

  return useMutation<ApiResponse<{ cartId: string; sessionId: string }>, Error, void>({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (!response.ok) throw new Error('Failed to create cart');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.data?.sessionId) {
        setSessionId(data.data.sessionId);
        queryClient.invalidateQueries({ queryKey: ['cart'] });
      }
    },
  });
}

// Add item to cart
export function useAddToCart() {
  const queryClient = useQueryClient();
  const { sessionId, setSessionId } = useCartSession();

  return useMutation<ApiResponse<CartItem> & { sessionId: string }, Error, { productId: string; quantity?: number; variantId?: string; customMetadata?: any }>({
    mutationFn: async ({ productId, quantity = 1, variantId, customMetadata }) => {
      // Ensure cart exists first
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const cartResponse = await fetch(`${API_BASE}/cart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: null }),
        });
        const cartData = await cartResponse.json();
        currentSessionId = cartData.data?.sessionId;
      }

      const response = await fetch(`${API_BASE}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          productId,
          quantity,
          variantId,
          customMetadata
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add item to cart');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// Update cart item quantity
export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<CartItem>, Error, { itemId: string; quantity: number }>({
    mutationFn: async ({ itemId, quantity }) => {
      const response = await fetch(`${API_BASE}/cart/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) throw new Error('Failed to update cart item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// Remove item from cart
export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<void>, Error, string>({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`${API_BASE}/cart/items/${itemId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove item from cart');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// Clear cart
export function useClearCart() {
  const queryClient = useQueryClient();
  const { sessionId, clearSessionId } = useCartSession();

  return useMutation<ApiResponse<void>, Error, void>({
    mutationFn: async () => {
      if (!sessionId) throw new Error('No session ID');
      const response = await fetch(`${API_BASE}/cart?sessionId=${sessionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to clear cart');
      return response.json();
    },
    onSuccess: () => {
      clearSessionId();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// Calculate cart totals
export function useCartTotals() {
  const { data: cart } = useCart();

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const total = cart?.items.reduce((sum, item) => {
    // Precio base del producto o el override de la variante si existe
    const basePrice = item.variant?.price_override ?? item.product?.price ?? 0;

    // Sumar precio de logos y personalización en custom_metadata
    let extraPrice = 0;
    const metadata = item.custom_metadata;

    if (Array.isArray(metadata)) {
      // Formato antiguo: Array de logos
      extraPrice = metadata.reduce((lSum: number, design: any) => lSum + (design.price || 0), 0);
    } else if (metadata && typeof metadata === 'object') {
      // Nuevo formato: { designs: [], personalization: {} }
      const designs = (metadata as any).designs || [];
      const personalization = (metadata as any).personalization;

      const designsTotal = designs.reduce((lSum: number, d: any) => lSum + (d.price || 0), 0);
      const personalizationTotal = personalization?.price || 0;

      extraPrice = designsTotal + personalizationTotal;
    }

    return sum + (basePrice + extraPrice) * item.quantity;
  }, 0) ?? 0;

  return { itemCount, total };
}
