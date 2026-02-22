'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Package, ArrowUpRight } from 'lucide-react';
import { PrintButton } from '../shared/PrintButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SalesDetailedReport() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30days');

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/reports?type=sales_detailed&period=${period}`);
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (error) {
                console.error('Error fetching detailed sales:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [period]);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse text-xs font-bold uppercase italic">Analizando datos de ventas detallados...</div>;
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div className="space-y-8">
            <header className="report-header">
                <h1 className="text-2xl font-black uppercase italic tracking-tighter">Mily's Premium Shop</h1>
                <p className="text-sm font-bold uppercase italic opacity-70">Reporte Detallado de Ventas — Período: {period} — Generado el {new Date().toLocaleDateString()}</p>
            </header>

            <div className="flex items-center justify-between no-print">
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[180px] h-10 rounded-xl font-bold uppercase italic text-[10px]">
                        <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7days">Últimos 7 días</SelectItem>
                        <SelectItem value="30days">Últimos 30 días</SelectItem>
                        <SelectItem value="all">Histórico total</SelectItem>
                    </SelectContent>
                </Select>
                <PrintButton label="Imprimir Reporte de Ventas" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sales by Product */}
                <Card className="border-2 shadow-sm print:border-none print:shadow-none">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b print:bg-white">
                        <CardTitle className="text-sm font-black uppercase italic tracking-tighter flex items-center gap-2">
                            <Package className="h-4 w-4 text-emerald-500" /> Ventas por Producto
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase italic">Desglose de unidades y recaudación por articulo.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100/50 dark:bg-slate-800/50 text-[9px] font-black uppercase italic tracking-widest text-muted-foreground border-b print:bg-slate-50">
                                    <th className="px-4 py-3">Producto</th>
                                    <th className="px-4 py-3 text-center">Unidades</th>
                                    <th className="px-4 py-3 text-right">Recaudación</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[10px] font-bold italic">
                                {data?.products.map((p: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 truncate max-w-[200px]">{p.name}</td>
                                        <td className="px-4 py-3 text-center">{p.qty}</td>
                                        <td className="px-4 py-3 text-right font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(p.revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Sales by Customer */}
                <Card className="border-2 shadow-sm print:border-none print:shadow-none">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b print:bg-white">
                        <CardTitle className="text-sm font-black uppercase italic tracking-tighter flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" /> Ranking de Clientes
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase italic">Clientes con mayor volumen de compra en el período.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100/50 dark:bg-slate-800/50 text-[9px] font-black uppercase italic tracking-widest text-muted-foreground border-b print:bg-slate-50">
                                    <th className="px-4 py-3">Cliente (Email)</th>
                                    <th className="px-4 py-3 text-center">Pedidos</th>
                                    <th className="px-4 py-3 text-right">Total Invertido</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[10px] font-bold italic">
                                {data?.customers.map((c: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 truncate max-w-[200px]">{c.email}</td>
                                        <td className="px-4 py-3 text-center">{c.orderCount}</td>
                                        <td className="px-4 py-3 text-right font-black text-blue-600 dark:text-blue-400">{formatCurrency(c.revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
