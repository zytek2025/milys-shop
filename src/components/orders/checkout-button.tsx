'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart, useClearCart } from '@/hooks/use-cart';
import { useAuth } from '@/store/cart-store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PaymentSelector } from './payment-selector';

interface CheckoutButtonProps {
  onLoginRequired?: (config?: { view: 'login' | 'register' | 'summary'; message: string }) => void;
  onOrderComplete?: (orderId: string) => void;
}

export function CheckoutButton({ onLoginRequired, onOrderComplete }: CheckoutButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: cart } = useCart();
  const { isAuthenticated, store_credit, shipping_address } = useAuth();
  const [applyCredit, setApplyCredit] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
  const clearCart = useClearCart();

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      onLoginRequired?.({
        view: 'register',
        message: '¡Hola! Antes de terminar, crea tu cuenta rápidamente. Así podrás ver por dónde viene tu paquete en tiempo real y recibir avisos de tu pedido directamente.'
      });
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
    const paymentDiscount = selectedPaymentMethod?.is_discount_active
      ? (cartTotal - usedCredit) * (selectedPaymentMethod.discount_percentage / 100)
      : 0;

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
          payment_method_id: null,
          payment_discount_amount: 0,
          shipping_address: shipping_address || null
        }),
      });

      const data = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(data.error || 'Error al crear pedido');
      }

      const orderId = data.data.id;

      // Trigger n8n webhook with order data (Fire and forget)
      try {
        fetch('/api/marketing/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'NEW_ORDER',
            order: {
              id: orderId,
              total: cartTotal,
              credit_applied: usedCredit,
              payment_discount: paymentDiscount,
              items_count: cart.items.length,
              items: cart.items.map(item => ({
                name: item.product?.name || 'Producto',
                quantity: item.quantity,
                price: item.variant?.price_override ?? item.product?.price ?? 0,
              })),
              createdAt: new Date().toISOString()
            }
          })
        });
      } catch (e) {
        console.error('Order webhook error:', e);
      }

      // Clear cart
      await clearCart.mutateAsync();

      toast.success('¡Pedido realizado con éxito!');
      onOrderComplete?.(orderId);
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
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 h-14 rounded-2xl shadow-lg font-black uppercase italic tracking-wider transition-all hover:scale-[1.02] active:scale-95"
        onClick={() => onLoginRequired?.({
          view: 'summary',
          message: '¡Hola! Antes de terminar, revisa tu pedido y crea tu cuenta rápidamente para empezar a rastrearlo.'
        })}
      >
        Continuar con mi pedido
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

      <div className="space-y-2 py-2">
        <div className="flex justify-between text-xs font-bold uppercase italic text-muted-foreground px-1">
          <span>Subtotal</span>
          <span>${currentCartTotal.toFixed(2)}</span>
        </div>
        {applyCredit && store_credit > 0 && (
          <div className="flex justify-between text-xs font-bold uppercase italic text-primary px-1">
            <span>Saldo Aplicado</span>
            <span>-${Math.min(store_credit, currentCartTotal).toFixed(2)}</span>
          </div>
        )}
      </div>

      <Button
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 h-14 rounded-2xl shadow-lg font-black uppercase italic tracking-wider transition-all hover:scale-[1.02] active:scale-95"
        onClick={handleCheckout}
        disabled={isProcessing || !cart || cart.items.length === 0}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Procesando Pedido...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Confirmar Pedido
          </>
        )}
      </Button>
    </motion.div>
  );
}
