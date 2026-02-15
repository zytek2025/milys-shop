'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCartSession } from '@/store/cart-store';
import type { CartWithItems, CartItem, Product, ApiResponse, Promotion } from '@/types';

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

// Fetch user order history/count
export function useUserOrders() {
  return useQuery({
    queryKey: ['orders', 'count'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/orders/count`);
      if (!response.ok) return { count: 0, orders: [] };
      return response.json();
    },
  });
}

// Fetch active promotions
export function usePromotions() {
  return useQuery<Promotion[]>({
    queryKey: ['promotions', 'active'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/admin/promotions`);
      if (!response.ok) throw new Error('Failed to fetch promotions');
      return response.json();
    },
  });
}

// Calculate cart totals
export function useCartTotals() {
  const { data: cart } = useCart();
  const { data: promotions } = usePromotions();

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const subtotal = cart?.items.reduce((sum, item) => {
    const basePrice = item.variant?.price_override ?? item.product?.price ?? 0;
    let extraPrice = 0;
    const metadata = item.custom_metadata;

    if (Array.isArray(metadata)) {
      extraPrice = metadata.reduce((lSum: number, design: any) => lSum + (design.price || 0), 0);
    } else if (metadata && typeof metadata === 'object') {
      const designs = (metadata as any).designs || [];
      const personalization = (metadata as any).personalization;
      const designsTotal = designs.reduce((lSum: number, d: any) => lSum + (d.price || 0), 0);
      const personalizationTotal = personalization?.price || 0;
      extraPrice = designsTotal + personalizationTotal;
    }

    return sum + (basePrice + extraPrice) * item.quantity;
  }, 0) ?? 0;

  // Apply discounts
  let totalDiscount = 0;
  const activePromos = promotions?.filter(p => p.is_active) || [];
  const { data: userHistory } = useUserOrders();
  const userOrderCount = userHistory?.count || 0;
  const userValidOrders = userHistory?.orders || [];

  cart?.items.forEach(item => {
    const itemPrice = (item.variant?.price_override ?? item.product?.price ?? 0);
    const unitPrice = itemPrice + (item.custom_metadata?.designs?.reduce((s: number, d: any) => s + (d.price || 0), 0) || 0) + (item.custom_metadata?.personalization?.price || 0);

    activePromos.forEach(promo => {
      // 1. Check target (all, category, product)
      let applies = false;
      if (promo.target_type === 'all') applies = true;
      else if (promo.target_type === 'category' && item.product?.category === promo.target_id) applies = true;
      else if (promo.target_type === 'product' && item.product_id === promo.target_id) applies = true;

      if (!applies) return;

      // 2. Check loyalty (min orders)
      if (promo.min_orders_required > 0) {
        if (userOrderCount < promo.min_orders_required) return;

        // 3. Check min order value condition if exists
        if (promo.min_order_value_condition > 0) {
          const qualifyingOrders = userValidOrders.filter((o: any) => o.total >= promo.min_order_value_condition);
          if (qualifyingOrders.length < promo.min_orders_required) return;
        }
      }

      // 4. Check min quantity in current cart
      if (item.quantity >= promo.min_quantity) {
        if (promo.type === 'bogo') {
          const freeUnits = Math.floor(item.quantity / 2);
          totalDiscount += freeUnits * unitPrice;
        } else if (promo.type === 'second_unit_50') {
          const discountedUnits = Math.floor(item.quantity / 2);
          totalDiscount += discountedUnits * (unitPrice * 0.5);
        } else if (promo.type === 'percentage') {
          totalDiscount += (unitPrice * item.quantity) * (promo.value / 100);
        } else if (promo.type === 'fixed') {
          totalDiscount += promo.value * Math.floor(item.quantity / promo.min_quantity);
        } else if (promo.type === 'gift') {
          // If the item itself IS the reward product, it's free (100% discount)
          // Or if we should handle it as a separate item, this logic might need adjustment
          if (item.product_id === promo.reward_product_id) {
            totalDiscount += unitPrice * item.quantity;
          }
        }
      }
    });
  });

  const total = Math.max(0, subtotal - totalDiscount);

  return { itemCount, subtotal, totalDiscount, total };
}
