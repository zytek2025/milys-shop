'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartTotals, useAddToCart } from '@/hooks/use-cart';
import { useAuth, useCartStore } from '@/store/cart-store';
import { SearchBar } from '@/components/search/search-bar';
import { AuthModal } from '@/components/auth/auth-modal';
import { UserMenu } from '@/components/auth/user-menu';
import { OrderHistory } from '@/components/orders/order-history';
import { toast } from 'sonner';
import type { Product } from '@/types';

interface HeaderProps {
  onCartClick: () => void;
  onSearchProductClick?: (product: Product) => void;
}

export function Header({ onCartClick, onSearchProductClick }: HeaderProps) {
  const { itemCount } = useCartTotals();
  const { isAuthenticated } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const addToCart = useAddToCart();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSearchProductClick = async (product: Product) => {
    if (onSearchProductClick) {
      onSearchProductClick(product);
    }

    // Also add to cart
    try {
      await addToCart.mutateAsync({ productId: product.id, quantity: 1 });
      toast.success(`Added ${product.name} to cart!`);
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0 hover:opacity-80 transition-opacity group">
            <div className="h-12 w-12 flex items-center justify-center p-1.5 bg-white rounded-2xl shadow-sm border border-lavanda/50 group-hover:scale-110 transition-transform duration-500">
              <svg viewBox="0 0 150 120" className="w-full h-full fill-none">
                <defs>
                  <linearGradient id="threadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#E6E6FA" />
                    <stop offset="100%" stopColor="#D8D8F0" />
                  </linearGradient>
                </defs>
                {/* Needle Body */}
                <path d="M105 90 L115 10" stroke="#B8B8B8" strokeWidth="2" strokeLinecap="round" />
                <path d="M115 10 L112 5 Q115 0 118 5 L115 10" fill="#B8B8B8" /> {/* Needle Head */}
                <circle cx="115" cy="8" r="1.5" fill="white" /> {/* Needle Eye */}

                {/* Styled M (Thread) */}
                <path
                  d="M30 90 L50 25 L75 60 L100 25 L115 8"
                  stroke="url(#threadGradient)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M50 25 Q 75 -10 100 25" stroke="#C1E1C1" strokeWidth="3" strokeDasharray="3,3" />

                {/* Cosmetic drop */}
                <path d="M75 105 Q 85 105 85 95 Q 85 85 75 75 Q 65 85 65 95 Q 65 105 75 105 Z" fill="#ECD5D5" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-serif font-light tracking-[0.1em] text-foreground leading-none">
                Mily's
              </span>
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-slate-400">
                Shop
              </span>
            </div>
          </Link>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 justify-center">
            <SearchBar onProductClick={handleSearchProductClick} />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Admin Link */}
            <Link
              href="/admin"
              className="hidden sm:flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors border border-muted px-3 py-1.5 rounded-full hover:border-primary/50"
            >
              Admin
            </Link>

            {/* User Menu or Login Button - Guarded by isMounted to avoid hydration flash */}
            {isMounted && (
              isAuthenticated ? (
                <UserMenu onOrdersClick={() => setIsOrderHistoryOpen(true)} />
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Iniciar Sesión</span>
                </Button>
              )
            )}

            {/* Cart Button */}
            <Button
              variant="outline"
              size="icon"
              className="relative"
              onClick={onCartClick}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-emerald-600">
                  {itemCount > 99 ? '99+' : itemCount}
                </Badge>
              )}
              <span className="sr-only">Abrir carrito</span>
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3">
          <SearchBar onProductClick={handleSearchProductClick} />
        </div>
      </header >

      {/* Auth Modal */}
      < AuthModal
        open={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
      />

      {/* Order History Modal */}
      < OrderHistory
        open={isOrderHistoryOpen}
        onOpenChange={setIsOrderHistoryOpen}
      />
    </>
  );
}
