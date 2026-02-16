'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { ProductCard } from './product-card';
import type { Product } from '@/types';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  isError?: boolean;
  onAddToCart?: (productId: string) => void; // Deprecated but kept for compatibility if needed
}

export function ProductGrid({
  products,
  isError
}: ProductGridProps) {

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Unable to load products at this time.</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-24 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-border/50">
        <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
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
            <ProductCard product={product} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
