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
    RotateCcw,
    TrendingUp
} from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());

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

    const statusMap: any = {
        pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500', icon: Clock },
        processing: { label: 'En Proceso', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500', icon: Loader2 },
        shipped: { label: 'Enviado', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500', icon: Truck },
        completed: { label: 'Completado', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500', icon: CheckCircle2 },
        cancelled: { label: 'Cancelado', color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-500', icon: XCircle },
    };

    const handleProcessReturn = async (item: any) => {
        const amountStr = prompt(`¿Cuánto saldo a favor deseas abonar por ${item.quantity} unidad(es) de ${item.products.name}? (Sugerido: $${(item.price * item.quantity).toFixed(2)})`, (item.price * item.quantity).toString());

        if (amountStr === null) return;
        const amount = parseFloat(amountStr);
        if (isNaN(amount)) return toast.error("Monto inválido");

        const reason = prompt("¿Cuál es el motivo de la devolución?", "Producto defectuoso o cambio de opinión");
        if (reason === null) return;

        try {
            const res = await fetch('/api/admin/inventory/returns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profile_id: selectedOrder.profile_id,
                    variant_id: item.variant_id,
                    quantity: item.quantity,
                    amount_to_credit: amount,
                    reason,
                    order_id: selectedOrder.id,
                    order_item_id: item.id,
                    product_id: item.products?.id
                })
            });

            if (res.ok) {
                toast.success("Devolución procesada con éxito. Stock y crédito actualizados.");
                fetchOrders(); // Refresh to update is_returned flag (future implementation: update order item metadata)
                setIsDetailsOpen(false);
            } else {
                const data = await res.json();
                toast.error(data.error || "Error al procesar devolución");
            }
        } catch (error) {
            toast.error("Error de conexión");
        }
    };

    const filteredOrders = orders.filter(o =>
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Seguimiento de Pedidos</h1>
                <p className="text-muted-foreground">Gestiona los pedidos y estados de envío.</p>
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
                                    <TableHead>ID</TableHead>
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
                                        // Assuming personalization data is directly on the order object or within a metadata field
                                        // Adjust this logic based on your actual data structure
                                        const metadata = order.metadata || {};
                                        const isNewFormat = !Array.isArray(metadata) && !!metadata.designs;
                                        const personalization = isNewFormat ? metadata.personalization : (metadata.personalization || order.personalization || null);
                                        const personalizationText = personalization?.text || (typeof personalization === 'string' ? personalization : null);
                                        const personalizationSize = personalization?.size || null;
                                        const personalizationPrice = personalization?.price || 0;

                                        const status = statusMap[order.status] || statusMap.pending;
                                        return (
                                            <TableRow key={order.id} className="group border-slate-100 dark:border-slate-800">
                                                <TableCell>
                                                    <Badge variant="outline" className="font-mono text-[9px] bg-slate-50 dark:bg-slate-900">
                                                        {order.control_id || '---'}
                                                    </Badge>
                                                </TableCell>
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
                        <Button
                            variant="outline"
                            size="sm"
                            className="mr-8 rounded-xl gap-2 font-bold uppercase text-[10px]"
                            onClick={() => window.print()}
                        >
                            <Printer size={14} /> Imprimir Hoja de Producción
                        </Button>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-6 py-4 print:p-0">
                            {/* PRODUCTION SHEET PRINTABLE SECTION */}
                            <div className="hidden print:block space-y-8 p-8 bg-white text-black">
                                <div className="border-b-2 border-black pb-4 flex justify-between items-end">
                                    <div>
                                        <h1 className="text-3xl font-black uppercase italic tracking-tighter">HOJA DE PRODUCCIÓN</h1>
                                        <p className="text-sm font-bold">PEDIDO: #{selectedOrder.id}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold uppercase">FECHA: {new Date(selectedOrder.created_at).toLocaleString()}</p>
                                        <p className="text-xs font-bold uppercase">CLIENTE: {selectedOrder.profiles?.full_name}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {selectedOrder.order_items?.map((item: any, idx: number) => {
                                        const metadata = item.custom_metadata || {};
                                        const isNewFormat = !Array.isArray(metadata) && !!metadata.designs;
                                        const designs = isNewFormat ? metadata.designs : (Array.isArray(metadata) ? metadata : []);
                                        const personalization = isNewFormat ? metadata.personalization : null;
                                        const personalizationText = personalization?.text || personalization;
                                        const personalizationSize = personalization?.size || null;
                                        const personalizationPrice = personalization?.price || 0;

                                        return (
                                            <div key={idx} className="border-2 border-black p-4 space-y-4 break-inside-avoid mb-6">
                                                <div className="flex justify-between border-b-2 border-black pb-2">
                                                    <span className="text-xl font-black uppercase">{item.products?.name}</span>
                                                    <span className="text-2xl font-black">CANT: {item.quantity}</span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-slate-100 p-3 border border-black">
                                                        <p className="text-[10px] font-black uppercase mb-1">Especificaciones Prenda</p>
                                                        <p className="text-lg font-bold">Talla: {item.product_variants?.size || 'N/A'}</p>
                                                        <p className="text-lg font-bold">Color: {item.product_variants?.color || 'N/A'}</p>
                                                    </div>

                                                    {personalizationText && (
                                                        <div className="bg-slate-100 p-3 border border-black">
                                                            <p className="text-[10px] font-black uppercase mb-1">Personalización Texto</p>
                                                            <p className="text-lg font-bold italic">"{personalizationText}"</p>
                                                            <p className="text-xs font-black uppercase mt-1">
                                                                TAMAÑO: {personalizationSize === 'small' ? 'PEQUEÑO' : 'GRANDE'}
                                                                <span className="ml-2 font-normal text-[10px]">(${personalizationPrice.toFixed(2)})</span>
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {designs.length > 0 && (
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] font-black uppercase border-b border-black">Diseños / Logos Aplicados</p>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {designs.map((d: any, dIdx: number) => (
                                                                <div key={dIdx} className="border border-black p-2 flex gap-3 items-center bg-white">
                                                                    <div className="w-16 h-16 bg-white border border-slate-200 flex-shrink-0">
                                                                        <img src={d.image_url} className="w-full h-full object-contain" alt="" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-[11px] font-black uppercase leading-tight truncate">{d.name}</p>
                                                                        <p className="text-[10px] font-bold mt-1 tracking-tight">TAMAÑO: <span className="bg-black text-white px-1 tracking-normal">{d.size?.toUpperCase() || 'BASE'}</span></p>
                                                                        <p className="text-[10px] font-bold truncate">POSICIÓN: {d.location?.toUpperCase()}</p>
                                                                        <p className="text-[9px] font-black text-primary mt-1">${(d.price || 0).toFixed(2)}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* PREVIEW SECTION (Standard UI) */}
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
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <span className="w-1 h-3 bg-primary rounded-full"></span>
                                    Artículos en el Pedido
                                </h3>
                                <div className="space-y-3">
                                    {selectedOrder.order_items?.map((item: any) => {
                                        const metadata = item.custom_metadata || {};
                                        const isNewFormat = !Array.isArray(metadata) && metadata.designs;
                                        const designs = isNewFormat ? metadata.designs : (Array.isArray(metadata) ? metadata : []);
                                        const personalization = isNewFormat ? metadata.personalization : null;
                                        const personalizationText = personalization?.text || personalization;
                                        const personalizationSize = personalization?.size || null;
                                        const personalizationPrice = personalization?.price || 0;

                                        const basePrice = item.price || item.product_variants?.price_override || item.products?.price || 0;
                                        const designsPrice = designs.reduce((sum: number, d: any) => sum + (d.price || 0), 0);
                                        const itemTotal = (basePrice + designsPrice + personalizationPrice) * item.quantity;

                                        return (
                                            <div key={item.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-3 shadow-sm">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-bold text-lg">{item.products?.name || 'Producto'}</p>
                                                        <div className="flex gap-2 mt-1">
                                                            {item.product_variants?.size && (
                                                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-black uppercase">Talla {item.product_variants.size}</span>
                                                            )}
                                                            {item.product_variants?.color && (
                                                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-black uppercase flex items-center gap-1">
                                                                    <div className="w-2 h-2 rounded-full border border-white" style={{ backgroundColor: item.product_variants.color_hex || '#000' }} />
                                                                    {item.product_variants.color}
                                                                </span>
                                                            )}
                                                            {item.custom_metadata?.is_returned && (
                                                                <Badge className="bg-rose-50 text-rose-600 border-rose-100 text-[8px] font-black uppercase">Devuelto</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className="font-bold text-primary">CANT: {item.quantity}</p>
                                                            <p className="text-xs font-black">${itemTotal.toFixed(2)}</p>
                                                        </div>
                                                        {!item.custom_metadata?.is_returned && selectedOrder.status === 'completed' && (
                                                            <Button
                                                                size="icon"
                                                                variant="outline"
                                                                className="h-8 w-8 rounded-lg text-blue-600 border-blue-100 hover:bg-blue-50"
                                                                title="Procesar Devolución"
                                                                onClick={() => handleProcessReturn(item)}
                                                            >
                                                                <RotateCcw size={14} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-dashed">
                                                    {designs.length > 0 && (
                                                        <div>
                                                            <p className="text-[9px] uppercase font-black text-slate-500 mb-2 tracking-widest">Diseños Aplicados:</p>
                                                            <div className="space-y-2">
                                                                {designs.map((d: any, idx: number) => (
                                                                    <div key={idx} className="bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                                                        <div>
                                                                            <p className="text-[10px] font-bold truncate">{d.name}</p>
                                                                            <p className="text-[8px] text-slate-400 uppercase font-black mt-0.5">
                                                                                {d.size || 'Base'} @ {d.location || 'Centro'}
                                                                            </p>
                                                                        </div>
                                                                        <span className="text-[9px] font-black text-primary">${(d.price || 0).toFixed(2)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {personalizationText && (
                                                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 h-fit">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <p className="text-[9px] uppercase font-black text-primary">Personalización:</p>
                                                                <span className="text-[9px] font-black text-primary">${personalizationPrice.toFixed(2)}</span>
                                                            </div>
                                                            <p className="text-sm font-medium italic">"{personalizationText}"</p>
                                                            <p className="text-[8px] font-bold text-primary/60 uppercase mt-1">
                                                                Tam: {personalizationSize === 'small' ? 'Pequeño' : 'Grande'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
