'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function SalesReport() {
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSales() {
            try {
                const res = await fetch('/api/admin/reports?type=sales&period=30days');
                if (res.ok) {
                    const result = await res.json();
                    setChartData(result.chartData || []);
                }
            } catch (error) {
                console.error('Error fetching sales data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchSales();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando histórico de ventas...</div>;
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <Card className="bg-white/50 dark:bg-slate-900/50 border-border/50 shadow-sm">
            <CardHeader>
                <CardTitle>Ventas Diarias (Últimos 30 días)</CardTitle>
                <CardDescription>Análisis del histórico de ventas y pedidos confirmados.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] border-t border-border/50 pt-6">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis
                            dataKey="date"
                            tickFormatter={(tick) => {
                                const d = new Date(tick);
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
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            contentStyle={{ borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar
                            dataKey="amount"
                            fill="var(--primary)"
                            radius={[4, 4, 0, 0]}
                            className="dark:fill-primary"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
