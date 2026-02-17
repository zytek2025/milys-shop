'use client';

import { useState, useEffect } from 'react';
import {
    ShoppingBag,
    Package,
    TrendingUp,
    ArrowUpRight,
    Clock,
    ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AdminStats {
    productsCount: number;
    ordersCount: number;
    totalRevenue: number;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message: string; details?: string } | null>(null);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw { message: data.error || 'Failed to fetch stats', details: data.details };
                return data;
            })
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching stats:', err);
                setError(err);
                setLoading(false);
            });
    }, []);

    const kpis = [
        {
            label: 'Ingresos Totales',
            value: (stats && typeof stats.totalRevenue === 'number')
                ? `$${stats.totalRevenue.toFixed(2)}`
                : '$0.00',
            icon: TrendingUp,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-950'
        },
        {
            label: 'Pedidos',
            value: stats?.ordersCount || 0,
            icon: ShoppingBag,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-950'
        },
        {
            label: 'Productos',
            value: stats?.productsCount || 0,
            icon: Package,
            color: 'text-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-950'
        },
    ];

    return (
        <div className="space-y-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                        Panel de Control <span className="text-primary prose-stone">Pro</span>
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium italic">Resumen ejecutivo y métricas de rendimiento en vivo.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tracking-tight uppercase">Sistema en Vivo</span>
                    </div>
                    <Button variant="outline" className="rounded-2xl border-2 font-bold uppercase text-xs tracking-widest h-11" onClick={() => window.location.reload()}>
                        <Clock className="mr-2 h-4 w-4" />
                        Refrescar
                    </Button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-destructive/10 border-2 border-destructive/20 text-destructive rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="font-black uppercase italic tracking-widest">Error de Conexión</span>
                        <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="border-destructive/20 text-destructive hover:bg-destructive/10">Reintentar</Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* KPI Cards */}
                <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                        <DollarSign size={80} />
                    </div>
                    <CardContent className="p-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Facturación Total</p>
                        <h3 className="text-3xl font-black mt-2">
                            {loading ? <Loader2 className="animate-spin h-6 w-6" /> : `$${(stats?.totalRevenue || 0).toLocaleString()}`}
                        </h3>
                        <div className="flex items-center gap-2 mt-4 text-xs font-bold bg-white/20 w-fit px-2 py-1 rounded-lg">
                            <ArrowUpRight size={14} />
                            <span>+12.5% este mes</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                        <ShoppingBag size={80} />
                    </div>
                    <CardContent className="p-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Pedidos Completados</p>
                        <h3 className="text-3xl font-black mt-2">
                            {loading ? '...' : stats?.ordersCount || 0}
                        </h3>
                        <div className="flex items-center gap-2 mt-4 text-xs font-bold bg-white/20 w-fit px-2 py-1 rounded-lg">
                            <Clock size={14} />
                            <span>8 pendientes hoy</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 relative overflow-hidden">
                    <CardContent className="p-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Conversión Lead</p>
                        <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">
                            3.2%
                        </h3>
                        <div className="mt-4 h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: '32%' }} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 relative overflow-hidden">
                    <CardContent className="p-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Productos Activos</p>
                        <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">
                            {loading ? '...' : stats?.productsCount || 0}
                        </h3>
                        <div className="flex items-center gap-2 mt-4 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 w-fit px-2 py-1 rounded-lg">
                            <Package size={14} />
                            <span>4 sin stock</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-none shadow-xl bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black uppercase italic italic tracking-tight">Rendimiento Semanal</CardTitle>
                            <CardDescription>Visualización de ventas y visitas.</CardDescription>
                        </div>
                        <TrendingUp className="text-primary" size={24} />
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-end justify-between gap-2 px-6 pb-8">
                        {/* Fake Chart Bars */}
                        {[40, 70, 45, 90, 65, 85, 55].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div
                                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-xl relative overflow-hidden flex items-end"
                                    style={{ height: '100%' }}
                                >
                                    <div
                                        className="w-full bg-primary/20 group-hover:bg-primary/40 transition-all duration-500 rounded-t-xl"
                                        style={{ height: `${h}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{['L', 'M', 'X', 'J', 'V', 'S', 'D'][i]}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-none shadow-xl bg-white dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-lg font-black uppercase italic tracking-tight">Acciones VIP</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button variant="outline" className="w-full justify-start h-12 rounded-2xl border-2 group hover:border-primary transition-colors" asChild>
                                <a href="/admin/products" className="flex items-center">
                                    <Package size={18} className="mr-3 text-muted-foreground group-hover:text-primary" />
                                    <span className="font-bold uppercase text-xs tracking-widest">Catálogo Pro</span>
                                </a>
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-12 rounded-2xl border-2 group hover:border-primary transition-colors" asChild>
                                <a href="/admin/orders" className="flex items-center">
                                    <ShoppingBag size={18} className="mr-3 text-muted-foreground group-hover:text-primary" />
                                    <span className="font-bold uppercase text-xs tracking-widest">Gestor Pedidos</span>
                                </a>
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-12 rounded-2xl border-2 group hover:border-primary transition-colors" asChild>
                                <a href="/admin/customers" className="flex items-center">
                                    <Users size={18} className="mr-3 text-muted-foreground group-hover:text-primary" />
                                    <span className="font-bold uppercase text-xs tracking-widest">CRM Remarketing</span>
                                </a>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl bg-slate-900 text-white">
                        <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <TrendingUp size={32} />
                            </div>
                            <div>
                                <h4 className="font-black uppercase italic tracking-tighter text-lg">Optimización IA</h4>
                                <p className="text-xs text-white/60 mt-1">Tu estrategia de remarketing está activa y capturando leads.</p>
                            </div>
                            <Button className="w-full bg-white text-slate-900 font-bold uppercase text-[10px] tracking-[0.2em] rounded-xl hover:bg-white/90">
                                Ver Reporte Marketing
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function Users({ size, className }: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}

function Badge({ children, variant, className }: any) {
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}>{children}</span>
}
