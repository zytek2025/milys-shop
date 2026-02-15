'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Users,
    X,
    Palette,
    Tags,
    Layers,
    ArrowLeft,
    Menu,
    Settings as SettingsIcon
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/store/cart-store';
import { redirect, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const isLoginPage = pathname === '/admin/login';
    const { isAdmin, isAuthenticated, user } = useAuth();
    const router = useRouter();

    // Guard: if not admin, redirect or show error (unless already on login page)
    // We do this in useEffect to ensure client-side state is stable
    useEffect(() => {
        if (!isLoginPage && (!isAuthenticated || !isAdmin)) {
            router.replace('/admin/login');
        }
    }, [isLoginPage, isAuthenticated, isAdmin, router]);

    // Special case for login page: return clean layout without sidebar
    if (isLoginPage) {
        return <div className="min-h-screen bg-slate-50 dark:bg-slate-950">{children}</div>;
    }

    // While checking auth, show nothing or a loader to prevent flicker
    if (!isAuthenticated || !isAdmin) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-serif">Verificando acceso...</div>;
    }

    const navItems = [
        { label: 'Panel Principal', icon: LayoutDashboard, href: '/admin' },
        { label: 'Prendas', icon: Package, href: '/admin/products' },
        { label: 'Diseños', icon: Palette, href: '/admin/designs' },
        { label: 'Tipos de Logos', icon: Tags, href: '/admin/design-categories' },
        { label: 'Categorías', icon: Layers, href: '/admin/categories' },
        { label: 'Pedidos', icon: ShoppingBag, href: '/admin/orders' },
        { label: 'Clientes', icon: Users, href: '/admin/customers' },
        { label: 'Ajustes', icon: SettingsIcon, href: '/admin/settings' },
    ];

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Sidebar for Desktop */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r transition-transform duration-300 transform md:translate-x-0",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    <div className="px-6 py-8 border-b">
                        <Link href="/" className="flex items-center gap-2 mb-6 text-primary hover:opacity-80 transition-opacity">
                            <ArrowLeft size={16} />
                            <span className="text-xs font-semibold uppercase tracking-wider">Volver a la Tienda</span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl">
                                M
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-lg leading-tight">Admin Console</span>
                                <span className="text-xs text-muted-foreground">Mily's Store</span>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                                    pathname === item.href
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                        : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground"
                                )}
                                onClick={() => setIsSidebarOpen(false)}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="p-4 border-t">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                            <p className="text-xs font-semibold mb-1 uppercase tracking-wider text-muted-foreground">Sesión Activa</p>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-sm font-medium">Administrador</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 border-b bg-white dark:bg-slate-900 sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                            M
                        </div>
                        <span className="font-bold">Admin Console</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </Button>
                </header>

                <div className="p-4 md:p-8 flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}
