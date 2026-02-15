'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import {
  useCart,
  useCartTotals,
  useUpdateCartItem,
  useRemoveFromCart,
  useClearCart
} from '@/hooks/use-cart';
import { useAuth } from '@/store/cart-store';
import { toast } from 'sonner';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginRequired?: () => void;
}

export function CartDrawer({ open, onOpenChange, onLoginRequired }: CartDrawerProps) {
  const { data: cart, isLoading } = useCart();
  const { subtotal, totalDiscount, total, itemCount } = useCartTotals();
  const { isAuthenticated } = useAuth();

  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();
  const clearCart = useClearCart();

  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

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

  const handleOrderComplete = () => {
    onOpenChange(false);
    toast.success('Your order has been placed successfully!');
  };

  const items = cart?.items ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
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
            <ScrollArea className="flex-1 -mx-6 px-6">
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
            </ScrollArea>

            <div className="mt-auto">
              <Separator className="my-4" />

              {/* Auth message for non-logged in users */}
              {!isAuthenticated && (
                <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <LogIn className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Inicia sesión para guardar tu carrito
                    </span>
                  </div>
                </div>
              )}

              {/* Cart Summary */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 font-bold italic">
                    <span className="flex items-center gap-1">✨ Ahorro Especial</span>
                    <span>-${totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Envío</span>
                  <span className="text-emerald-600 font-bold italic tracking-tighter">GRATIS</span>
                </div>
                <Separator className="bg-slate-100 dark:bg-slate-800" />
                <div className="flex justify-between items-center pt-2">
                  <span className="font-black uppercase italic tracking-tighter text-lg">Total Neto</span>
                  <span className="font-black text-2xl tracking-tighter text-primary">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <SheetFooter className="flex-col gap-2 sm:flex-col">
                <CheckoutButton
                  onLoginRequired={onLoginRequired}
                  onOrderComplete={handleOrderComplete}
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
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
