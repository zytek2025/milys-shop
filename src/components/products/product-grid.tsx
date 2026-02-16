'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { ProductCard } from './product-card';
import type { Product } from '@/types';

interface ProductGridProps {
  products: Product[];
  promotions?: any[]; // Avoiding strict type dependency for now
  isLoading?: boolean;
  isError?: boolean;
  onAddToCart?: (productId: string) => void;
}

export function ProductGrid({
  products,
  promotions = [],
  isError
}: ProductGridProps) {

  const getBestPromotion = (product: Product) => {
    if (!promotions || promotions.length === 0) return null;

    // Filter applicable promotions
    const applicable = promotions.filter(p => {
      if (!p.is_active) return false;
      if (p.target_type === 'all') return true;
      if (p.target_type === 'product' && p.target_id === product.id) return true;
      // Check category match - assuming product.category stores the ID or the logic handles it
      // If product.category is the name map it, but for now strict match
      if (p.target_type === 'category' && p.target_id === product.category) return true;
      return false;
    });

    // Sort by value to give the best offer
    return applicable.sort((a, b) => b.value - a.value)[0];
  };

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Unable to load products at this time.</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-24 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-border">
        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="text-muted-foreground/40" size={32} />
        </div>
        <h3 className="text-2xl font-black tracking-tight mb-2 italic">Sin Tesoros por Ahora</h3>
        <p className="text-muted-foreground max-w-sm mx-auto font-medium">Estamos preparando nuevas sorpresas para ti. Vuelve pronto para descubrir lo último en Mily's.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
      <AnimatePresence mode="popLayout">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            <ProductCard product={product} promotion={getBestPromotion(product)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
