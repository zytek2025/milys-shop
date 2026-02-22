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
    TrendingUp,
    Palette,
    Plus,
    Banknote
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
    const [editingItem, setEditingItem] = useState<{ id: string, price: string } | null>(null);
    const [editingMetadata, setEditingMetadata] = useState<string | null>(null);
    const [tempMetadata, setTempMetadata] = useState<any>(null);
    const [paymentProofs, setPaymentProofs] = useState<any[]>([]);
    const [financeAccounts, setFinanceAccounts] = useState<any[]>([]);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [paymentTargetOrderId, setPaymentTargetOrderId] = useState<string | null>(null);
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [verifyingPaymentId, setVerifyingPaymentId] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
        fetchFinanceAccounts();
    }, []);

    const fetchFinanceAccounts = async () => {
        try {
            const res = await fetch('/api/admin/finances/accounts');
            if (res.ok) {
                const data = await res.json();
                setFinanceAccounts(data);
            }
        } catch (error) {
            console.error('Error fetching finance accounts:', error);
        }
    };

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

    const handleStatusUpdate = async (id: string, newStatus: string, financeData?: any) => {
        setProcessingOrders(prev => new Set(prev).add(id));
        try {
            const res = await fetch(`/api/admin/orders/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    finance_data: financeData
                }),
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

    useEffect(() => {
        if (selectedOrder && isDetailsOpen) {
            fetchPaymentProofs(selectedOrder.id);
        } else {
            setPaymentProofs([]);
            setEditingItem(null);
        }
    }, [selectedOrder, isDetailsOpen]);

    const fetchPaymentProofs = async (orderId: string) => {
        try {
            const res = await fetch(`/api/orders/${orderId}/confirm-payment`);
            if (res.ok) {
                const data = await res.json();
                setPaymentProofs(Array.isArray(data) ? data : (data ? [data] : []));
            }
        } catch (error) {
            console.error('Error fetching payment proofs:', error);
        }
    };

    const handleVerifyPayment = async (orderId: string, confirmationId: string, status: 'approved' | 'rejected', accountId?: string) => {
        setVerifyingPaymentId(confirmationId);
        try {
            const res = await fetch(`/api/admin/orders/${orderId}/verify-payment`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    confirmation_id: confirmationId,
                    status,
                    account_id: accountId
                }),
            });

            if (res.ok) {
                toast.success(status === 'approved' ? 'Pago verificado y registrado' : 'Pago rechazado');
                fetchPaymentProofs(orderId);
                refreshOrder();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Error al procesar verificación');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error de conexión');
        } finally {
            setVerifyingPaymentId(null);
        }
    };

    const handlePriceUpdate = async (item: any) => {
        if (!editingItem) return;
        const newPrice = parseFloat(editingItem.price);
        if (isNaN(newPrice)) return toast.error("Precio inválido");

        try {
            const res = await fetch(`/api/admin/orders/${selectedOrder.id}/items/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unit_price: newPrice }),
            });

            if (res.ok) {
                toast.success("Precio actualizado");
                setEditingItem(null);
                refreshOrder();
            } else {
                const data = await res.json();
                toast.error(data.error || "Error al actualizar precio");
            }
        } catch (error) {
            toast.error("Error de conexión");
        }
    };

    const handleMetadataUpdate = async (itemId: string) => {
        try {
            const res = await fetch(`/api/admin/orders/${selectedOrder.id}/items/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ custom_metadata: tempMetadata }),
            });

            if (res.ok) {
                toast.success("Diseño actualizado");
                setEditingMetadata(null);
                refreshOrder();
            } else {
                const data = await res.json();
                toast.error(data.error || "Error al actualizar diseño");
            }
        } catch (error) {
            toast.error("Error de conexión");
        }
    };

    const refreshOrder = async () => {
        const updatedOrders = await fetch('/api/admin/orders').then(r => r.json());
        setOrders(Array.isArray(updatedOrders) ? updatedOrders : []);
        const updatedOrder = updatedOrders.find((o: any) => o.id === selectedOrder?.id);
        if (updatedOrder) setSelectedOrder(updatedOrder);
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
                    profile_id: selectedOrder.user_id,
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

    const handleNotionSync = async (orderId: string) => {
        try {
            const res = await fetch('/api/admin/notion/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderId }),
            });

            if (res.ok) {
                toast.success("Sincronizado con Notion");
                refreshOrder();
            } else {
                const data = await res.json();
                toast.error(data.error || "Error al sincronizar con Notion");
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
                                        const hasReturn = order.order_items?.some((item: any) => item.custom_metadata?.is_returned);

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
                                                        {hasReturn && (
                                                            <Badge className="bg-rose-50 text-rose-600 border-rose-100 text-[9px] font-black uppercase flex items-center gap-1 w-fit">
                                                                <RotateCcw size={10} /> Devolución
                                                            </Badge>
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
                                                                onClick={() => {
                                                                    setPaymentTargetOrderId(order.id);
                                                                    setIsPaymentDialogOpen(true);
                                                                }}
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
                                                            {order.status === 'completed' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                                    title="Ver Detalles / Procesar Devolución"
                                                                    onClick={() => {
                                                                        setSelectedOrder(order);
                                                                        setIsDetailsOpen(true);
                                                                    }}
                                                                >
                                                                    <RotateCcw size={16} />
                                                                </Button>
                                                            )}
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
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "rounded-xl gap-2 font-bold uppercase text-[10px]",
                                    selectedOrder?.notion_synced ? "text-emerald-500 border-emerald-100 bg-emerald-50" : "text-slate-500"
                                )}
                                onClick={() => handleNotionSync(selectedOrder.id)}
                            >
                                <Palette size={14} className={selectedOrder?.notion_synced ? "fill-emerald-500" : ""} />
                                {selectedOrder?.notion_synced ? 'Sincronizado Notion' : 'Sync Notion'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl gap-2 font-bold uppercase text-[10px]"
                                onClick={() => window.print()}
                            >
                                <Printer size={14} /> Imprimir Hoja de Producción
                            </Button>
                        </div>
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
                                        const isNewFormat = !Array.isArray(metadata) && (!!metadata.designs || !!metadata.budget_request);

                                        let designs = (isNewFormat ? (metadata.designs || []) : (Array.isArray(metadata) ? metadata : [])) as any[];
                                        if (metadata.budget_request) {
                                            if (metadata.budget_request.designs) {
                                                designs = [...designs, ...metadata.budget_request.designs];
                                            } else if (metadata.budget_request.image_url) {
                                                designs = [...designs, { image_url: metadata.budget_request.image_url }];
                                            }
                                        }

                                        const personalization = isNewFormat ? metadata.personalization : null;
                                        const personalizationText = personalization?.text || (typeof personalization === 'string' ? personalization : null);
                                        const personalizationSize = personalization?.size || null;
                                        const personalizationPrice = personalization?.price || 0;
                                        const instructions = isNewFormat ? (metadata.instructions || metadata?.budget_request?.notes) : (metadata.instructions || null);

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
                                                                        <p className="text-[11px] font-black uppercase leading-tight truncate">{d.name || 'Diseño de Cliente'}</p>
                                                                        {d.size && <p className="text-[10px] font-bold mt-1 tracking-tight">TAMAÑO: <span className="bg-black text-white px-1 tracking-normal">{d.size?.toUpperCase() || 'BASE'}</span></p>}
                                                                        {d.location && <p className="text-[10px] font-bold truncate">POSICIÓN: {d.location?.toUpperCase()}</p>}
                                                                        <p className="text-[9px] font-black text-primary mt-1">${(d.price || 0).toFixed(2)}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {instructions && (
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black uppercase border-b border-black">Instrucciones Especiales</p>
                                                        <p className="text-[11px] font-medium leading-tight">{instructions}</p>
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
                                        const isNewFormat = !Array.isArray(metadata) && (!!metadata.designs || !!metadata.budget_request);

                                        let designs = (isNewFormat ? (metadata.designs || []) : (Array.isArray(metadata) ? metadata : [])) as any[];
                                        if (metadata.budget_request) {
                                            if (metadata.budget_request.designs) {
                                                designs = [...designs, ...metadata.budget_request.designs];
                                            } else if (metadata.budget_request.image_url) {
                                                designs = [...designs, { image_url: metadata.budget_request.image_url }];
                                            }
                                        }

                                        const personalization = isNewFormat ? metadata.personalization : null;
                                        const personalizationText = personalization?.text || (typeof personalization === 'string' ? personalization : null);
                                        const personalizationSize = personalization?.size || null;
                                        const personalizationPrice = personalization?.price || 0;
                                        const instructions = isNewFormat ? (metadata.instructions || metadata?.budget_request?.notes) : (metadata.instructions || null);

                                        const basePrice = item.price || item.product_variants?.price_override || item.products?.price || 0;
                                        const designsPrice = designs.reduce((sum: number, d: any) => sum + (d.price || 0), 0);
                                        const itemTotal = (basePrice + designsPrice + personalizationPrice) * item.quantity;

                                        return (
                                            <div key={item.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-4 shadow-sm">
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
                                                            {metadata.on_request && (
                                                                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 text-[10px] font-black uppercase">
                                                                    Presupuesto Pendiente
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            {editingItem?.id === item.id ? (
                                                                <div className="flex flex-col gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-bold">$</span>
                                                                        <Input
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={editingItem?.price || ''}
                                                                            onChange={(e) => setEditingItem(prev => prev ? { ...prev, price: e.target.value } : null)}
                                                                            className="w-24 h-8 text-right font-mono text-sm"
                                                                        />
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <Button size="sm" className="h-6 px-2 text-[10px]" onClick={() => handlePriceUpdate(item)}>Guardar</Button>
                                                                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => setEditingItem(null)}>Canc.</Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <p className="font-bold text-primary">CANT: {item.quantity}</p>
                                                                    <div className="flex items-center gap-2 justify-end">
                                                                        <p className="text-xs font-black">${itemTotal.toFixed(2)}</p>
                                                                        {item.on_request && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-6 w-6 text-slate-400 hover:text-primary"
                                                                                onClick={() => setEditingItem({ id: item.id, price: (item.unit_price || basePrice).toString() })}
                                                                            >
                                                                                <RotateCcw className="h-3 w-3" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            )}
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

                                                {/* DESIGN AND METADATA EDITING SECTION */}
                                                <div className="mt-2">
                                                    {editingMetadata === item.id ? (
                                                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-primary/20 space-y-4">
                                                            <h4 className="text-xs font-bold uppercase text-primary flex items-center gap-2">
                                                                <Palette className="w-3 h-3" /> Modificando Diseños
                                                            </h4>

                                                            <div className="space-y-4">
                                                                {(tempMetadata?.budget_request?.designs || designs).map((d: any, dIdx: number) => (
                                                                    <div key={dIdx} className="space-y-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                                                        <div className="flex justify-between items-center mb-1">
                                                                            <Label className="text-[10px] font-black uppercase text-primary">Logo #{dIdx + 1}</Label>
                                                                            <button
                                                                                className="text-[10px] font-bold text-rose-500 hover:text-rose-700 uppercase"
                                                                                onClick={() => {
                                                                                    const currentDesigns = [...(tempMetadata?.budget_request?.designs || designs)];
                                                                                    const newDesigns = currentDesigns.filter((_, i) => i !== dIdx);
                                                                                    setTempMetadata({
                                                                                        ...tempMetadata,
                                                                                        budget_request: {
                                                                                            ...(tempMetadata?.budget_request || {}),
                                                                                            designs: newDesigns
                                                                                        }
                                                                                    });
                                                                                }}
                                                                            >Eliminar</button>
                                                                        </div>

                                                                        <div className="grid grid-cols-1 gap-2">
                                                                            <div className="flex gap-2">
                                                                                <div className="grow">
                                                                                    <Label className="text-[9px] font-bold text-slate-400 uppercase">URL de Imagen</Label>
                                                                                    <Input
                                                                                        value={d.image_url || ''}
                                                                                        onChange={(e) => {
                                                                                            const currentDesigns = [...(tempMetadata?.budget_request?.designs || designs)];
                                                                                            const newDesigns = [...currentDesigns];
                                                                                            newDesigns[dIdx] = { ...newDesigns[dIdx], image_url: e.target.value };
                                                                                            setTempMetadata({
                                                                                                ...tempMetadata,
                                                                                                budget_request: {
                                                                                                    ...(tempMetadata?.budget_request || {}),
                                                                                                    designs: newDesigns
                                                                                                }
                                                                                            });
                                                                                        }}
                                                                                        className="h-8 text-xs font-mono"
                                                                                        placeholder="https://..."
                                                                                    />
                                                                                </div>
                                                                                <div className="w-12 h-12 rounded border bg-slate-50 overflow-hidden shrink-0 mt-4">
                                                                                    <img src={d.image_url} className="w-full h-full object-contain" alt="" />
                                                                                </div>
                                                                            </div>

                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                <div>
                                                                                    <Label className="text-[9px] font-bold text-slate-400 uppercase">Ubicación</Label>
                                                                                    <Input
                                                                                        value={d.location || ''}
                                                                                        onChange={(e) => {
                                                                                            const currentDesigns = [...(tempMetadata?.budget_request?.designs || designs)];
                                                                                            const newDesigns = [...currentDesigns];
                                                                                            newDesigns[dIdx] = { ...newDesigns[dIdx], location: e.target.value };
                                                                                            setTempMetadata({
                                                                                                ...tempMetadata,
                                                                                                budget_request: {
                                                                                                    ...(tempMetadata?.budget_request || {}),
                                                                                                    designs: newDesigns
                                                                                                }
                                                                                            });
                                                                                        }}
                                                                                        className="h-8 text-[11px] font-bold"
                                                                                        placeholder="Pechera, Espalda..."
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <Label className="text-[9px] font-bold text-slate-400 uppercase">Precio ($)</Label>
                                                                                    <Input
                                                                                        type="number"
                                                                                        step="0.01"
                                                                                        value={d.price || ''}
                                                                                        onChange={(e) => {
                                                                                            const currentDesigns = [...(tempMetadata?.budget_request?.designs || designs)];
                                                                                            const newDesigns = [...currentDesigns];
                                                                                            newDesigns[dIdx] = { ...newDesigns[dIdx], price: parseFloat(e.target.value) || 0 };
                                                                                            setTempMetadata({
                                                                                                ...tempMetadata,
                                                                                                budget_request: {
                                                                                                    ...(tempMetadata?.budget_request || {}),
                                                                                                    designs: newDesigns
                                                                                                }
                                                                                            });
                                                                                        }}
                                                                                        className="h-8 text-[11px] font-mono"
                                                                                        placeholder="0.00"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}

                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-full h-8 border-dashed text-[10px] font-bold uppercase"
                                                                    onClick={() => {
                                                                        const currentDesigns = [...(tempMetadata?.budget_request?.designs || designs)];
                                                                        setTempMetadata({
                                                                            ...tempMetadata,
                                                                            budget_request: {
                                                                                ...(tempMetadata?.budget_request || {}),
                                                                                designs: [...currentDesigns, { image_url: '' }]
                                                                            }
                                                                        });
                                                                    }}
                                                                >
                                                                    <Plus className="w-3 h-3 mr-2" /> Añadir Logo
                                                                </Button>
                                                            </div>

                                                            <div className="space-y-2 pt-2 border-t">
                                                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Instrucciones Especiales</Label>
                                                                <Textarea
                                                                    value={tempMetadata?.budget_request?.notes || instructions || ''}
                                                                    onChange={(e) => setTempMetadata({
                                                                        ...tempMetadata,
                                                                        budget_request: {
                                                                            ...(tempMetadata?.budget_request || {}),
                                                                            notes: e.target.value
                                                                        }
                                                                    })}
                                                                    className="h-20 text-xs resize-none"
                                                                    placeholder="Instrucciones para producción..."
                                                                />
                                                            </div>

                                                            <div className="flex gap-2">
                                                                <Button size="sm" className="flex-1 h-9 font-bold" onClick={() => handleMetadataUpdate(item.id)}>Guardar Cambios</Button>
                                                                <Button size="sm" variant="ghost" className="h-9 font-bold" onClick={() => setEditingMetadata(null)}>Cancelar</Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {designs.length > 0 && (
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    {designs.map((d: any, dIdx: number) => (
                                                                        <div key={dIdx} className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-xl flex items-center gap-3">
                                                                            <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 overflow-hidden shrink-0">
                                                                                <img src={d.image_url} className="w-full h-full object-contain" alt="" />
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <p className="text-[10px] font-black uppercase truncate">{d.name || 'Diseño de Cliente'}</p>
                                                                                {d.size && <p className="text-[8px] text-slate-400 font-bold uppercase">{d.size} @ {d.location}</p>}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {instructions && (
                                                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                                                                    <p className="text-[8px] uppercase font-black text-slate-400 tracking-widest mb-1">Instrucciones:</p>
                                                                    <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-tight">{instructions}</p>
                                                                </div>
                                                            )}
                                                            {personalizationText && (
                                                                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
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
                                                            {item.on_request && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="w-full h-8 text-[10px] font-bold uppercase border border-primary/10 hover:bg-primary/5 text-primary rounded-xl"
                                                                    onClick={() => {
                                                                        setEditingMetadata(item.id);
                                                                        setTempMetadata(metadata);
                                                                    }}
                                                                >
                                                                    <Palette className="w-3 h-3 mr-2" /> Modificar Diseños / Notas
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Payment Proofs Section */}
                                {paymentProofs.length > 0 && (
                                    <div className="mt-8 space-y-4">
                                        <h3 className="text-sm font-bold flex items-center gap-2">
                                            <span className="w-1 h-3 bg-emerald-500 rounded-full"></span>
                                            Pagos Informados ({paymentProofs.length})
                                        </h3>
                                        <div className="grid gap-4">
                                            {paymentProofs.map((proof) => (
                                                <div key={proof.id} className={cn(
                                                    "p-5 rounded-3xl border-2 transition-all space-y-4",
                                                    proof.status === 'approved' ? "border-emerald-100 bg-emerald-50/20" :
                                                        proof.status === 'rejected' ? "border-rose-100 bg-rose-50/20" :
                                                            "border-amber-100 bg-amber-50/20 shadow-lg shadow-amber-500/5"
                                                )}>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "p-2 rounded-xl",
                                                                proof.status === 'approved' ? "bg-emerald-100 text-emerald-600" :
                                                                    proof.status === 'rejected' ? "bg-rose-100 text-rose-600" :
                                                                        "bg-amber-100 text-amber-600"
                                                            )}>
                                                                <Banknote size={16} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Referencia</p>
                                                                <p className="font-mono font-bold text-sm">{proof.reference_number}</p>
                                                            </div>
                                                        </div>
                                                        <Badge className={cn(
                                                            "rounded-lg font-black italic text-[10px] uppercase",
                                                            proof.status === 'approved' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                                                                proof.status === 'rejected' ? "bg-rose-100 text-rose-700 hover:bg-rose-100" :
                                                                    "bg-amber-100 text-amber-700 hover:bg-amber-100"
                                                        )}>
                                                            {proof.status === 'pending' ? 'Pendiente' :
                                                                proof.status === 'approved' ? 'Verificado' : 'Rechazado'}
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-2xl border">
                                                        <div>
                                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Monto Informado</p>
                                                            <p className="font-black text-lg text-primary">
                                                                {(proof.finance_accounts?.currency && proof.finance_accounts.currency !== 'USD')
                                                                    ? `${proof.finance_accounts.currency} ${proof.amount_paid.toFixed(2)}`
                                                                    : `$${proof.amount_paid.toFixed(2)}`
                                                                }
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Cuenta Destino</p>
                                                            <p className="text-sm font-bold truncate" title={proof.finance_accounts?.name || 'No especificada'}>
                                                                {proof.finance_accounts?.name || 'No especificada'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Fecha de Registro</p>
                                                            <p className="text-xs font-medium">{new Date(proof.created_at).toLocaleString()}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-4 items-start">
                                                        <div
                                                            className="relative aspect-video w-48 rounded-2xl border bg-slate-100 overflow-hidden group cursor-pointer shrink-0"
                                                            onClick={() => window.open(proof.screenshot_url, '_blank')}
                                                        >
                                                            <img src={proof.screenshot_url} className="w-full h-full object-contain" alt="Comprobante" />
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Eye className="text-white" size={20} />
                                                            </div>
                                                        </div>

                                                        {proof.status === 'pending' && (
                                                            <div className="grow space-y-4">
                                                                <div className="space-y-2">
                                                                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Cuenta de Destino</Label>
                                                                    <Select
                                                                        value={selectedAccountId || proof.account_id}
                                                                        onValueChange={setSelectedAccountId}
                                                                    >
                                                                        <SelectTrigger className="rounded-xl h-10 text-xs">
                                                                            <SelectValue placeholder="Elegir cuenta..." />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="rounded-xl">
                                                                            {financeAccounts.map((acc: any) => (
                                                                                <SelectItem key={acc.id} value={acc.id} className="text-xs font-bold uppercase italic">
                                                                                    {acc.name} ({acc.currency})
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-black italic text-[10px] uppercase rounded-xl gap-2 shadow-lg shadow-emerald-500/20"
                                                                        onClick={() => handleVerifyPayment(selectedOrder.id, proof.id, 'approved', selectedAccountId || proof.account_id)}
                                                                        disabled={!(selectedAccountId || proof.account_id) || verifyingPaymentId === proof.id}
                                                                    >
                                                                        {verifyingPaymentId === proof.id ? <Loader2 size={14} className="animate-spin" /> : 'Aprobar'}
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="flex-1 h-9 border-rose-200 text-rose-600 hover:bg-rose-50 font-black italic text-[10px] uppercase rounded-xl"
                                                                        onClick={() => handleVerifyPayment(selectedOrder.id, proof.id, 'rejected')}
                                                                        disabled={verifyingPaymentId === proof.id}
                                                                    >
                                                                        Rechazar
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Confirm Payment Dialog */}
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent className="rounded-3xl max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                            <Banknote className="text-emerald-500" /> Confirmar <span className="text-emerald-500">Pago</span>
                        </DialogTitle>
                        <DialogDescription>
                            Selecciona la cuenta donde se recibió el dinero para registrar la transacción.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Cuenta de Destino</Label>
                            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                <SelectTrigger className="rounded-xl h-12">
                                    <SelectValue placeholder="Seleccionar Cuenta..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {financeAccounts.map((acc: any) => (
                                        <SelectItem key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.currency}) - Bal: {acc.balance}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl h-12 font-bold uppercase italic text-xs"
                            onClick={() => setIsPaymentDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="flex-1 rounded-xl h-12 font-black uppercase italic text-xs bg-emerald-500 hover:bg-emerald-600"
                            disabled={!selectedAccountId || !paymentTargetOrderId}
                            onClick={async () => {
                                if (paymentTargetOrderId && selectedAccountId) {
                                    await handleStatusUpdate(paymentTargetOrderId, 'processing', {
                                        account_id: selectedAccountId,
                                        category_id: '8161186e-b80c-4ebd-99d2-90a15d3289b8' // Using the default 'Ventas' category ID from the SQL
                                    });
                                    setIsPaymentDialogOpen(false);
                                    setPaymentTargetOrderId(null);
                                    setSelectedAccountId('');
                                }
                            }}
                        >
                            Procesar Pago
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

