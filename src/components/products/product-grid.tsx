'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
      <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed">
        <h3 className="text-lg font-medium mb-2">No se encontraron productos</h3>
        <p className="text-muted-foreground">Intenta ajustar los filtros o vuelve más tarde.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
