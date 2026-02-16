'use client';

import { useState, useEffect } from 'react';
import {
    ShoppingBag,
    Search,
    Clock,
    CheckCircle2,
    Truck,
    XCircle,
    MessageCircle,
    Eye,
    Printer,
    Loader2,
    Info,
    RefreshCcw,
    Shirt,
    AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());

    // Exchange States
    const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
    const [itemToExchange, setItemToExchange] = useState<any | null>(null);
    const [allVariants, setAllVariants] = useState<any[]>([]);
    const [exchangeVariantId, setExchangeVariantId] = useState('');
    const [exchangeQty, setExchangeQty] = useState(1);
    const [exchangeReason, setExchangeReason] = useState('');
    const [isExchanging, setIsExchanging] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/admin/orders');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch');
            setOrders(Array.isArray(data) ? data : []);
        } catch (error: any) {
            toast.error(error.message || 'Error al cargar pedidos');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        setProcessingOrders(prev => new Set(prev).add(id));
        try {
            const res = await fetch(`/api/admin/orders/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(`Pedido actualizado a ${newStatus}`);
                setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus, crm_synced: data.crm_synced || o.crm_synced } : o));
            } else {
                toast.error(data.error || 'Error al actualizar');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al actualizar estado');
        } finally {
            setProcessingOrders(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleDeleteOrder = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este pedido por completo? Esta acción no se puede deshacer.')) return;

        setProcessingOrders(prev => new Set(prev).add(id));
        try {
            const res = await fetch(`/api/admin/orders/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success('Pedido eliminado correctamente');
                setOrders(prev => prev.filter(o => o.id !== id));
                setIsDetailsOpen(false);
            } else {
                const data = await res.json();
                toast.error(data.error || 'Error al eliminar pedido');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al conectar con la API');
        } finally {
            setProcessingOrders(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleUpdateItemQuantity = async (orderId: string, itemId: string, newQty: number) => {
        try {
            const res = await fetch(`/api/admin/orders/${orderId}/items/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: newQty }),
            });
            if (res.ok) {
                const data = await res.json();
                toast.success('Cantidad actualizada');
                setOrders(prev => prev.map(o => o.id === orderId
                    ? {
                        ...o,
                        total: data.newTotal,
                        order_items: o.order_items.map((item: any) =>
                            item.id === itemId ? { ...item, quantity: newQty } : item
                        )
                    }
                    : o
                ));
                if (selectedOrder?.id === orderId) {
                    setSelectedOrder((prev: any) => ({
                        ...prev,
                        total: data.newTotal,
                        order_items: prev.order_items.map((item: any) =>
                            item.id === itemId ? { ...item, quantity: newQty } : item
                        )
                    }));
                }
            }
        } catch (error: any) {
            toast.error('Error al actualizar item');
        }
    };

    const handleDeleteItem = async (orderId: string, itemId: string) => {
        if (!confirm('¿Eliminar este item del pedido?')) return;
        try {
            const res = await fetch(`/api/admin/orders/${orderId}/items/${itemId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                const data = await res.json();
                toast.success('Item eliminado');

                if (data.orderDeleted) {
                    setOrders(prev => prev.filter(o => o.id !== orderId));
                    setIsDetailsOpen(false);
                } else {
                    setOrders(prev => prev.map(o => o.id === orderId
                        ? {
                            ...o,
                            total: data.newTotal,
                            order_items: o.order_items.filter((item: any) => item.id !== itemId)
                        }
                        : o
                    ));
                    if (selectedOrder?.id === orderId) {
                        setSelectedOrder((prev: any) => ({
                            ...prev,
                            total: data.newTotal,
                            order_items: prev.order_items.filter((item: any) => item.id !== itemId)
                        }));
                    }
                }
            }
        } catch (error: any) {
            toast.error('Error al eliminar item');
        }
    };

    const handleExchangeItem = async () => {
        if (!exchangeVariantId) return toast.error('Selecciona el nuevo producto');
        setIsExchanging(true);
        try {
            const res = await fetch(`/api/admin/orders/${selectedOrder.id}/items/${itemToExchange.id}/exchange`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newVariantId: exchangeVariantId,
                    newQuantity: exchangeQty,
                    reason: exchangeReason
                })
            });

            if (res.ok) {
                toast.success('Intercambio realizado');
                setIsExchangeModalOpen(false);
                setExchangeVariantId('');
                setExchangeQty(1);
                setExchangeReason('');
                // Refresh order
                fetchOrders();
                const updated = await fetch(`/api/admin/orders/${selectedOrder.id}`).then(r => r.json());
                setSelectedOrder(updated);
            } else {
                const data = await res.json();
                toast.error(data.error || 'Error al procesar intercambio');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setIsExchanging(false);
        }
    };

    const fetchAllVariants = async () => {
        try {
            const res = await fetch('/api/admin/products');
            const data = await res.json();
            const flattened = data.flatMap((p: any) =>
                (p.product_variants || []).map((v: any) => ({
                    ...v,
                    product_name: p.name
                }))
            );
            setAllVariants(flattened);
        } catch (error) {
            console.error('Error fetching variants');
        }
    };

    useEffect(() => {
        if (isExchangeModalOpen) fetchAllVariants();
    }, [isExchangeModalOpen]);

    const statusMap: any = {
        pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500', icon: Clock },
        processing: { label: 'En Proceso', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500', icon: Loader2 },
        shipped: { label: 'Enviado', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500', icon: Truck },
        completed: { label: 'Completado', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500', icon: CheckCircle2 },
        cancelled: { label: 'Cancelado', color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-500', icon: XCircle },
    };

    const filteredOrders = orders.filter(o =>
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Seguimiento de Pedidos</h1>
                    <p className="text-muted-foreground">Gestiona los pedidos y estados de envío.</p>
                </div>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader className="pb-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Buscar por ID, Email o Nombre..."
                            className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                    <TableHead>ID Pedido</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                                <span>Cargando pedidos...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                            No hay pedidos activos.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredOrders.map((order) => {
                                        const personalization = order.metadata?.personalization || order.personalization || null;
                                        const personalizationText = personalization?.text || (typeof personalization === 'string' ? personalization : null);
                                        const personalizationSize = personalization?.size || null;
                                        const personalizationPrice = personalization?.price || 0;

                                        const status = statusMap[order.status] || statusMap.pending;
                                        const hasOnDemand = order.order_items?.some((item: any) =>
                                            item.custom_metadata?.on_request === true
                                        );
                                        return (
                                            <TableRow key={order.id} className="border-slate-100 dark:border-slate-800 group">
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    #{order.id.slice(0, 8)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {order.profiles?.full_name || order.profiles?.email?.split('@')[0] || 'Cliente'}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">{order.profiles?.email}</span>
                                                        {order.payment_method && (
                                                            <span className="text-[10px] font-bold uppercase text-primary mt-1">
                                                                Pago: {order.payment_method}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <span className={cn(
                                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                                                            status.color
                                                        )}>
                                                            <status.icon size={12} className={order.status === 'processing' ? 'animate-spin' : ''} />
                                                            {status.label}
                                                        </span>
                                                        {personalizationText && (
                                                            <div className="mt-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <p className="text-[9px] uppercase font-black text-primary">Texto de Personalización:</p>
                                                                    {personalizationSize && (
                                                                        <span className="text-[8px] font-bold bg-primary/10 px-1.5 py-0.5 rounded text-primary">
                                                                            {personalizationSize === 'small' ? 'Pequeño' : 'Grande'} (+${personalizationPrice})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm font-medium italic">"{personalizationText}"</p>
                                                            </div>
                                                        )}
                                                        {order.crm_synced && (
                                                            <span className="text-[9px] font-black uppercase text-emerald-500 flex items-center gap-1">
                                                                <CheckCircle2 size={10} /> Sincronizado CRM
                                                            </span>
                                                        )}
                                                        {hasOnDemand && (
                                                            <span className="text-[9px] font-black uppercase text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full w-fit">
                                                                <Info size={10} /> Bajo Pedido
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-semibold">${order.total?.toFixed(2) || '0.00'}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2 items-center">
                                                        {order.status === 'pending' && (
                                                            <Button
                                                                size="sm"
                                                                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold italic text-[10px] uppercase rounded-lg shadow-lg shadow-emerald-500/20 gap-2"
                                                                onClick={() => handleStatusUpdate(order.id, 'processing')}
                                                                disabled={processingOrders.has(order.id)}
                                                            >
                                                                {processingOrders.has(order.id) ? (
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    'Confirmar Pago'
                                                                )}
                                                            </Button>
                                                        )}
                                                        {order.status === 'processing' && (
                                                            <Button
                                                                size="sm"
                                                                className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold italic text-[10px] uppercase rounded-lg shadow-lg shadow-blue-500/20 gap-2 px-3"
                                                                onClick={() => handleStatusUpdate(order.id, 'shipped')}
                                                                disabled={processingOrders.has(order.id)}
                                                            >
                                                                {processingOrders.has(order.id) ? (
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    'Marcar Enviado'
                                                                )}
                                                            </Button>
                                                        )}

                                                        {order.status === 'shipped' && (
                                                            <Button
                                                                size="sm"
                                                                className="h-8 bg-purple-600 hover:bg-purple-700 text-white font-bold italic text-[10px] uppercase rounded-lg shadow-lg shadow-purple-500/20 gap-2 px-3"
                                                                onClick={() => handleStatusUpdate(order.id, 'completed')}
                                                                disabled={processingOrders.has(order.id)}
                                                            >
                                                                {processingOrders.has(order.id) ? (
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    'Marcar Entregado'
                                                                )}
                                                            </Button>
                                                        )}

                                                        <div className="flex gap-1 border rounded-lg p-0.5 bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className={cn("h-7 px-2 text-[10px]", order.status === 'pending' && "bg-white shadow-sm font-bold text-primary")}
                                                                onClick={() => handleStatusUpdate(order.id, 'pending')}
                                                                disabled={processingOrders.has(order.id)}
                                                            >
                                                                Pend.
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className={cn("h-7 px-2 text-[10px]", order.status === 'cancelled' && "bg-white shadow-sm font-bold text-rose-500")}
                                                                onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                                                                disabled={processingOrders.has(order.id)}
                                                            >
                                                                Canc.
                                                            </Button>
                                                        </div>
                                                        <div className="flex gap-1 border rounded-lg p-0.5 bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
                                                                onClick={() => {
                                                                    setSelectedOrder(order);
                                                                    setIsDetailsOpen(true);
                                                                }}
                                                            >
                                                                <Eye size={16} />
                                                            </Button>
                                                            {order.profiles?.whatsapp && (
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500 hover:bg-emerald-50 rounded-lg" asChild>
                                                                    <a href={`https://wa.me/${order.profiles.whatsapp}`} target="_blank" rel="noreferrer">
                                                                        <MessageCircle size={16} />
                                                                    </a>
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                                                onClick={() => handleDeleteOrder(order.id)}
                                                                disabled={processingOrders.has(order.id)}
                                                            >
                                                                <XCircle size={16} />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-[700px] rounded-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="flex flex-row items-center justify-between">
                        <DialogTitle className="flex items-center gap-2">
                            <ShoppingBag className="text-primary" />
                            Detalles del Pedido #{selectedOrder?.id?.slice(0, 8)}
                        </DialogTitle>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="mr-8 rounded-xl gap-2 font-bold uppercase text-[10px]"
                                onClick={() => window.print()}
                            >
                                <Printer size={14} /> Imprimir Hoja de Producción
                            </Button>
                        </div>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-6 py-4 print:p-0">
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Cliente</p>
                                    <p className="font-bold">{selectedOrder.profiles?.full_name || 'Cliente'}</p>
                                    <p className="text-xs text-muted-foreground">{selectedOrder.profiles?.email}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">WhatsApp</p>
                                    <p className="text-xs">{selectedOrder.profiles?.whatsapp || 'No proporcionado'}</p>
                                </div>
                                <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Saldo a Favor Acumulado</p>
                                    <p className={cn(
                                        "text-sm font-black italic",
                                        (selectedOrder.profiles?.balance || 0) > 0 ? "text-emerald-600" : "text-slate-400"
                                    )}>
                                        ${(selectedOrder.profiles?.balance || 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold flex items-center gap-2">
                                        <span className="w-1 h-3 bg-primary rounded-full"></span>
                                        Artículos en el Pedido
                                    </h3>
                                    <p className="text-sm font-black text-primary">Total: ${selectedOrder.total?.toFixed(2)}</p>
                                </div>
                                <div className="space-y-3">
                                    {selectedOrder.order_items?.map((item: any) => {
                                        const metadata = item.custom_metadata || {};
                                        const isNewFormat = !Array.isArray(metadata) && metadata.designs;
                                        const designs = isNewFormat ? metadata.designs : (Array.isArray(metadata) ? metadata : []);
                                        const personalization = isNewFormat ? metadata.personalization : null;
                                        const personalizationText = personalization?.text || personalization;
                                        const personalizationSize = personalization?.size || null;

                                        return (
                                            <div key={item.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-3 shadow-sm group/item relative">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-bold">{item.products?.name || 'Producto'}</p>
                                                        <p className="text-[10px] uppercase font-bold text-slate-400">
                                                            {item.product_variants ? `Talla: ${item.product_variants.size} | Color: ${item.product_variants.color}` : 'Sin variantes'}
                                                        </p>
                                                        {metadata.on_request && (
                                                            <Badge variant="outline" className="mt-1 bg-amber-100 text-amber-700 border-amber-200 text-[8px] font-black uppercase py-0 px-1.5 h-4">
                                                                Bajo Pedido
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-lg px-2 py-1 border border-slate-100 dark:border-slate-800">
                                                            <button
                                                                onClick={() => handleUpdateItemQuantity(selectedOrder.id, item.id, Math.max(1, item.quantity - 1))}
                                                                className="text-primary hover:bg-white p-1 rounded transition-colors"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="font-bold text-xs w-4 text-center">{item.quantity}</span>
                                                            <button
                                                                onClick={() => handleUpdateItemQuantity(selectedOrder.id, item.id, item.quantity + 1)}
                                                                className="text-primary hover:bg-white p-1 rounded transition-colors"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-primary hover:bg-primary/5 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                                            onClick={() => {
                                                                setItemToExchange(item);
                                                                setExchangeQty(item.quantity);
                                                                setIsExchangeModalOpen(true);
                                                            }}
                                                            title="Intercambiar producto"
                                                        >
                                                            <RefreshCcw size={14} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-rose-500 hover:bg-rose-50 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                                            onClick={() => handleDeleteItem(selectedOrder.id, item.id)}
                                                        >
                                                            <XCircle size={14} />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {designs.length > 0 && (
                                                    <div className="pt-2 border-t border-dashed">
                                                        <p className="text-[9px] uppercase font-black text-slate-500 mb-2">Diseños Aplicados:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {designs.map((d: any, idx: number) => (
                                                                <div key={idx} className="bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 min-w-[120px]">
                                                                    <p className="text-[10px] font-bold truncate">{d.name}</p>
                                                                    <p className="text-[8px] text-primary uppercase font-black mt-0.5">
                                                                        {d.size || 'Base'} @ {d.location || 'Centro'}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {personalizationText && (
                                                    <div className="mt-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                                                        <p className="text-[9px] uppercase font-black text-primary mb-1">
                                                            Texto de Personalización {personalizationSize && `(${personalizationSize === 'small' ? 'Pequeño' : 'Grande'})`}:
                                                        </p>
                                                        <p className="text-sm font-medium italic">"{personalizationText}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {/* Exchange Modal */}
            <Dialog open={isExchangeModalOpen} onOpenChange={setIsExchangeModalOpen}>
                <DialogContent className="sm:max-w-[450px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 italic font-black uppercase tracking-tighter">
                            <RefreshCcw className="text-primary" />
                            Intercambio de Producto
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Producto Actual</p>
                            <p className="font-bold text-sm tracking-tight">{itemToExchange?.products?.name}</p>
                            <p className="text-xs uppercase font-black text-primary">
                                {itemToExchange?.product_variants?.size} / {itemToExchange?.product_variants?.color}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase italic">Nuevo Producto / Talla / Color</label>
                            <select
                                className="w-full rounded-xl border-2 h-10 px-3 text-xs bg-white dark:bg-slate-950 font-medium"
                                value={exchangeVariantId}
                                onChange={(e) => setExchangeVariantId(e.target.value)}
                            >
                                <option value="">Selecciona una variante...</option>
                                {allVariants.map(v => (
                                    <option key={v.id} value={v.id}>
                                        {v.product_name} - {v.size} / {v.color} (${v.price || 0})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase italic">Cantidad</label>
                                <Input
                                    type="number"
                                    value={exchangeQty}
                                    onChange={(e) => setExchangeQty(Number(e.target.value))}
                                    className="rounded-xl border-2"
                                    min={1}
                                />
                            </div>
                            <div className="flex items-end">
                                <Badge variant="outline" className="h-10 w-full flex items-center justify-center text-[8px] bg-amber-50 text-amber-700 italic border-amber-200">
                                    Mantiene precio o mayor
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase italic">Motivo del Cambio</label>
                            <Input
                                placeholder="Ej: Error de talla, defecto de fábrica..."
                                value={exchangeReason}
                                onChange={(e) => setExchangeReason(e.target.value)}
                                className="rounded-xl border-2"
                            />
                        </div>

                        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20 flex flex-col gap-2">
                            <div className="flex gap-2">
                                <AlertCircle className="text-blue-500 shrink-0" size={16} />
                                <div className="space-y-1">
                                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-black uppercase italic">Resumen de Ajuste</p>
                                    {exchangeVariantId ? (() => {
                                        const selected = allVariants.find(v => v.id === exchangeVariantId);
                                        const oldVal = (itemToExchange?.unit_price || 0) * (itemToExchange?.quantity || 1);
                                        const newVal = (selected?.price || 0) * (exchangeQty || 1);
                                        const diff = oldVal - newVal;

                                        return (
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-bold">
                                                    Valor Original: <span className="text-slate-500">${oldVal.toFixed(2)}</span>
                                                </p>
                                                <p className="text-[11px] font-bold">
                                                    Nuevo Valor: <span className="text-slate-500">${newVal.toFixed(2)}</span>
                                                </p>
                                                <div className="pt-1 border-t border-blue-200 dark:border-blue-800">
                                                    {diff > 0 ? (
                                                        <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                                                            A FAVOR CLIENTE: ${diff.toFixed(2)} (Se creará crédito)
                                                        </p>
                                                    ) : diff < 0 ? (
                                                        <p className="text-[11px] font-black text-rose-600 dark:text-rose-400">
                                                            EXCEDENTE A PAGAR: ${Math.abs(diff).toFixed(2)}
                                                        </p>
                                                    ) : (
                                                        <p className="text-[11px] font-black text-blue-600 dark:text-blue-400">
                                                            CAMBIO SIN DIFERENCIA DE COSTO
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })() : (
                                        <p className="text-[9px] text-blue-700/70 dark:text-blue-400/70 font-medium leading-normal">
                                            Selecciona un producto para calcular la diferencia de precio y el posible saldo a favor.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            className="w-full font-black uppercase italic rounded-xl"
                            onClick={handleExchangeItem}
                            disabled={isExchanging || !exchangeVariantId}
                        >
                            {isExchanging ? <Loader2 className="animate-spin h-4 w-4" /> : 'Procesar Intercambio'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
