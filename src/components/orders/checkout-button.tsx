'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart, useClearCart } from '@/hooks/use-cart';
import { useAuth } from '@/store/cart-store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CheckoutButtonProps {
  onLoginRequired?: () => void;
  onOrderComplete?: () => void;
}

export function CheckoutButton({ onLoginRequired, onOrderComplete }: CheckoutButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: cart } = useCart();
  const { isAuthenticated, store_credit } = useAuth();
  const [applyCredit, setApplyCredit] = useState(false);
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

    // Calculate total with designs and variants
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

    const cartTotal = cart.items.reduce((sum, item) => {
      const basePrice = item.variant?.price_override ?? item.product?.price ?? 0;
      const extraPrice = calculateExtraPrice(item.custom_metadata);
      return sum + (basePrice + extraPrice) * item.quantity;
    }, 0);

    const usedCredit = applyCredit ? Math.min(store_credit, cartTotal) : 0;

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
              price: base + extra,
              custom_metadata: item.custom_metadata || {},
            };
          }),
          total: cartTotal,
          credit_applied: usedCredit,
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
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 h-12 rounded-xl"
        onClick={() => onLoginRequired?.()}
      >
        <LogIn className="h-4 w-4 mr-2" />
        Inicia sesión para Pagar
      </Button>
    );
  }

  const currentCartTotal = cart?.items.reduce((sum, item) => {
    const base = item.variant?.price_override ?? item.product?.price ?? 0;

    // Robust extra price calculation
    const metadata = item.custom_metadata;
    let extra = 0;
    if (Array.isArray(metadata)) {
      extra = metadata.reduce((s: number, d: any) => s + (d.price || 0), 0);
    } else if (metadata && typeof metadata === 'object') {
      const designs = (metadata as any).designs || [];
      const personalization = (metadata as any).personalization;
      const designsTotal = designs.reduce((s: number, d: any) => s + (d.price || 0), 0);
      const persTotal = personalization?.price || 0;
      extra = designsTotal + persTotal;
    }

    return sum + (base + extra) * item.quantity;
  }, 0) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {store_credit > 0 && (
        <div className="p-3 border-2 border-primary/20 bg-primary/5 rounded-xl flex items-center justify-between gap-3 transition-all hover:bg-primary/10">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Saldo a Favor</span>
            <span className="text-sm font-bold">${store_credit.toFixed(2)} acumulados</span>
          </div>
          <Button
            size="sm"
            variant={applyCredit ? "default" : "outline"}
            className={cn(
              "rounded-lg h-8 text-[10px] font-bold uppercase",
              applyCredit ? "bg-primary" : "border-primary text-primary"
            )}
            onClick={() => setApplyCredit(!applyCredit)}
          >
            {applyCredit ? 'Aplicado' : 'Usar Saldo'}
          </Button>
        </div>
      )}

      <Button
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 h-14 rounded-2xl shadow-lg font-black uppercase italic tracking-wider transition-all hover:scale-[1.02] active:scale-95"
        onClick={handleCheckout}
        disabled={isProcessing || !cart || cart.items.length === 0}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Procesando Pago...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Pagar {applyCredit && store_credit > 0 ? `$${Math.max(0, currentCartTotal - store_credit).toFixed(2)}` : 'Completar Compra'}
          </>
        )}
      </Button>
    </motion.div>
  );
}
