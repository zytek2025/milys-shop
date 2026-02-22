'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, FileText, Search } from 'lucide-react';
import { PrintButton } from '../shared/PrintButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function OrdersReport() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function fetchOrders() {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/reports?type=orders_list&status=${statusFilter}&period=all`);
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data.orders || []);
                }
            } catch (error) {
                console.error('Error fetching orders for report:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchOrders();
    }, [statusFilter]);

    const filteredOrders = orders.filter(o =>
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.customer_email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statusMap: Record<string, string> = {
        'pending': 'Pendiente',
        'evaluating': 'En Verificación',
        'processing': 'Procesando',
        'shipped': 'Enviado',
        'delivered': 'Entregado',
        'cancelled': 'Cancelado',
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse text-xs font-bold uppercase italic">Generando listado de pedidos...</div>;
    }

    return (
        <div className="space-y-6">
            <header className="report-header">
                <h1 className="text-2xl font-black uppercase italic tracking-tighter">Mily's Premium Shop</h1>
                <p className="text-sm font-bold uppercase italic opacity-70">Listado de Pedidos — Generado el {new Date().toLocaleDateString()}</p>
            </header>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl font-bold uppercase italic text-[10px]">
                            <SelectValue placeholder="Filtrar por estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value="pending">Pendientes</SelectItem>
                            <SelectItem value="processing">En Proceso/Producción</SelectItem>
                            <SelectItem value="delivered">Entregados</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="relative w-full sm:w-[250px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por ID o Email..."
                            className="pl-9 h-10 rounded-xl text-[10px] font-bold uppercase italic"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <PrintButton label="Imprimir Listado de Pedidos" />
            </div>

            <Card className="border-2 shadow-sm print:border-none print:shadow-none">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b print:bg-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-sm font-black uppercase italic tracking-tighter flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4 text-primary" /> Reporte de Pedidos
                            </CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase italic">
                                Mostrando {filteredOrders.length} pedidos encontrados.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100 dark:bg-slate-800/50 text-[9px] font-black uppercase italic tracking-widest text-muted-foreground border-b print:bg-slate-50">
                                    <th className="px-4 py-3">ID Pedido</th>
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3">Cliente</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[10px] font-bold italic">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50 transition-colors print:hover:bg-transparent">
                                        <td className="px-4 py-3 font-mono text-[9px] uppercase">{order.id.split('-')[0]}</td>
                                        <td className="px-4 py-3">{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 truncate max-w-[150px]">{order.customer_email || 'Sin email'}</td>
                                        <td className="px-4 py-3">
                                            <span className="print:hidden">
                                                <Badge variant="outline" className="text-[8px] uppercase italic h-5">
                                                    {statusMap[order.status] || order.status}
                                                </Badge>
                                            </span>
                                            <span className="hidden print:inline">
                                                {statusMap[order.status] || order.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-black">${Number(order.total).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
