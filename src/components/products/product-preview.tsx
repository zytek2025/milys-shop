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

    // Map locations to percentages (Top/Left) - Calibrated for a centered garment
    // Refined coordinates for perfect centering on mobile and desktop
    const locationConfig: Record<string, { top: string; left: string; rotate?: number }> = {
        'Frente Centro': { top: '38%', left: '50%', rotate: 0 },
        'Frente Lado Izquierdo': { top: '32%', left: '65%', rotate: 0 },
        'Frente Lado Derecho': { top: '32%', left: '35%', rotate: 0 },
        'Espalda Centro': { top: '35%', left: '50%', rotate: 0 },
        'Espalda Cuello': { top: '18%', left: '50%', rotate: 0 },
        'Manga Izquierda': { top: '35%', left: '82%', rotate: -8 },
        'Manga Derecha': { top: '35%', left: '18%', rotate: 8 },
    };

    const getSize = (size: string) => {
        switch (size) {
            case 'small': return '18%';
            case 'medium': return '28%';
            case 'large': return '38%';
            default: return '24%';
        }
    };

    return (
        <div className="w-full aspect-square relative rounded-[2rem] overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 shadow-2xl flex flex-col group">
            {/* Main Stage */}
            <div className="relative flex-1 w-full flex items-center justify-center p-6 sm:p-10 isolation-auto">
                <div className="relative w-full h-full max-w-[340px] flex items-center justify-center pointer-events-none">

                    {/* 1. Garment Base */}
                    <div className="absolute inset-0 flex items-center justify-center z-0 overflow-hidden">
                        {!garmentImage ? (
                            <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] drop-shadow-2xl opacity-80">
                                <path
                                    d="M20 30 L30 10 L40 15 L50 10 L60 15 L70 10 L80 30 L70 40 L70 90 L30 90 L30 40 Z"
                                    fill={colorHex || '#f1f5f9'}
                                    stroke="rgba(0,0,0,0.05)"
                                    strokeWidth="0.5"
                                />
                                <path d="M40 15 Q50 25 60 15" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                            </svg>
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center">
                                {/* Base Image */}
                                <img
                                    src={garmentImage}
                                    alt="Base"
                                    className="w-full h-full object-contain pointer-events-none z-10"
                                />

                                {/* Intelligent Tint Layer */}
                                {/* We only apply tint if color is NOT white */}
                                {colorHex !== '#ffffff' && colorHex !== '#FFFFFF' && (
                                    <div
                                        className="absolute inset-0 z-20 mix-blend-multiply opacity-60 transition-all duration-700 ease-in-out pointer-events-none"
                                        style={{
                                            backgroundColor: colorHex,
                                            // The mask ensures the tint only applies to where the shirt is
                                            // Works best with transparent PNG, but handles white/solid backgrounds better now
                                            WebkitMaskImage: `url(${garmentImage})`,
                                            maskImage: `url(${garmentImage})`,
                                            maskSize: 'contain',
                                            WebkitMaskSize: 'contain',
                                            maskRepeat: 'no-repeat',
                                            maskPosition: 'center'
                                        }}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* 2. Customization Layer (Logos & Text) */}
                    <div className="absolute inset-0 z-30 pointer-events-none">
                        <div className="relative w-full h-full">
                            <AnimatePresence>
                                {designs.map((design, idx) => {
                                    const pos = locationConfig[design.selectedLocation] || locationConfig['Frente Centro'];
                                    return (
                                        <motion.div
                                            key={`${design.id}-${idx}`}
                                            initial={{ opacity: 0, scale: 0.5, x: '-50%', y: '-50%' }}
                                            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                                            transition={{ type: 'spring', damping: 20 }}
                                            className="absolute"
                                            style={{
                                                top: pos.top,
                                                left: pos.left,
                                                width: getSize(design.selectedSize),
                                                rotate: `${pos.rotate || 0}deg`
                                            }}
                                        >
                                            <img
                                                src={design.image_url}
                                                alt="Logo"
                                                className="w-full h-full object-contain drop-shadow-xl brightness-105"
                                            />
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            {/* Text Component */}
                            {customText && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, x: '-50%' }}
                                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                                    className="absolute left-1/2 bottom-[24%] flex justify-center w-full max-w-[80%]"
                                >
                                    <span
                                        className={cn(
                                            "font-serif font-black italic text-center px-6 py-2 rounded-xl border border-white/20 transition-all duration-300",
                                            colorHex === '#000000' || colorHex === '#1a1a1b'
                                                ? "text-white bg-white/5 backdrop-blur-md"
                                                : "text-slate-900 bg-black/5 backdrop-blur-sm"
                                        )}
                                        style={{ fontSize: customTextSize === 'small' ? '14px' : '22px' }}
                                    >
                                        "{customText}"
                                    </span>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Micro-Interaction Footer */}
            <div className="px-6 py-4 bg-white/40 dark:bg-black/20 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="w-5 h-5 rounded-full border border-white/40 shadow-xl transition-transform group-hover:scale-110"
                        style={{ backgroundColor: colorHex }}
                    />
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black tracking-tighter text-slate-400">Color Base</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[100px]">{color}</span>
                    </div>
                </div>
                <div className="flex -space-x-2">
                    {designs.slice(0, 3).map((d, i) => (
                        <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                            <img src={d.image_url} alt="mini" className="w-5 h-5 object-contain" />
                        </div>
                    ))}
                    {designs.length > 3 && (
                        <div className="w-7 h-7 rounded-full border-2 border-white bg-primary text-[8px] font-bold text-white flex items-center justify-center">
                            +{designs.length - 3}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
