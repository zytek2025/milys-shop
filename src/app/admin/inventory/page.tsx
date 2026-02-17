'use client';

import { useState, useEffect } from 'react';
import {
    Package,
    Plus,
    Minus,
    History,
    Search,
    Loader2,
    ArrowUpCircle,
    ArrowDownCircle,
    AlertCircle,
    RotateCcw,
    User as UserIcon,
    DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

export default function InventoryPage() {
    const [variants, setVariants] = useState<any[]>([]);
    const [movements, setMovements] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'in' | 'out' | 'return'>('in');
    const [movementType, setMovementType] = useState<string>('manual');
    const [qty, setQty] = useState(1);
    const [reason, setReason] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [creditAmount, setCreditAmount] = useState<string>('0');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
        fetchCustomers();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [vRes, mRes] = await Promise.all([
                fetch('/api/admin/products'),
                fetch('/api/admin/inventory/movements')
            ]);

            const products = await vRes.json();
            const moves = await mRes.json();

            if (!vRes.ok || !Array.isArray(products)) {
                throw new Error(products.error || 'No se pudieron cargar productos');
            }

            if (!mRes.ok || !Array.isArray(moves)) {
                throw new Error(moves.error || 'No se pudieron cargar movimientos');
            }

            // Flatten variants from all products, including those without variants
            const allVariants = (products || []).flatMap((p: any) => {
                const pVariants = p?.product_variants || [];
                if (pVariants.length === 0) {
                    // Fallback for products without variants
                    return [{
                        id: `product-${p.id}`,
                        product_id: p.id,
                        product_name: p.name || 'Producto sin nombre',
                        size: 'N/A',
                        color: 'N/A',
                        stock: p.stock || 0,
                        is_legacy: true,
                        price: p.price || 0
                    }];
                }
                return pVariants.map((v: any) => ({
                    ...v,
                    product_name: p.name || 'Producto sin nombre',
                    price: v.price_override || p.price || 0
                }));
            });

            setVariants(allVariants);
            setMovements(moves);
        } catch (error: any) {
            toast.error(error.message || 'Error al cargar datos de inventario');
            setVariants([]);
            setMovements([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await fetch('/api/admin/crm');
            const data = await res.json();
            if (res.ok) {
                setCustomers(data);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const handleMovement = async () => {
        if (qty <= 0) return toast.error('La cantidad debe ser mayor a 0');

        setSubmitting(true);
        try {
            if (modalType === 'return') {
                if (!selectedCustomerId) {
                    toast.error('Debe seleccionar un cliente para asignar el saldo');
                    setSubmitting(false);
                    return;
                }

                const res = await fetch('/api/admin/inventory/returns', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        profile_id: selectedCustomerId,
                        variant_id: selectedVariant.is_legacy ? selectedVariant.product_id : selectedVariant.id,
                        quantity: qty,
                        amount_to_credit: Number(creditAmount),
                        reason: reason || 'Devolución de mercancía'
                    }),
                });

                if (res.ok) {
                    toast.success('Devolución procesada y saldo cargado');
                    setIsMovementModalOpen(false);
                    resetModal();
                    fetchData();
                } else {
                    const data = await res.json();
                    toast.error(data.error || 'Error al procesar devolución');
                }
                return;
            }

            const finalQty = modalType === 'in' ? qty : -qty;
            const payload: any = {
                quantity: finalQty,
                type: movementType,
                reason: reason || (modalType === 'in' ? 'Ingreso manual' : 'Egreso manual')
            };

            if (selectedVariant.is_legacy) {
                payload.product_id = selectedVariant.product_id;
            } else {
                payload.variant_id = selectedVariant.id;
            }

            const res = await fetch('/api/admin/inventory/movements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success('Movimiento registrado');
                setIsMovementModalOpen(false);
                resetModal();
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Error al registrar movimiento');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setSubmitting(false);
        }
    };

    const resetModal = () => {
        setQty(1);
        setReason('');
        setSelectedCustomerId('');
        setCreditAmount('0');
        setMovementType('manual');
    };

    const filteredVariants = variants.filter(v => {
        const term = searchTerm.toLowerCase();
        const nameMatch = (v.product_name || '').toLowerCase().includes(term);
        const sizeMatch = (v.size || '').toLowerCase().includes(term);
        const colorMatch = (v.color || v.color_name || '').toLowerCase().includes(term);
        return nameMatch || sizeMatch || colorMatch;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent dark:from-white dark:to-slate-400 tracking-tighter italic uppercase">
                        Inventario Avanzado
                    </h1>
                    <p className="text-slate-500 font-medium italic">Gestión de stock, devoluciones y saldos a favor.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="border-none shadow-xl bg-white/90 dark:bg-emerald-500/10 backdrop-blur-xl rounded-[2rem]">
                    <CardContent className="p-6 flex items-center gap-4">
                        <CardTitle className="text-xs font-black uppercase text-emerald-600 flex items-center gap-2 italic">
                            <ArrowUpCircle size={14} /> Entradas recientes
                        </CardTitle>
                    </CardContent>
                    <CardContent>
                        <p className="text-3xl font-black italic tracking-tighter">
                            {(movements || []).filter(m => (m?.quantity || 0) > 0).slice(0, 5).length} <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">registros</span>
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-xl bg-white/90 dark:bg-rose-500/10 backdrop-blur-xl rounded-[2rem]">
                    <CardContent className="p-6 flex items-center gap-4">
                        <CardTitle className="text-xs font-black uppercase text-rose-600 flex items-center gap-2 italic">
                            <ArrowDownCircle size={14} /> Salidas recientes
                        </CardTitle>
                    </CardContent>
                    <CardContent>
                        <p className="text-3xl font-black italic tracking-tighter">
                            {(movements || []).filter(m => (m?.quantity || 0) < 0).slice(0, 5).length} <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">registros</span>
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-xl bg-white/90 dark:bg-amber-500/10 backdrop-blur-xl rounded-[2rem]">
                    <CardContent className="p-6 flex items-center gap-4">
                        <CardTitle className="text-xs font-black uppercase text-amber-600 flex items-center gap-2 italic">
                            <AlertCircle size={14} /> Stock Bajo
                        </CardTitle>
                    </CardContent>
                    <CardContent>
                        <p className="text-3xl font-black italic tracking-tighter">
                            {(variants || []).filter(v => (v?.stock || 0) <= 5).length} <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">variantes</span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-black uppercase italic italic flex items-center gap-2 tracking-tight">
                                <Package className="text-primary" size={18} /> Existencias Actuales
                            </CardTitle>
                            <div className="relative w-48">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                                <Input
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-8 pl-7 text-xs rounded-lg"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Var.</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead className="text-right">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                                ) : (filteredVariants || []).map((v, idx) => (
                                    <TableRow key={v?.id || idx}>
                                        <TableCell>
                                            <p className="font-bold text-xs truncate max-w-[150px]">{v?.product_name || 'Sin nombre'}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[9px] uppercase font-black px-1 h-4">
                                                {v?.size || '-'} / {v?.color || '-'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`font-black tracking-tighter ${(v?.stock || 0) <= 5 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {v?.stock || 0}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                    onClick={() => {
                                                        setSelectedVariant(v);
                                                        setModalType('in');
                                                        setIsMovementModalOpen(true);
                                                    }}
                                                    title="Ingreso"
                                                >
                                                    <Plus size={14} />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-7 w-7 text-rose-600 hover:bg-rose-50 rounded-lg"
                                                    onClick={() => {
                                                        setSelectedVariant(v);
                                                        setModalType('out');
                                                        setIsMovementModalOpen(true);
                                                    }}
                                                    title="Egreso"
                                                >
                                                    <Minus size={14} />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-7 w-7 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    onClick={() => {
                                                        setSelectedVariant(v);
                                                        setModalType('return');
                                                        setCreditAmount(v.price.toString());
                                                        setIsMovementModalOpen(true);
                                                    }}
                                                    title="Devolución"
                                                >
                                                    <RotateCcw size={14} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="text-sm font-black uppercase italic flex items-center gap-2 tracking-tight">
                            <History className="text-primary" size={18} /> Historial de Movimientos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Detalle</TableHead>
                                    <TableHead>Cant.</TableHead>
                                    <TableHead>Motivo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                                ) : (movements || []).map((m, idx) => (
                                    <TableRow key={m?.id || idx} className="text-[10px]">
                                        <TableCell className="text-muted-foreground">
                                            {m?.created_at ? new Date(m.created_at).toLocaleDateString() : '--'}
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-bold leading-tight">
                                                {m?.product_variants?.products?.name || 'Producto desconocido'}
                                                <span className="block text-[9px] text-muted-foreground uppercase">
                                                    {m?.product_variants?.size || '-'} / {m?.product_variants?.color || '-'}
                                                </span>
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <Badge
                                                    variant="secondary"
                                                    className={cn(
                                                        "max-w-fit rounded-lg border-none font-bold italic text-[8px] uppercase",
                                                        m?.type === 'purchase' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
                                                        m?.type === 'return' && "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
                                                        m?.type === 'adjustment' && "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
                                                        m?.type === 'manual' && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
                                                        m?.type === 'order' && "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
                                                    )}
                                                >
                                                    {m?.type === 'purchase' ? 'Compra' :
                                                        m?.type === 'return' ? 'Devolución' :
                                                            m?.type === 'adjustment' ? 'Ajuste' :
                                                                m?.type === 'order' ? 'Venta' : 'Manual'}
                                                </Badge>
                                                <span className={`font-black tracking-tighter text-sm ${(m?.quantity || 0) > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {(m?.quantity || 0) > 0 ? '+' : ''}{m?.quantity || 0}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[120px] truncate italic text-slate-400 font-medium" title={m?.reason || ''}>
                                            {m?.reason || '--'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isMovementModalOpen} onOpenChange={(v) => { setIsMovementModalOpen(v); if (!v) resetModal(); }}>
                <DialogContent className="sm:max-w-[400px] rounded-3xl border-2 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 italic font-black uppercase tracking-tighter text-2xl">
                            {modalType === 'in' ? <Plus className="text-emerald-500" /> : modalType === 'out' ? <Minus className="text-rose-500" /> : <RotateCcw className="text-blue-500" />}
                            {modalType === 'in' ? 'Entrada' : modalType === 'out' ? 'Salida' : 'Devolución'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Producto</p>
                            <p className="font-black text-lg tracking-tight leading-none mb-1">{selectedVariant?.product_name}</p>
                            <p className="text-xs uppercase font-bold text-primary">{selectedVariant?.size} / {selectedVariant?.color}</p>
                        </div>

                        {modalType === 'return' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                        <UserIcon size={12} /> Cliente a Bonificar
                                    </label>
                                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                        <SelectTrigger className="h-12 rounded-xl border-2 bg-white dark:bg-slate-950 font-medium">
                                            <SelectValue placeholder="Seleccionar cliente..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-2">
                                            {customers.map(c => (
                                                <SelectItem key={c.id} value={c.id} className="font-medium">
                                                    {c.full_name || c.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                        <DollarSign size={12} /> Saldo a Acreditar ($)
                                    </label>
                                    <Input
                                        type="number"
                                        value={creditAmount}
                                        onChange={(e) => setCreditAmount(e.target.value)}
                                        className="rounded-xl border-2 h-12 px-4 font-black text-lg text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20"
                                    />
                                    <p className="text-[9px] text-muted-foreground italic font-medium">
                                        * Este monto se sumará al "Store Credit" del cliente.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cantidad</label>
                                <Input
                                    type="number"
                                    value={qty}
                                    onChange={(e) => setQty(Number(e.target.value))}
                                    className="rounded-xl border-2 h-12 px-4 font-black text-lg"
                                    min={1}
                                />
                            </div>
                            {modalType !== 'return' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo</label>
                                    <Select value={movementType} onValueChange={setMovementType}>
                                        <SelectTrigger className="h-12 rounded-xl border-2">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-2">
                                            {modalType === 'in' ? (
                                                <>
                                                    <SelectItem value="purchase">Compra</SelectItem>
                                                    <SelectItem value="adjustment">Ajuste +</SelectItem>
                                                </>
                                            ) : (
                                                <>
                                                    <SelectItem value="manual">Salida</SelectItem>
                                                    <SelectItem value="return">Devolución</SelectItem>
                                                    <SelectItem value="adjustment">Ajuste -</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Motivo / Notas</label>
                            <Input
                                placeholder="Ej: Error de talla, cambio por diseño..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="rounded-xl border-2 h-12 px-4 font-medium"
                            />
                        </div>
                    </div>
                    <DialogFooter className="pt-4 border-t-2">
                        <Button
                            className={cn(
                                "w-full h-14 font-black uppercase italic rounded-2xl shadow-xl transform transition-all active:scale-95",
                                modalType === 'in' ? "bg-emerald-500 hover:bg-emerald-600" : modalType === 'out' ? "bg-rose-500 hover:bg-rose-600" : "bg-blue-500 hover:bg-blue-600"
                            )}
                            onClick={handleMovement}
                            disabled={submitting}
                        >
                            {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirmar Operación'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
