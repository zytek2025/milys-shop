'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem('cookie-consent', 'true');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-[100]"
                >
                    <div className="bg-white dark:bg-slate-900 border-2 border-primary/10 shadow-2xl rounded-2xl p-6 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Cookie className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-black uppercase italic tracking-tight text-slate-900 dark:text-slate-100 mb-1">
                                    Aviso de Cookies 🍪
                                </h3>
                                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed mb-4 italic">
                                    Utilizamos cookies para mejorar tu experiencia y analizar nuestro tráfico. Al continuar navegando, aceptas nuestro uso de cookies según nuestra{' '}
                                    <Link href="/legal/privacy" className="text-primary hover:underline font-bold">
                                        Política de Privacidad
                                    </Link>.
                                </p>
                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={acceptCookies}
                                        className="flex-1 h-9 rounded-lg bg-primary hover:bg-primary/90 text-[10px] font-black uppercase italic tracking-wider"
                                    >
                                        Aceptar Todo
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsVisible(false)}
                                        className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
