'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Trash2,
  Loader2,
  LogIn,
  Info,
  Gift,
  Star
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CartItemRow } from './cart-item';
import { CheckoutButton } from '@/components/orders/checkout-button';
import {
  useCart,
  useCartTotals,
  useUpdateCartItem,
  useRemoveFromCart,
  useClearCart,
  usePromotions,
  useUserOrders
} from '@/hooks/use-cart';
import { useAuth } from '@/store/cart-store';
import { toast } from 'sonner';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginRequired?: () => void;
}

import { PaymentSelector } from '@/components/orders/payment-selector';

export function CartDrawer({ open, onOpenChange, onLoginRequired }: CartDrawerProps) {
  const { data: cart, isLoading } = useCart();
  const { subtotal, totalDiscount, total: apiTotal, itemCount } = useCartTotals();
  const { data: promotions } = usePromotions();
  const { data: userOrders } = useUserOrders();
  const { isAuthenticated } = useAuth();
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();
  const clearCart = useClearCart();

  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  // Calculate payment discount
  const paymentDiscount = (selectedPayment?.is_discount_active && selectedPayment?.discount_percentage > 0)
    ? apiTotal * (selectedPayment.discount_percentage / 100)
    : 0;

  const finalTotal = apiTotal - paymentDiscount;

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setUpdatingItemId(itemId);
    try {
      await updateCartItem.mutateAsync({ itemId, quantity });
      toast.success('Cantidad actualizada');
    } catch (error) {
      toast.error('Error al actualizar');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setRemovingItemId(itemId);
    try {
      await removeFromCart.mutateAsync(itemId);
      toast.success('Producto eliminado');
    } catch (error) {
      toast.error('Error al eliminar');
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart.mutateAsync();
      toast.success('Carrito vaciado');
    } catch (error) {
      toast.error('Error al vaciar');
    }
  };

  const handleOrderComplete = () => {
    onOpenChange(false);
    toast.success('¡Pedido realizado con éxito!');
  };

  // Loyalty Logic
  const loyaltyPromo = promotions?.find(p => p.type === 'loyalty_reward' && p.is_active);
  const qualifyingOrders = userOrders?.orders?.filter((o: any) => o.total >= (loyaltyPromo?.min_order_value_condition || 0)) || [];
  const orderCount = qualifyingOrders.length;
  const nextMilestone = loyaltyPromo ? Math.ceil((orderCount + 1) / loyaltyPromo.min_orders_required) * loyaltyPromo.min_orders_required : 0;
  const remainingForReward = nextMilestone - orderCount;

  const items = cart?.items ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="flex items-center gap-2 font-black italic uppercase tracking-tighter">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Tu Carrito
          </SheetTitle>
          <SheetDescription className="text-xs uppercase font-bold italic opacity-70">
            {itemCount > 0
              ? `${itemCount} artículo${itemCount !== 1 ? 's' : ''} en tu carrito`
              : 'Tu carrito está vacío'
            }
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-6">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/20" />
            <div>
              <p className="text-lg font-black uppercase italic tracking-tighter">Tu carrito está vacío</p>
              <p className="text-xs text-muted-foreground uppercase font-bold italic">
                Añade productos para comenzar
              </p>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl border-2 font-bold uppercase italic text-xs">
              Seguir Comprando
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                    isUpdating={updatingItemId === item.id}
                    isRemoving={removingItemId === item.id}
                  />
                ))}
              </AnimatePresence>

              {/* Payment Methods Selection */}
              <PaymentSelector
                onSelect={(method) => setSelectedPayment(method)}
                selectedId={selectedPayment?.id}
              />
            </ScrollArea>

            <div className="mt-auto bg-slate-50/80 dark:bg-slate-900/80 p-6 border-t border-slate-100 dark:border-slate-800">
              {/* Loyalty Progress Banner */}
              {isAuthenticated && loyaltyPromo && remainingForReward > 0 && remainingForReward <= 3 && (
                <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-primary text-white shadow-lg shadow-indigo-500/20 border-none relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                    <Star size={48} className="rotate-12" />
                  </div>
                  <div className="flex items-start gap-3 relative z-10">
                    <div className="mt-0.5 bg-white/20 p-2 rounded-xl">
                      <Gift size={18} className="animate-bounce" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase italic tracking-widest opacity-80">Meta de Fidelidad</p>
                      <p className="text-[11px] leading-tight font-bold">
                        {remainingForReward === 1
                          ? '¡Tu PRÓXIMA compra te dará un premio!'
                          : `Solo te faltan ${remainingForReward} compras para tu bono de $${loyaltyPromo.value}`}
                      </p>
                      <div className="w-full h-1.5 bg-white/30 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-white transition-all duration-1000"
                          style={{ width: `${((loyaltyPromo.min_orders_required - (remainingForReward % loyaltyPromo.min_orders_required)) / loyaltyPromo.min_orders_required) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Return Policy Warning */}
              <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-100 dark:border-amber-800/20">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-lg text-amber-600 dark:text-amber-400">
                    <Info size={14} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase italic tracking-tight text-amber-700 dark:text-amber-400">Política de Devoluciones</p>
                    <p className="text-[10px] leading-relaxed font-bold text-amber-700/80 dark:text-amber-400/80">
                      No se hace devolución de dinero, solo cambio por otro producto de igual valor o mayor. Si el producto es de menor valor, quedará el saldo a favor para una próxima compra.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cart Summary */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-[11px] font-bold uppercase text-muted-foreground italic">
                  <span>Subtotal Neto</span>
                  <span className="text-slate-900 dark:text-slate-100">${subtotal.toFixed(2)}</span>
                </div>

                {totalDiscount > 0 && (
                  <div className="flex justify-between text-[11px] text-emerald-600 font-black italic uppercase">
                    <span className="flex items-center gap-1">✨ Oferta Aplicada</span>
                    <span>-${totalDiscount.toFixed(2)}</span>
                  </div>
                )}

                {paymentDiscount > 0 && (
                  <div className="flex justify-between text-[11px] text-primary font-black italic uppercase animate-in slide-in-from-right-2 duration-300">
                    <span className="flex items-center gap-1">💎 Descuento {selectedPayment?.name}</span>
                    <span>-${paymentDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[11px] text-emerald-600 font-black italic uppercase">
                  <span>Envío Priority</span>
                  <span className="tracking-tighter font-black">¡GRATIS!</span>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-3 rounded-2xl border-2 shadow-sm">
                    <span className="font-black uppercase italic tracking-tighter text-sm">Total a Pagar</span>
                    <span className="font-black text-2xl tracking-tighter text-primary">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <CheckoutButton
                  onLoginRequired={onLoginRequired}
                  onOrderComplete={handleOrderComplete}
                  paymentMethodId={selectedPayment?.id}
                  discountAmount={paymentDiscount}
                />
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive rounded-xl border-2 font-bold uppercase italic text-xs h-10"
                  onClick={handleClearCart}
                  disabled={clearCart.isPending}
                >
                  {clearCart.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Vaciar Carrito
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
