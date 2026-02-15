'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart, useClearCart } from '@/hooks/use-cart';
import { useAuth, useCartSession } from '@/store/cart-store';
import { toast } from 'sonner';

interface CheckoutButtonProps {
  onLoginRequired?: () => void;
  onOrderComplete?: () => void;
}

export function CheckoutButton({ onLoginRequired, onOrderComplete }: CheckoutButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: cart } = useCart();
  const { sessionId, clearSessionId } = useCartSession();
  const { isAuthenticated } = useAuth();
  const clearCart = useClearCart();

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      onLoginRequired?.();
      return;
    }

    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Calculate total with designs and variants (Robust handling of metadata)
    const calculateExtraPrice = (metadata: any) => {
      let extra = 0;
      if (Array.isArray(metadata)) {
        extra = metadata.reduce((sum: number, d: any) => sum + (d.price || 0), 0);
      } else if (metadata && typeof metadata === 'object') {
        const designs = (metadata as any).designs || [];
        const personalization = (metadata as any).personalization;
        const designsTotal = designs.reduce((sum: number, d: any) => sum + (d.price || 0), 0);
        const persTotal = personalization?.price || 0;
        extra = designsTotal + persTotal;
      }
      return extra;
    };

    const total = cart.items.reduce((sum, item) => {
      const basePrice = item.variant?.price_override ?? item.product?.price ?? 0;
      const extraPrice = calculateExtraPrice(item.custom_metadata);
      return sum + (basePrice + extraPrice) * item.quantity;
    }, 0);

    setIsProcessing(true);
    try {
      // Create order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items.map(item => {
            const base = item.variant?.price_override ?? item.product?.price ?? 0;
            const extra = calculateExtraPrice(item.custom_metadata);
            return {
              product_id: item.product_id,
              variant_id: item.variant_id,
              product_name: item.product?.name || 'Unknown Product',
              quantity: item.quantity,
              price: base + extra, // Guardar el precio total calculado por UNIDAD
              custom_metadata: item.custom_metadata || {},
            };
          }),
          total,
        }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        throw new Error(error.error || 'Failed to create order');
      }

      // Clear cart
      await clearCart.mutateAsync();

      toast.success('Order placed successfully!');
      onOrderComplete?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Checkout failed';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Button
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
        onClick={() => onLoginRequired?.()}
      >
        <LogIn className="h-4 w-4 mr-2" />
        Inicia sesión para Pagar
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Button
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
        onClick={handleCheckout}
        disabled={isProcessing || !cart || cart.items.length === 0}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Completar Compra
          </>
        )}
      </Button>
    </motion.div>
  );
}
