'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductImageGalleryProps {
    images: string[];
    productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            <div className="aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 dark:bg-slate-900 dark:border-slate-800 shadow-xl flex items-center justify-center text-slate-300">
                Sin imagen disponible
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 dark:bg-slate-900 dark:border-slate-800 shadow-xl">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={activeIndex}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        src={images[activeIndex]}
                        alt={`${productName} - Vista ${activeIndex + 1}`}
                        className="w-full h-full object-cover"
                    />
                </AnimatePresence>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveIndex(idx)}
                            className={cn(
                                "relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden border-2 transition-all",
                                activeIndex === idx
                                    ? "border-primary shadow-lg scale-105"
                                    : "border-transparent opacity-70 hover:opacity-100 bg-slate-100 dark:bg-slate-800"
                            )}
                        >
                            <img
                                src={img}
                                alt={`${productName} thumbnail ${idx + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
