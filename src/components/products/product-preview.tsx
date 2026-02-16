'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Shirt, Type } from 'lucide-react';

interface ProductPreviewProps {
    color: string;
    colorHex: string;
    designs: Array<{
        id: string;
        image_url: string;
        selectedLocation: string;
        selectedSize: string;
    }>;
    customText: string;
    customTextSize: 'small' | 'large';
    garmentImage?: string; // Optional custom base image
}

export function ProductPreview({
    color,
    colorHex,
    designs,
    customText,
    customTextSize,
    garmentImage
}: ProductPreviewProps) {

    // Map locations to percentages (Top/Left)
    const locationConfig: Record<string, { top: string; left: string; rotate?: number }> = {
        'Frente Centro': { top: '35%', left: '35%', rotate: 0 },
        'Frente Lado Izquierdo': { top: '35%', left: '55%', rotate: 0 }, // Chest left (viewer's right)
        'Frente Lado Derecho': { top: '35%', left: '20%', rotate: 0 },   // Chest right (viewer's left)
        'Espalda Centro': { top: '30%', left: '35%', rotate: 0 },
        'Espalda Cuello': { top: '15%', left: '42%', rotate: 0 },
        'Manga Izquierda': { top: '35%', left: '75%', rotate: -10 },
        'Manga Derecha': { top: '35%', left: '5%', rotate: 10 },
    };

    // Helper to determine size in %
    const getSize = (size: string) => {
        switch (size) {
            case 'small': return '15%';
            case 'medium': return '25%';
            case 'large': return '35%';
            default: return '20%';
        }
    };

    return (
        <div className="w-full aspect-square relative rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-primary/5">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Main Container */}
            <div className="relative w-full h-full flex items-center justify-center p-8">

                {/* Garment Layer */}
                <div className="relative w-full max-w-[320px] aspect-[3/4]">
                    {/* Base Shirt Shape (CSS Only for now, replacing image) */}
                    {/* In production, we would use a real transparent PNG of a white shirt */}
                    <div className="absolute inset-0 w-full h-full transition-colors duration-500 ease-in-out">
                        {!garmentImage ? (
                            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl filter">
                                <path
                                    d="M20 30 L30 10 L40 15 L50 10 L60 15 L70 10 L80 30 L70 40 L70 90 L30 90 L30 40 Z"
                                    fill={colorHex || '#f1f5f9'}
                                    stroke="rgba(0,0,0,0.1)"
                                    strokeWidth="0.5"
                                    className="transition-[fill] duration-500"
                                />
                                <path d="M40 15 Q50 25 60 15" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                            </svg>
                        ) : (
                            <div className="absolute inset-0 w-full h-full">
                                {/* Base Image */}
                                <img src={garmentImage} alt="Base" className="absolute inset-0 w-full h-full object-contain" />

                                {/* Color Tint Overlay - Masked by the garment image itself */}
                                <div
                                    className="absolute inset-0 w-full h-full mix-blend-multiply transition-colors duration-300"
                                    style={{
                                        backgroundColor: colorHex,
                                        maskImage: `url(${garmentImage})`,
                                        WebkitMaskImage: `url(${garmentImage})`,
                                        maskSize: 'contain',
                                        WebkitMaskSize: 'contain',
                                        maskRepeat: 'no-repeat',
                                        WebkitMaskRepeat: 'no-repeat',
                                        maskPosition: 'center',
                                        WebkitMaskPosition: 'center'
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Design Layers */}
                    <div className="absolute inset-0 w-full h-full pointer-events-none">
                        <AnimatePresence>
                            {designs.map((design) => {
                                const pos = locationConfig[design.selectedLocation] || locationConfig['Frente Centro'];
                                return (
                                    <motion.div
                                        key={design.id + design.selectedLocation}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        className="absolute z-10"
                                        style={{
                                            top: pos.top,
                                            left: pos.left,
                                            width: getSize(design.selectedSize),
                                            rotate: `${pos.rotate}deg`
                                        }}
                                    >
                                        <img src={design.image_url} alt="design" className="w-full h-full object-contain drop-shadow-sm" />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Text Layer - Simple Overlay */}
                    {customText && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute inset-x-0 top-[60%] flex justify-center z-20 pointer-events-none"
                        >
                            <div
                                className={cn(
                                    "font-serif font-black italic text-center text-slate-800 drop-shadow-sm px-4",
                                )}
                                style={{
                                    fontSize: customTextSize === 'small' ? '12px' : '18px',
                                    color: colorHex === '#000000' ? 'white' : '#1e293b' // Auto-contrast
                                }}
                            >
                                "{customText}"
                            </div>
                        </motion.div>
                    )}

                </div>
            </div>

            {/* Info Badge */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-full shadow-lg flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full border shadow-sm" style={{ backgroundColor: colorHex || '#fff' }} />
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                        {color || 'Color Base'}
                        <span className="mx-1">•</span>
                        {designs.length} Logos
                    </span>
                </div>
            </div>
        </div>
    );
}
