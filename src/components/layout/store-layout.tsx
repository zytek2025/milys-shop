'use client';

import { useState } from 'react';
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

                <footer className="border-t py-8 bg-muted/30 mt-auto">
                    <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                        <p>© 2024 Mily's. Tu Estilo, Tu Tienda.</p>
                    </div>
                </footer>

                <Toaster position="bottom-right" richColors />
            </div>
        </QueryClientProvider>
    );
}
