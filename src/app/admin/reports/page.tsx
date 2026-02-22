'use client';

import { useAuth } from '@/store/cart-store';
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Package, DollarSign, ShoppingBag } from 'lucide-react';

import OverviewReport from '@/components/admin/reports/overview-report';
import SalesReport from '@/components/admin/reports/sales-report';
import InventoryReport from '@/components/admin/reports/inventory-report';
import FinanceReport from '@/components/admin/reports/finance-report';
import OrdersReport from '@/components/admin/reports/orders-report';
import SalesDetailedReport from '@/components/admin/reports/sales-detailed-report';

export default function ReportsPage() {
    const { isAdmin, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse text-xs font-bold uppercase italic">Cargando módulos de inteligencia...</div>;
    }

    if (!isAuthenticated || !isAdmin) {
        redirect('/auth/login');
    }

    return (
        <div className="space-y-8">
            <div className="no-print">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2 text-slate-900 dark:text-white">Informes y Estadísticas</h1>
                <p className="text-xs font-bold uppercase italic text-muted-foreground">
                    Analiza el rendimiento de tu tienda con métricas clave para la toma de decisiones.
                </p>
            </div>

            <Tabs defaultValue="overview" className="w-full space-y-6">
                <TabsList className="no-print bg-white dark:bg-slate-900 justify-start w-full overflow-x-auto border-b border-border/50 rounded-none h-auto p-0 gap-6 custom-scrollbar mb-8">
                    <TabsTrigger
                        value="overview"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-[10px] font-black uppercase italic text-muted-foreground transition-all"
                    >
                        <BarChart3 className="w-3.5 h-3.5 mr-2" />
                        Resumen
                    </TabsTrigger>
                    <TabsTrigger
                        value="sales_detailed"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-[10px] font-black uppercase italic text-muted-foreground transition-all"
                    >
                        <TrendingUp className="w-3.5 h-3.5 mr-2" />
                        Ventas Detalle
                    </TabsTrigger>
                    <TabsTrigger
                        value="orders"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-[10px] font-black uppercase italic text-muted-foreground transition-all"
                    >
                        <ShoppingBag className="w-3.5 h-3.5 mr-2" />
                        Pedidos
                    </TabsTrigger>
                    <TabsTrigger
                        value="inventory"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-[10px] font-black uppercase italic text-muted-foreground transition-all"
                    >
                        <Package className="w-3.5 h-3.5 mr-2" />
                        Stock
                    </TabsTrigger>
                    <TabsTrigger
                        value="finances"
                        className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-[10px] font-black uppercase italic text-muted-foreground transition-all"
                    >
                        <DollarSign className="w-3.5 h-3.5 mr-2" />
                        Finanzas
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-0 outline-none animate-in fade-in-50 duration-500">
                    <OverviewReport />
                </TabsContent>

                <TabsContent value="sales_detailed" className="mt-0 outline-none animate-in fade-in-50 duration-500">
                    <SalesDetailedReport />
                </TabsContent>

                <TabsContent value="orders" className="mt-0 outline-none animate-in fade-in-50 duration-500">
                    <OrdersReport />
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
