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
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Bienvenido, Admin</h1>
                <p className="text-muted-foreground mt-2">Aquí tienes un resumen de lo que está pasando en Mily's Store.</p>
            </div>

            {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="font-bold">Error: {error.message}</span>
                        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Reintentar</Button>
                    </div>
                    {error.details && <p className="text-xs opacity-80">{error.details}</p>}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kpis.map((kpi, i) => (
                    <Card key={i} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">{kpi.label}</p>
                                    <h3 className="text-2xl font-bold">{loading ? '...' : kpi.value}</h3>
                                </div>
                                <div className={`${kpi.bg} ${kpi.color} p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                                    <kpi.icon size={24} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Acciones Rápidas</CardTitle>
                        <CardDescription>Accesos directos a las tareas más comunes.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="h-24 flex flex-col gap-2 rounded-2xl" asChild>
                            <a href="/admin/products">
                                <Package size={20} />
                                <span>Nuevo Producto</span>
                            </a>
                        </Button>
                        <Button variant="outline" className="h-24 flex flex-col gap-2 rounded-2xl" asChild>
                            <a href="/admin/orders">
                                <ShoppingBag size={20} />
                                <span>Ver Pedidos</span>
                            </a>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Estado del Servidor</CardTitle>
                        <CardDescription>Información técnica y de sincronización.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b last:border-0 border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <Clock size={16} className="text-muted-foreground" />
                                    <span className="text-sm">Última Sincronización</span>
                                </div>
                                <span className="text-sm font-medium">Hace 2 minutos</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b last:border-0 border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm">Supabase Connection</span>
                                </div>
                                <Badge variant="outline" className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950 border-emerald-200">Online</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function Badge({ children, variant, className }: any) {
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}>{children}</span>
}
