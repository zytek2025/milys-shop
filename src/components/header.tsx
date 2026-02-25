'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, LogIn, Palette, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartTotals, useAddToCart } from '@/hooks/use-cart';
import { useAuth, useCartStore } from '@/store/cart-store';
import { SearchBar } from '@/components/search/search-bar';
import { UserMenu } from '@/components/auth/user-menu';
import { toast } from 'sonner';
import type { Product } from '@/types';

interface HeaderProps {
  onCartClick: () => void;
  onLoginClick: () => void;
  onOrdersClick: () => void;
  onSearchProductClick?: (product: Product) => void;
}

export function Header({
  onCartClick,
  onLoginClick,
  onOrdersClick,
  onSearchProductClick
}: HeaderProps) {
  const { itemCount } = useCartTotals();
  const { isAuthenticated } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasActivePromotions, setHasActivePromotions] = useState(false);
  const addToCart = useAddToCart();

  useEffect(() => {
    setIsMounted(true);

    // Check for active promotions
    fetch('/api/promotions/active')
      .then(res => res.json())
      .then(data => setHasActivePromotions(!!data.hasActivePromotions))
      .catch(() => setHasActivePromotions(false));
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
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background transition-all duration-300 shadow-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-6 gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 flex-shrink-0 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-secondary rounded-2xl blur-sm opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative h-14 w-14 flex items-center justify-center p-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-primary/20 group-hover:border-primary/50 group-hover:scale-110 transition-all duration-500" style={{ width: '3.5rem', height: '3.5rem' }}>
                <svg viewBox="0 0 150 120" className="w-full h-full fill-none" width="56" height="56">
                  <defs>
                    <linearGradient id="threadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(var(--secondary))" />
                    </linearGradient>
                  </defs>
                  {/* Needle Body */}
                  <path d="M105 90 L115 10" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
                  <path d="M115 10 L112 5 Q115 0 118 5 L115 10" fill="hsl(var(--primary))" />
                  <circle cx="115" cy="8" r="1.5" fill="white" />

                  {/* Styled M (Thread) */}
                  <path
                    d="M30 90 L50 25 L75 60 L100 25 L115 8"
                    stroke="url(#threadGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M50 25 Q 75 -10 100 25" stroke="hsl(var(--secondary))" strokeWidth="3" strokeDasharray="3,3" opacity="0.5" />

                  {/* Cosmetic drop */}
                  <path d="M75 105 Q 85 105 85 95 Q 85 85 75 75 Q 65 85 65 95 Q 65 105 75 105 Z" fill="hsl(var(--primary))" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-serif font-black tracking-tighter text-foreground leading-none">
                Mily's
              </span>
              <span className="text-[10px] font-sans font-black uppercase tracking-[0.4em] text-primary">
                Premium Shop
              </span>
            </div>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-bold hover:text-primary transition-colors">Tienda</Link>
            {hasActivePromotions && (
              <Link href="/offers" className="text-sm font-bold hover:text-primary transition-colors animate-in fade-in slide-in-from-left-2 transition-all">
                Ofertas
              </Link>
            )}
            <button
              onClick={() => isAuthenticated ? onOrdersClick() : onLoginClick()}
              className="text-sm font-bold hover:text-primary transition-colors"
            >
              Mis Pedidos
            </button>
          </nav>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden lg:flex flex-1 max-w-2xl justify-center">
            <SearchBar onProductClick={handleSearchProductClick} />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {isMounted && (
              isAuthenticated ? (
                <UserMenu onOrdersClick={onOrdersClick} />
              ) : (
                <Button
                  variant="ghost"
                  onClick={onLoginClick}
                  className="gap-2 rounded-2xl hover:bg-slate-100"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline font-bold">Entrar</span>
                </Button>
              )
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-2xl h-12 w-12 hover:bg-slate-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>

            {/* Cart Button */}
            <Button
              variant="default"
              size="icon"
              className="relative shadow-xl shadow-primary/20 rounded-2xl h-12 w-12"
              onClick={onCartClick}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center text-[10px] font-black bg-emerald-500 border-2 border-primary shadow-lg ring-2 ring-primary/20">
                  {itemCount > 99 ? '99+' : itemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="lg:hidden px-6 pb-4">
          <SearchBar onProductClick={handleSearchProductClick} />
        </div>

        {/* Mobile Navigation Drawer */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md md:hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col h-full p-8">
              <div className="flex items-center justify-between mb-12">
                <span className="text-2xl font-serif font-black tracking-tighter italic">Menu</span>
                <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12" onClick={() => setIsMenuOpen(false)}>
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <nav className="flex flex-col gap-8">
                <Link
                  href="/"
                  className="text-3xl font-black uppercase tracking-widest hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Tienda
                </Link>
                {hasActivePromotions && (
                  <Link
                    href="/offers"
                    className="text-3xl font-black uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-4"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Ofertas <Badge className="bg-primary text-white text-[10px]">Hot</Badge>
                  </Link>
                )}
                <button
                  onClick={() => {
                    isAuthenticated ? onOrdersClick() : onLoginClick();
                    setIsMenuOpen(false);
                  }}
                  className="text-3xl font-black uppercase tracking-widest hover:text-primary transition-colors text-left"
                >
                  Mis Pedidos
                </button>
              </nav>

              <div className="mt-auto pt-10 border-t border-border/10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4">Mily's Premium Shop</p>
                <div className="flex gap-4">
                  {/* Reuse some icons/links if needed */}
                </div>
              </div>
            </div>
          </div>
        )}
      </header >
    </>
  );
}
