'use client';

import { useAuth } from '@/store/cart-store';
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Package, DollarSign } from 'lucide-react';

import OverviewReport from '@/components/admin/reports/overview-report';
import SalesReport from '@/components/admin/reports/sales-report';
import InventoryReport from '@/components/admin/reports/inventory-report';
import FinanceReport from '@/components/admin/reports/finance-report';

export default function ReportsPage() {
    const { isAdmin, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando módulos...</div>;
    }

    if (!isAuthenticated || !isAdmin) {
        redirect('/auth/login');
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black tracking-tight mb-2 text-slate-900 dark:text-white">Informes y Estadísticas</h1>
                <p className="text-muted-foreground">
                    Analiza el rendimiento de tu tienda con métricas clave para la toma de decisiones.
                </p>
            </div>

            <Tabs defaultValue="overview" className="w-full space-y-6">
                <TabsList className="bg-white dark:bg-slate-900 justify-start w-full overflow-x-auto border-b border-border/50 rounded-none h-auto p-0 gap-8 custom-scrollbar mb-8">
                    <TabsTrigger
                        value="overview"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 font-bold text-muted-foreground transition-all"
                    >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Resumen General
                    </TabsTrigger>
                    <TabsTrigger
                        value="sales"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 font-bold text-muted-foreground transition-all"
                    >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Ventas Históricas
                    </TabsTrigger>
                    <TabsTrigger
                        value="inventory"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 font-bold text-muted-foreground transition-all"
                    >
                        <Package className="w-4 h-4 mr-2" />
                        Stock y Productos
                    </TabsTrigger>
                    <TabsTrigger
                        value="finances"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 font-bold text-muted-foreground transition-all"
                    >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Resultados Financieros
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-0 outline-none animate-in fade-in-50 duration-500">
                    <OverviewReport />
                </TabsContent>

                <TabsContent value="sales" className="mt-0 outline-none animate-in fade-in-50 duration-500">
                    <SalesReport />
                </TabsContent>

                <TabsContent value="inventory" className="mt-0 outline-none animate-in fade-in-50 duration-500">
                    <InventoryReport />
                </TabsContent>

                <TabsContent value="finances" className="mt-0 outline-none animate-in fade-in-50 duration-500">
                    <FinanceReport />
                </TabsContent>
            </Tabs>
        </div>
    );
}
