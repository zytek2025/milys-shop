'use client';

import { motion } from 'framer-motion';
import { Loader2, Search, Package } from 'lucide-react';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';

interface SearchResultsProps {
  results: Product[];
  query: string;
  isLoading: boolean;
  focusedIndex: number;
  onProductClick: (product: Product) => void;
}

export function SearchResults({
  results,
  query,
  isLoading,
  focusedIndex,
  onProductClick,
}: SearchResultsProps) {
  // Highlight search term in text
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-emerald-200 dark:bg-emerald-800/50 text-inherit rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!query.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">
          Start typing to search products
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Package className="h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm font-medium">No products found</p>
        <p className="text-xs text-muted-foreground">
          Try a different search term
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-80 overflow-y-auto">
      <div className="p-2 text-xs text-muted-foreground border-b">
        {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
      </div>
      <div className="p-1">
        {results.map((product, index) => (
          <motion.button
            key={product.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => onProductClick(product)}
            className={cn(
              "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
              "hover:bg-muted/50",
              focusedIndex === index && "bg-muted/50"
            )}
          >
            {/* Product Image */}
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Package className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {highlightText(product.name, query)}
              </p>
              {product.description && (
                <p className="text-sm text-muted-foreground truncate">
                  {highlightText(product.description.slice(0, 60), query)}
                  {product.description.length > 60 ? '...' : ''}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="text-right flex-shrink-0">
              <p className="font-semibold text-emerald-600">
                ${product.price.toFixed(2)}
              </p>
              {product.category && (
                <p className="text-xs text-muted-foreground capitalize">
                  {product.category}
                </p>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
