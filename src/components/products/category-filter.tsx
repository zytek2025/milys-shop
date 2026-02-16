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
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 mb-12"
    >
      <div className="flex flex-wrap gap-3 justify-center">
        <AnimatePresence mode="popLayout">
          {categories.map((category) => {
            const isActive = selectedCategory === category.value;
            return (
              <motion.div
                key={category.value}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, ease: "backOut" }}
              >
                <button
                  onClick={() => handleCategoryChange(category.value)}
                  className={`
                    group relative px-6 py-2.5 rounded-2xl text-sm font-black transition-all duration-300
                    flex items-center gap-2 overflow-hidden
                    ${isActive
                      ? 'text-white bg-primary shadow-[0_10px_20px_-5px_rgba(var(--primary),0.3)]'
                      : 'bg-white dark:bg-slate-900 text-muted-foreground hover:text-foreground border border-border/50 shadow-sm hover:shadow-md'
                    }
                  `}
                >
                  {/* Active Indicator Backdrop */}
                  {isActive && (
                    <motion.div
                      layoutId="activeCategory"
                      className="absolute inset-0 bg-gradient-to-tr from-primary via-primary/95 to-secondary -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}

                  <span className="relative z-10 tracking-tight">{category.label}</span>

                  {isActive && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: 4 }}
                      className="h-1 w-1 rounded-full bg-white/50"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
