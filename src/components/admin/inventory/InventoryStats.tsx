'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, DollarSign, Layers } from 'lucide-react';

interface StatsProps {
    data: {
        productCount: number;
        variantCount: number;
        lowStockCount: number;
        totalValue: number;
        totalItems: number;
        categoryStats: Record<string, number>;
    } | null;
    isLoading: boolean;
}

export function InventoryStats({ data, isLoading }: StatsProps) {
    if (isLoading || !data) {
        return <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl" />)}
        </div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Productos</CardTitle>
                        <Package className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{data.productCount} <span className="text-xs text-muted-foreground font-normal">({data.totalItems} unds)</span></div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Valor Estimado</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">${data.totalValue.toLocaleString()}</div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Bajo Stock</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-amber-600">{data.lowStockCount}</div>
                        <p className="text-xs text-muted-foreground">Variantes con alert</p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Variantes</CardTitle>
                        <Layers className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{data.variantCount}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                <CardHeader>
                    <CardTitle className="text-lg">Inventario por Categoría</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(data.categoryStats).map(([cat, count]) => (
                            <div key={cat} className="flex items-center">
                                <div className="w-32 text-sm font-medium truncate">{cat}</div>
                                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mx-4">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min((count / data.totalItems) * 100, 100)}%` }}
                                    />
                                </div>
                                <div className="w-12 text-sm font-bold text-right">{count}</div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
