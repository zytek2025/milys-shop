'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle } from 'lucide-react';
import { PrintButton } from '../shared/PrintButton';
import { cn } from '@/lib/utils';

export default function InventoryReport() {
    const [data, setData] = useState<{
        topProducts: { name: string; quantity: number; revenue: number }[];
        lowStock: { id: string; name: string; stock: number }[];
        inventory_all?: { id: string; name: string; stock: number; price: number }[];
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchInventory() {
            try {
                const res = await fetch('/api/admin/reports?type=inventory&period=30days');
                const fullRes = await fetch('/api/admin/reports?type=inventory_full');

                if (res.ok && fullRes.ok) {
                    const result = await res.json();
                    const fullData = await fullRes.json();
                    setData({
                        ...result,
                        inventory_all: fullData.products
                    });
                }
            } catch (error) {
                console.error('Error fetching inventory data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchInventory();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando reporte de inventario...</div>;
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div className="space-y-8">
            <header className="report-header">
                <h1 className="text-2xl font-black uppercase italic tracking-tighter">Mily's Premium Shop</h1>
                <p className="text-sm font-bold uppercase italic opacity-70">Inventario y Stock — Generado el {new Date().toLocaleDateString()}</p>
            </header>

            <div className="flex justify-end no-print">
                <PrintButton label="Imprimir Inventario Completo" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
                {/* Existing Top Products Card */}
                <Card className="bg-white/50 dark:bg-slate-900/50 border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle className=" flex items-center gap-2 text-sm font-black uppercase italic tracking-tighter">
                            <Package className="h-5 w-5 text-primary" /> Productos Más Vendidos
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase italic">Top 10 artículos con mayor volumen de ventas (últimos 30 días).</CardDescription>
                    </CardHeader>
                    <CardContent className="border-t border-border/50 pt-4">
                        {data?.topProducts && data.topProducts.length > 0 ? (
                            <div className="space-y-4">
                                {data.topProducts.map((product, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                #{index + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm line-clamp-1">{product.name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase italic">{product.quantity} unidades vendidas</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{formatCurrency(product.revenue)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">No hay datos de ventas recientes.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Existing Low Stock Alerts Card */}
                <Card className="bg-white/50 dark:bg-slate-900/50 border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle className=" flex items-center gap-2 text-sm font-black uppercase italic tracking-tighter">
                            <AlertTriangle className="h-5 w-5 text-rose-500" /> Alertas de Inventario
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase italic">Productos con stock bajo (menos de 10 unidades) o agotado.</CardDescription>
                    </CardHeader>
                    <CardContent className="border-t border-border/50 pt-4">
                        {data?.lowStock && data.lowStock.length > 0 ? (
                            <div className="space-y-4">
                                {data.lowStock.map((product) => (
                                    <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div>
                                            <p className="font-semibold text-sm line-clamp-1">{product.name}</p>
                                        </div>
                                        <div>
                                            {product.stock === 0 ? (
                                                <Badge variant="destructive">Agotado</Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-rose-200 text-rose-600 dark:border-rose-900 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50">
                                                    Solo {product.stock}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">No hay productos con stock bajo 🎉</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* NEW Full Inventory Table (Visible in Print) */}
            <Card className="border-2 shadow-sm print:border-none print:shadow-none">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b print:bg-white no-print">
                    <CardTitle className="text-sm font-black uppercase italic tracking-tighter flex items-center gap-2">
                        Listado de Existencia Completo
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase italic">Relación detallada de todo el stock actual.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800/50 text-[9px] font-black uppercase italic tracking-widest text-muted-foreground border-b print:bg-slate-100">
                                <th className="px-4 py-3">Nombre del Producto</th>
                                <th className="px-4 py-3 text-center">Stock</th>
                                <th className="px-4 py-3 text-right">Precio Ref.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px] font-bold italic">
                            {(data as any)?.inventory_all?.map((p: any) => (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 truncate max-w-[300px]">{p.name}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={cn(p.stock < 5 ? "text-rose-600 font-black" : "")}>
                                            {p.stock}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-black italic">{formatCurrency(p.price)}</td>
                                </tr>
                            )) || (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground text-[10px] uppercase italic">
                                            Cargando listado completo de productos...
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );

}
