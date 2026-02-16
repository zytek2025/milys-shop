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
import { redirect } from 'next/navigation';

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { isAdmin, isAuthenticated } = useAuth();

    // Guard: if not admin, redirect or show error
    // Note: In real production, this should also be done in middleware for better security
    if (!isAuthenticated || !isAdmin) {
        // redirect('/'); // Or show an unauthorized page
    }

    const navItems = [
        { label: 'Panel Principal', icon: LayoutDashboard, href: '/admin' },
        { label: 'Prendas/Productos', icon: Package, href: '/admin/products' },
        { label: 'Colección de Logos', icon: Palette, href: '/admin/designs' },
        { label: 'Categorías de Logos', icon: Tags, href: '/admin/design-categories' },
        { label: 'Categorías de Productos', icon: Layers, href: '/admin/categories' },
        { label: 'Pedidos', icon: ShoppingBag, href: '/admin/orders' },
        { label: 'Clientes', icon: Users, href: '/admin/customers' },
        { label: 'Ajustes', icon: SettingsIcon, href: '/admin/settings' },
    ];

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
            {/* Sidebar for Desktop */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-border/50 transition-all duration-300 transform md:translate-x-0 shadow-2xl shadow-slate-200/50 dark:shadow-none",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="px-8 py-10">
                        <Link href="/" className="flex items-center gap-3 mb-8 text-primary-foreground/60 hover:text-primary-foreground transition-all group">
                            <div className="p-2 rounded-full bg-slate-100 group-hover:bg-primary/20 transition-colors">
                                <ArrowLeft size={14} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Volver a la Tienda</span>
                        </Link>

                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-secondary rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative h-12 w-12 rounded-2xl bg-white dark:bg-slate-950 flex items-center justify-center text-primary-foreground font-black text-2xl shadow-sm">
                                    M
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-xl tracking-tighter italic uppercase text-slate-800 dark:text-white">Admin</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mily's Store</span>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto custom-scrollbar">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "group flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-[0_10px_20px_-5px_rgba(var(--primary),0.3)] ring-1 ring-primary/20"
                                            : "text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                                    )}
                                    onClick={() => setIsSidebarOpen(false)}
                                >
                                    <div className={cn(
                                        "p-1.5 rounded-lg transition-colors group-hover:scale-110 duration-300",
                                        isActive ? "bg-white/20" : "bg-slate-50 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700"
                                    )}>
                                        <item.icon size={18} />
                                    </div>
                                    <span className="flex-1 tracking-tight">{item.label}</span>
                                    {isActive && (
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground/50 animate-pulse" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-6">
                        <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-[2rem] border border-white/50 dark:border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -mr-4 -mt-4 h-16 w-16 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                            <p className="text-[9px] font-black mb-2 uppercase tracking-[0.2em] text-muted-foreground relative z-10">Estado del Sistema</p>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                                <span className="text-sm font-bold tracking-tight">Cloud Online</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 md:ml-72 min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-all duration-500">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-6 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black shadow-lg shadow-primary/20">
                            M
                        </div>
                        <span className="font-extrabold tracking-tight">Admin Console</span>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-xl bg-slate-100 dark:bg-slate-800" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </Button>
                </header>

                <div className="p-6 md:p-12 lg:p-16 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
                    {children}
                </div>
            </main>
        </div>
    );
}
