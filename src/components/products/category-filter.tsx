'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';

interface CategoryFilterProps {
  categories: { id: string; name: string }[];
}

export function CategoryFilter({ categories: dbCategories }: CategoryFilterProps) {
  const categories = [
    { value: 'all', label: 'Todos' },
    ...dbCategories.map(cat => ({ value: cat.name, label: cat.name }))
  ];
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'all';

  const handleCategoryChange = (category: string) => {
    if (category === 'all') {
      router.push('/');
    } else {
      router.push(`/?category=${category}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2 mb-8 justify-center"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
        <Filter className="h-4 w-4" />
        <span>Filtrar por:</span>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        <AnimatePresence mode="popLayout">
          {categories.map((category) => (
            <motion.div
              key={category.value}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                variant={selectedCategory === category.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryChange(category.value)}
                className={`transition-all duration-300 rounded-full px-4 ${selectedCategory === category.value
                  ? 'bg-primary text-primary-foreground shadow-md hover:shadow-lg scale-105'
                  : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
              >
                {category.label}
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
