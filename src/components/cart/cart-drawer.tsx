'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Trash2, Loader2, LogIn } from 'lucide-react';
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
import { CheckoutInfoForm } from '@/components/orders/checkout-info-form';
import {
  useCart,
  useCartTotals,
  useUpdateCartItem,
  useRemoveFromCart,
  useClearCart
} from '@/hooks/use-cart';
import { useAuth } from '@/store/cart-store';
import { toast } from 'sonner';
import { PriceDisplay } from '@/components/store-settings-provider';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginRequired?: (config?: { view: 'login' | 'register' | 'summary' | 'guest' | 'checkout-info'; message: string }) => void;
  guestData?: { fullName: string; email: string; whatsapp: string } | null;
}

export function CartDrawer({ open, onOpenChange, onLoginRequired, guestData }: CartDrawerProps) {
  const { data: cart, isLoading } = useCart();
  const { total, itemCount, hasOnRequestItems } = useCartTotals();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();
  const clearCart = useClearCart();

  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [showCheckoutInfo, setShowCheckoutInfo] = useState(false);

  const handleLoginRequired = (config?: { view: 'login' | 'register' | 'summary' | 'guest' | 'checkout-info'; message: string }) => {
    if (config?.view === 'checkout-info') {
      setShowCheckoutInfo(true);
      if (config.message) {
        toast.info(config.message);
      }
    } else {
      onLoginRequired?.(config);
    }
  };

  const handleCheckoutInfoSuccess = () => {
    setShowCheckoutInfo(false);
    // Proceed to trigger checkout button logic again now that info is saved
    // Easiest is to simulate clicking it, but we can instruct user to click again or manually re-fire.
    toast.success('¡Listo! Por favor, haz clic nuevamente en Confirmar Pedido para continuar.');
  };

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setUpdatingItemId(itemId);
    try {
      await updateCartItem.mutateAsync({ itemId, quantity });
      toast.success('Quantity updated');
    } catch (error) {
      toast.error('Failed to update quantity');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setRemovingItemId(itemId);
    try {
      await removeFromCart.mutateAsync(itemId);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart.mutateAsync();
      toast.success('Cart cleared');
    } catch (error) {
      toast.error('Failed to clear cart');
    }
  };

  const handleOrderComplete = (orderId: string) => {
    onOpenChange(false);
    toast.success('¡Tu pedido ha sido realizado con éxito!');
    router.push(`/orders/${orderId}`);
  };

  const items = cart?.items ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-md h-full overflow-hidden">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Tu Carrito
          </SheetTitle>
          <SheetDescription>
            {itemCount > 0
              ? `${itemCount} artículo${itemCount !== 1 ? 's' : ''} en tu carrito`
              : 'Tu carrito está vacío'
            }
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/50" />
            <div>
              <p className="text-lg font-medium">Tu carrito está vacío</p>
              <p className="text-sm text-muted-foreground">
                Añade productos para comenzar
              </p>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Seguir Comprando
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
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

              <div className="pb-4">
                <Separator className="my-4" />

                {/* Auth message for non-logged in users */}
                {!isAuthenticated && !showCheckoutInfo && (
                  <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                      <LogIn className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Inicia sesión para guardar tu carrito
                      </span>
                    </div>
                  </div>
                )}

                {showCheckoutInfo ? (
                  <div className="px-1 mt-2">
                    <CheckoutInfoForm
                      onSuccess={handleCheckoutInfoSuccess}
                      onCancel={() => setShowCheckoutInfo(false)}
                    />
                  </div>
                ) : (
                  <>
                    {/* Cart Summary */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <PriceDisplay amount={total} />
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <div className="flex flex-col items-end">
                          <PriceDisplay amount={total} className="flex flex-col items-end leading-none" />
                          {hasOnRequestItems && (
                            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-tight">
                              + Presupuesto de diseño
                            </span>
                          )}
                        </div>
                      </div>

                      {hasOnRequestItems && (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 animate-in fade-in slide-in-from-top-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">Nota de Presupuesto</p>
                          <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-tight italic font-medium">
                            Tu carrito incluye diseños personalizados. El total mostrado es un estimado base; nos contactaremos contigo para darte la cotización final después de realizar el pedido.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>

            <div className="mt-4">
              {/* Action Buttons */}
              {!showCheckoutInfo && (
                <SheetFooter className="flex-col gap-2 sm:flex-col">
                  <CheckoutButton
                    onLoginRequired={handleLoginRequired}
                    onOrderComplete={handleOrderComplete}
                    guestData={guestData}
                  />
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive"
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
                </SheetFooter>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
