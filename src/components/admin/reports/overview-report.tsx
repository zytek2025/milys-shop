'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function OverviewReport() {
    const [data, setData] = useState<{
        totalRevenue: number;
        totalExpenses: number;
        netProfit: number;
        newOrdersCount: number;
    } | null>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOverview() {
            try {
                // Fetch KPIs
                const res = await fetch('/api/admin/reports?type=overview&period=30days');
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }

                // Fetch chart data for the mini chart
                const chartRes = await fetch('/api/admin/reports?type=sales&period=30days');
                if (chartRes.ok) {
                    const chartResult = await chartRes.json();
                    setChartData(chartResult.chartData || []);
                }
            } catch (error) {
                console.error('Error fetching overview snippet:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchOverview();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando métricas...</div>;
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div className="space-y-6 relative">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur border-border/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase font-bold tracking-widest text-[10px]">Ingresos (30d)</CardDescription>
                        <CardTitle className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(data?.totalRevenue || 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Ventas procesadas</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur border-border/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase font-bold tracking-widest text-[10px]">Gastos (30d)</CardDescription>
                        <CardTitle className="text-3xl font-black text-rose-600 dark:text-rose-400">
                            {formatCurrency(data?.totalExpenses || 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Egresos registrados</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur border-border/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase font-bold tracking-widest text-[10px]">Beneficio Neto</CardDescription>
                        <CardTitle className="text-3xl font-black">
                            {formatCurrency(data?.netProfit || 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Ganancia operativa</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur border-border/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="uppercase font-bold tracking-widest text-[10px]">Pedidos Nuevos</CardDescription>
                        <CardTitle className="text-3xl font-black">
                            {data?.newOrdersCount || 0}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">En los últimos 30 días</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-white/50 dark:bg-slate-900/50 border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle>Rendimiento General (Últimos 30 Días)</CardTitle>
                    <CardDescription>Visualización del volumen de ventas procesadas diariamente.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] border-t border-border/50 pt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                tickFormatter={(tick) => {
                                    const d = new Date(tick);
                                    // Make sure it doesn't break if invalid
                                    if (isNaN(d.getTime())) return tick;
                                    return `${d.getDate()}/${d.getMonth() + 1}`;
                                }}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                stroke="#888888"
                            />
                            <YAxis
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                                stroke="#888888"
                            />
                            <Tooltip
                                formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                                labelFormatter={(label) => `Fecha: ${label}`}
                                contentStyle={{ borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
