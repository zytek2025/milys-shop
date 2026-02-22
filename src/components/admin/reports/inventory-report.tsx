'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle } from 'lucide-react';

export default function InventoryReport() {
    const [data, setData] = useState<{
        topProducts: { name: string; quantity: number; revenue: number }[];
        lowStock: { id: string; name: string; stock: number }[];
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchInventory() {
            try {
                const res = await fetch('/api/admin/reports?type=inventory&period=30days');
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/50 dark:bg-slate-900/50 border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle className=" flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Productos Más Vendidos</CardTitle>
                    <CardDescription>Top 10 artículos con mayor volumen de ventas (últimos 30 días).</CardDescription>
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
                                            <p className="text-xs text-muted-foreground">{product.quantity} unidades vendidas</p>
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

            <Card className="bg-white/50 dark:bg-slate-900/50 border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle className=" flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-rose-500" /> Alertas de Inventario</CardTitle>
                    <CardDescription>Productos con stock bajo (menos de 10 unidades) o agotado.</CardDescription>
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
    );
}
