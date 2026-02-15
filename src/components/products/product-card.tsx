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
}

export function ProductCard({ product }: ProductCardProps) {
  const addToCart = useAddToCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addToCart.mutateAsync({ productId: product.id, quantity: 1 });
      toast.success(`Added ${product.name} to cart`);
    } catch (error) {
      toast.error('Failed to add to cart');
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
      <Link href={`/products/${product.id}`} className="block h-full cursor-pointer">
        <Card className="h-full overflow-hidden group hover:shadow-xl transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
          {/* Product Image */}
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground bg-secondary/30">
                No image
              </div>
            )}
            <Badge
              variant="secondary"
              className="absolute top-3 left-3 bg-background/90 backdrop-blur-md shadow-sm border-0 font-medium"
            >
              {product.category}
            </Badge>

            {/* Quick Add Overlay (Desktop) */}
            <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden lg:block bg-gradient-to-t from-black/60 to-transparent">
              <Button
                className="w-full rounded-full bg-white text-black hover:bg-gray-100"
              >
                Ver Diseños y Opciones
              </Button>
            </div>
          </div>

          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 pt-0">
            <div className="flex items-end justify-between">
              <span className="text-lg font-black text-primary">
                ${product.price.toFixed(2)}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${product.stock > 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                {product.stock > 0 ? 'Disponible' : 'Agotado'}
              </span>
            </div>
          </CardContent>

          {/* Mobile Button (Always visible) */}
          <CardFooter className="p-4 pt-0 lg:hidden">
            <Button
              size="sm"
              className="w-full rounded-xl"
              variant="secondary"
            >
              Ver Opciones
            </Button>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
