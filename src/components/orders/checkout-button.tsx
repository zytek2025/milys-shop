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
  onLoginRequired?: (config?: { view: 'login' | 'register' | 'summary' | 'guest'; message: string }) => void;
  onOrderComplete?: (orderId: string) => void;
  guestData?: { fullName: string; email: string; whatsapp: string } | null;
}

export function CheckoutButton({ onLoginRequired, onOrderComplete, guestData }: CheckoutButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: cart } = useCart();
  const { isAuthenticated, store_credit, shipping_address } = useAuth();
  const [applyCredit, setApplyCredit] = useState(false);
  const clearCart = useClearCart();

  const handleCheckout = async () => {
    if (!cart) return;

    const hasOnRequestItems = cart.items.some(i => i.on_request || i.custom_metadata?.on_request);

    // Flow for non-authenticated users
    if (!isAuthenticated) {
      if (!hasOnRequestItems) {
        // Standard order requires registration
        onLoginRequired?.({
          view: 'register',
          message: '¡Hola! Antes de terminar, crea tu cuenta rápidamente. Así podrás ver por dónde viene tu paquete en tiempo real.'
        });
        return;
      } else if (!guestData) {
        // Quote request for guest requires contact info
        onLoginRequired?.({
          view: 'summary',
          message: 'Tu pedido incluye artículos bajo presupuesto. Por favor revisa y déjanos tus datos de contacto para enviarte la cotización final. ✨'
        });
        return;
      }
    }

    if (cart.items.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    // Helper to calculate extra price from metadata
    const getExtraPrice = (metadata: any) => {
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
      const base = item.variant?.price_override ?? item.product?.price ?? 0;
      const extra = getExtraPrice(item.custom_metadata);
      return sum + (base + extra) * item.quantity;
    }, 0);

    const usedCredit = (isAuthenticated && applyCredit) ? Math.min(store_credit, cartTotal) : 0;
    const finalStatus = hasOnRequestItems ? 'quote' : 'pending';

    setIsProcessing(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items.map(item => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_name: item.product?.name || 'Producto',
            quantity: item.quantity,
            price: (item.variant?.price_override ?? item.product?.price ?? 0) + getExtraPrice(item.custom_metadata),
            custom_metadata: item.custom_metadata || {},
            on_request: item.on_request || item.custom_metadata?.on_request || false
          })),
          total: cartTotal,
          credit_applied: usedCredit,
          shipping_address: shipping_address || null,
          customer_name: guestData?.fullName,
          customer_email: guestData?.email,
          customer_phone: guestData?.whatsapp
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Error al crear pedido');

      // Success flow
      await clearCart.mutateAsync();
      toast.success('¡Pedido recibido!');
      onOrderComplete?.(result.data.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error en el checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentCartTotal = cart?.items.reduce((sum, item) => {
    const base = item.variant?.price_override ?? item.product?.price ?? 0;
    // Calculation utility (re-implemented here for simplicity in this component)
    const metadata = item.custom_metadata;
    let extra = 0;
    if (Array.isArray(metadata)) {
      extra = metadata.reduce((s: number, d: any) => s + (d.price || 0), 0);
    } else if (metadata && typeof metadata === 'object') {
      const designs = (metadata as any).designs || [];
      const personalization = (metadata as any).personalization;
      extra = (designs.reduce((s: number, d: any) => s + (d.price || 0), 0)) + (personalization?.price || 0);
    }
    return sum + (base + extra) * item.quantity;
  }, 0) || 0;

  if (!isAuthenticated && !cart?.items.some(i => i.on_request || i.custom_metadata?.on_request)) {
    return (
      <Button
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 h-14 rounded-2xl shadow-lg font-black uppercase italic tracking-wider"
        onClick={() => onLoginRequired?.({
          view: 'summary',
          message: '¡Hola! Antes de terminar, revisa tu pedido y crea tu cuenta rápidamente para empezar a rastrearlo.'
        })}
      >
        Continuar con mi pedido
      </Button>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {isAuthenticated && store_credit > 0 && (
        <div className="p-3 border-2 border-primary/20 bg-primary/5 rounded-xl flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Saldo a Favor</span>
            <span className="text-sm font-bold">${store_credit.toFixed(2)} acumulados</span>
          </div>
          <Button
            size="sm"
            variant={applyCredit ? "default" : "outline"}
            className={cn("rounded-lg h-8 text-[10px] font-bold uppercase")}
            onClick={() => setApplyCredit(!applyCredit)}
          >
            {applyCredit ? 'Aplicado' : 'Usar Saldo'}
          </Button>
        </div>
      )}

      <div className="space-y-2 py-2">
        <div className="flex justify-between text-xs font-bold uppercase italic text-muted-foreground px-1">
          <span>{currentCartTotal > 0 ? 'Total Estimado' : 'Subtotal'}</span>
          <span>${currentCartTotal.toFixed(2)}</span>
        </div>
        {isAuthenticated && applyCredit && store_credit > 0 && (
          <div className="flex justify-between text-xs font-bold uppercase italic text-primary px-1">
            <span>Saldo Aplicado</span>
            <span>-${Math.min(store_credit, currentCartTotal).toFixed(2)}</span>
          </div>
        )}
      </div>

      <Button
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 h-14 rounded-2xl shadow-lg font-black uppercase italic tracking-wider transition-all hover:scale-[1.02]"
        onClick={handleCheckout}
        disabled={isProcessing || !cart || cart.items.length === 0}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            {isAuthenticated ? <CreditCard className="h-5 w-5 mr-2" /> : <LogIn className="h-5 w-5 mr-2" />}
            {cart?.items.some(i => i.on_request || i.custom_metadata?.on_request) ? 'Solicitar Presupuesto' : 'Confirmar Pedido'}
          </>
        )}
      </Button>
    </motion.div>
  );
}
