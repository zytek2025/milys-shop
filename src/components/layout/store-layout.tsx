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

export function StoreLayout({ children }: { children: React.ReactNode }) {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Initialize auth state
    useAuthCheck();

    const handleLoginRequired = () => {
        setIsCartOpen(false);
        setIsAuthModalOpen(true);
    };

    return (
        <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-background text-foreground flex flex-col">
                <Header
                    onCartClick={() => setIsCartOpen(true)}
                />

                <main className="flex-1">
                    {children}
                </main>

                <CartDrawer
                    open={isCartOpen}
                    onOpenChange={setIsCartOpen}
                    onLoginRequired={handleLoginRequired}
                />

                <AuthModal
                    open={isAuthModalOpen}
                    onOpenChange={setIsAuthModalOpen}
                />

                <footer className="border-t border-border/40 py-16 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm mt-auto">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                            <div className="flex flex-col items-center md:items-start gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-2xl shadow-xl shadow-primary/20">
                                    M
                                </div>
                                <div className="flex flex-col items-center md:items-start">
                                    <span className="text-xl font-serif font-black tracking-tight">Mily's Shop</span>
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

                        <div className="pt-8 border-t border-border/20 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
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
