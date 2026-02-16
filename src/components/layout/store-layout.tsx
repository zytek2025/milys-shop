'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { AuthModal } from '@/components/auth/auth-modal';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthCheck } from '@/hooks/use-auth';

// Create a client (singleton for browser)
const queryClient = new QueryClient();

import { SessionTimeout } from '@/components/auth/session-timeout';

export function StoreLayout({ children }: { children: React.ReactNode }) {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Initialize auth state
    useAuthCheck();

    const handleOpenCart = () => setIsCartOpen(true);
    const handleOpenAuth = () => setIsAuthModalOpen(true);

    return (
        <QueryClientProvider client={queryClient}>
            <div className="min-h-screen flex flex-col font-sans bg-background text-foreground bg-[url('/noise.png')]">
                <SessionTimeout />

                {/* Global Background Decoration - Updated for Solid Look */}
                <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30 dark:opacity-20 hidden">
                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[100px]" />
                </div>

                <Toaster position="top-center" richColors theme="light" />

                <Header
                    onOpenCart={handleOpenCart}
                    onOpenAuth={handleOpenAuth}
                />

                <main className="flex-1 relative z-10 w-full animate-in fade-in duration-500">
                    {children}
                </main>

                <CartDrawer
                    isOpen={isCartOpen}
                    onClose={() => setIsCartOpen(false)}
                />

                <AuthModal
                    open={isAuthModalOpen}
                    onOpenChange={setIsAuthModalOpen}
                />

                <footer className="border-t border-primary/10 py-16 bg-muted/30 mt-auto">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                            <div className="flex flex-col items-center md:items-start gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-white border border-primary/20 flex items-center justify-center text-primary font-black text-2xl shadow-sm">
                                    M
                                </div>
                                <div className="flex flex-col items-center md:items-start">
                                    <span className="text-xl font-serif font-black tracking-tight text-foreground">Mily's Shop</span>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Tu Estilo, Nuestra Pasión</p>
                                </div>
                            </div>

                            <div className="flex gap-8 text-sm font-bold text-muted-foreground">
                                <Link href="/" className="hover:text-primary transition-colors">Catálogo</Link>
                                <Link href="#" className="hover:text-primary transition-colors">Nosotros</Link>
                                <Link href="#" className="hover:text-primary transition-colors">Contacto</Link>
                                <Link href="/admin" className="hover:text-primary transition-colors">Admin</Link>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-primary/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                            <p>© 2024 Mily's Shop. All rights reserved.</p>
                            <p>Handcrafted with ✨ by Mily's Team</p>
                        </div>
                    </div>
                </footer>

                <Toaster position="bottom-right" richColors />
            </div>
        </QueryClientProvider>
    );
}
