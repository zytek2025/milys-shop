'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAddToCart } from '@/hooks/use-cart';
import { toast } from 'sonner';
import { ShoppingCart, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  promotion?: any;
}

export function ProductCard({ product, promotion }: ProductCardProps) {
  const addToCart = useAddToCart();
  const [isAdding, setIsAdding] = useState(false);

  // Calculate price range and stock from variants
  const variants = product.product_variants || [];
  const prices = [product.price, ...variants.map(v => v.price_override).filter(p => p !== null)] as number[];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const hasMultiplePrices = minPrice !== maxPrice;

  const totalStock = variants.length > 0
    ? variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    : (product.stock || 0);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addToCart.mutateAsync({ productId: product.id, quantity: 1 });
      toast.success(`Añadido ${product.name} al carrito`);
    } catch (error) {
      toast.error('Error al añadir al carrito');
      console.error(error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Link href={`/products/${product.id}`} className="block h-full group">
        <Card className="h-full overflow-hidden border-border/50 bg-white/60 dark:bg-slate-900/60 transition-all duration-700 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2 relative">
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
            {promotion && (
              <div className="absolute top-3 right-3 z-20">
                <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none shadow-lg font-black tracking-widest text-[10px] uppercase">
                  {promotion.type === 'percentage' ? `-${promotion.value}% OFF` :
                    promotion.type === 'bogo' ? '2x1' :
                      promotion.type === 'gift' ? 'REGALO' : 'OFERTA'}
                </Badge>
              </div>
            )}
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-1000"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground/30 font-black uppercase tracking-widest text-xs">
                Mily's Design
              </div>
            )}

            <div className="absolute top-4 left-4 z-10">
              <Badge
                variant="secondary"
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-0 font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full"
              >
                {product.category}
              </Badge>
            </div>

            {/* Price Tag Overlay */}
            <div className="absolute bottom-4 right-4 z-10">
              <div className="bg-primary text-primary-foreground font-black px-4 py-2 rounded-2xl shadow-xl shadow-primary/20 transform group-hover:scale-110 transition-transform duration-500 italic flex flex-col items-end">
                {hasMultiplePrices && <span className="text-[10px] uppercase tracking-wider opacity-80 leading-none">Desde</span>}
                <span className="text-xl leading-tight">${minPrice.toFixed(0)}</span>
              </div>
            </div>

            {/* Quick Add Overlay (Desktop) */}
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center pointer-events-none">
              <div className="h-12 w-12 rounded-full bg-white/90 backdrop-blur shadow-2xl flex items-center justify-center transform scale-50 group-hover:scale-100 transition-transform duration-500 delay-100">
                <ExternalLink className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>

          <CardHeader className="px-6 py-6 pb-2">
            <CardTitle className="text-lg font-black tracking-tight line-clamp-2 group-hover:text-primary transition-colors duration-300 min-h-[3.5rem] leading-[1.1]">
              {product.name}
            </CardTitle>
          </CardHeader>

          <CardContent className="px-6 pb-8 pt-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${totalStock > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {totalStock > 0 ? 'Stock Disponible' : 'Bajo Pedido'}
                </span>
                {totalStock > 0 && totalStock < 5 && (
                  <span className="text-[8px] font-bold text-amber-500 uppercase">¡Últimas unidades!</span>
                )}
              </div>

              <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <ShoppingCart size={18} />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
