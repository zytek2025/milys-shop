'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { AuthModal } from '@/components/auth/auth-modal';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthCheck } from '@/hooks/use-auth';
import { Instagram, Facebook, Send, Music2, Pin, Mail, MessageCircle } from 'lucide-react';

// Create a client (singleton for browser)
const queryClient = new QueryClient();

import { SessionTimeout } from '@/components/auth/session-timeout';

export function StoreLayout({ children }: { children: React.ReactNode }) {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [settings, setSettings] = useState<any>(null);

    // Initialize auth state
    useAuthCheck();

    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    useEffect(() => {
        if (!isAdmin) {
            fetch('/api/settings')
                .then(res => res.json())
                .then(data => setSettings(data));
        }
    }, [isAdmin]);

    const handleOpenCart = () => setIsCartOpen(true);
    const handleOpenAuth = () => setIsAuthModalOpen(true);

    if (isAdmin) {
        return (
            <QueryClientProvider client={queryClient}>
                <SessionTimeout />
                <Toaster position="top-center" richColors theme="light" />
                {children}
                <Toaster position="bottom-right" richColors />
            </QueryClientProvider>
        );
    }

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
                    onCartClick={handleOpenCart}
                />

                <main className="flex-1 relative z-10 w-full animate-in fade-in duration-500">
                    {children}
                </main>

                <CartDrawer
                    open={isCartOpen}
                    onOpenChange={setIsCartOpen}
                />

                <AuthModal
                    open={isAuthModalOpen}
                    onOpenChange={setIsAuthModalOpen}
                />

                <footer className="border-t border-primary/10 py-16 bg-muted/30 mt-auto">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                            {/* Brand Section */}
                            <div className="flex flex-col items-center md:items-start gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-white border border-primary/20 flex items-center justify-center text-primary font-black text-2xl shadow-sm">
                                    M
                                </div>
                                <div className="flex flex-col items-center md:items-start">
                                    <span className="text-xl font-serif font-black tracking-tight text-foreground text-center md:text-left">Mily's Shop</span>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold text-center md:text-left">Tu Estilo, Nuestra Pasión</p>
                                </div>
                            </div>

                            {/* Links Section */}
                            <div className="flex flex-col items-center md:items-start gap-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Navegación</h4>
                                <div className="flex flex-col items-center md:items-start gap-3 text-sm font-bold text-muted-foreground">
                                    <Link href="/" className="hover:text-primary transition-colors">Catálogo</Link>
                                    <Link href="/orders" className="hover:text-primary transition-colors">Mis Pedidos</Link>
                                    <Link href="#contact-section" className="hover:text-primary transition-colors">Contacto</Link>
                                    <Link href="/admin" className="hover:text-primary transition-colors">Administración</Link>
                                </div>
                            </div>

                            {/* Contact & Social Section */}
                            <div id="contact-section" className="flex flex-col items-center md:items-start gap-6 scroll-mt-24">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Conéctate</h4>

                                {/* Social Media Icons */}
                                <div className="flex gap-4">
                                    {settings?.instagram_handle && (
                                        <a href={`https://instagram.com/${settings.instagram_handle}`} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-white border border-primary/10 flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg text-rose-500">
                                            <Instagram size={18} />
                                        </a>
                                    )}
                                    {settings?.tiktok_handle && (
                                        <a href={`https://tiktok.com/@${settings.tiktok_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-white border border-primary/10 flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg text-slate-900">
                                            <Music2 size={18} />
                                        </a>
                                    )}
                                    {settings?.whatsapp_number && (
                                        <a href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-white border border-primary/10 flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg text-emerald-500">
                                            <MessageCircle size={18} />
                                        </a>
                                    )}
                                    {settings?.telegram_username && (
                                        <a href={`https://t.me/${settings.telegram_username}`} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-white border border-primary/10 flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg text-sky-500">
                                            <Send size={18} />
                                        </a>
                                    )}
                                    {settings?.facebook_url && (
                                        <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-white border border-primary/10 flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg text-blue-600">
                                            <Facebook size={18} />
                                        </a>
                                    )}
                                    {settings?.pinterest_handle && (
                                        <a href={`https://pinterest.com/${settings.pinterest_handle}`} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-white border border-primary/10 flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg text-rose-600">
                                            <Pin size={18} />
                                        </a>
                                    )}
                                </div>

                                {settings?.contact_email && (
                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-white/50 px-4 py-2 rounded-full border border-primary/5">
                                        <Mail size={14} className="text-primary" />
                                        {settings.contact_email}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-8 border-t border-primary/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 text-center md:text-left">
                            <p>© 2024 Mily's Shop. All rights reserved.</p>
                            <p className="flex items-center gap-1">Handcrafted with <span className="text-rose-500 animate-pulse">✨</span> by Mily's Team</p>
                        </div>
                    </div>
                </footer>

                <Toaster position="bottom-right" richColors />
            </div>
        </QueryClientProvider>
    );
}
