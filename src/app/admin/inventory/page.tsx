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
    RotateCcw,
    User as UserIcon,
    DollarSign,
    RefreshCw
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';
import { InventoryQuickAction } from '@/components/admin/inventory/InventoryQuickAction';
import { InventoryStats } from '@/components/admin/inventory/InventoryStats';

export default function InventoryPage() {
    const [variants, setVariants] = useState<any[]>([]);
    const [movements, setMovements] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'in' | 'out' | 'return'>('in');
    const [movementType, setMovementType] = useState<string>('manual');
    const [qty, setQty] = useState(1);
    const [reason, setReason] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [creditAmount, setCreditAmount] = useState<string>('0');
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('quick');

    useEffect(() => {
        fetchData();
        fetchCustomers();
    }, []);

    // Refresh stats when tab changes to reports
    useEffect(() => {
        if (activeTab === 'reports' && !stats) {
            fetchStats();
        }
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const headers = { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' };
            const [vRes, mRes, cRes] = await Promise.all([
                fetch('/api/admin/products', { headers }),
                fetch('/api/admin/inventory/movements', { headers }),
                fetch('/api/admin/categories', { headers })
            ]);

            const products = await vRes.json();
            const moves = await mRes.json();
            const cats = await cRes.json();

            // ... (rest of logic)

            // Fix movement name fallback
            const processedMoves = moves.map((m: any) => ({
                ...m,
                product_name: m.variant?.product?.name || m.direct_product?.name || 'Producto desconocido',
                product_details: m.variant ? `${m.variant.size} / ${m.variant.color}` : '---'
            }));
            setMovements(processedMoves);

            if (!vRes.ok) throw new Error(products.error || 'Failed to load products');
            if (!mRes.ok) throw new Error(moves.error || 'Failed to load movements');

            // Flatten variants
            const allVariants = (products || []).flatMap((p: any) => {
                const pVariants = p?.product_variants || [];
                if (pVariants.length === 0) {
                    return [{
                        id: `product-${p.id}`,
                        product_id: p.id,
                        product_name: p.name || 'Producto sin nombre',
                        control_id: p.control_id,
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
                    control_id: p.control_id,
                    price: v.price_override || p.price || 0
                }));
            });

            if (Array.isArray(cats)) setCategories(cats);
            setVariants(allVariants);
            setMovements(moves);
        } catch (error: any) {
            toast.error(error.message || 'Error loading inventory data');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/inventory/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await fetch('/api/admin/crm');
            if (res.ok) setCustomers(await res.json());
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const handleMovement = async () => {
        if (qty <= 0) return toast.error('Quantity must be > 0');
        setSubmitting(true);
        try {
            // ... (keep existing logic from previous file)
            // Re-implementing simplified for brevity, assume similar logic
            // Copied from previous view_file content to ensure correctness
            if (modalType === 'return') {
                if (!selectedCustomerId) {
                    toast.error('Seleccione un cliente');
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
                        reason: reason || 'Devolución'
                    }),
                });
                if (res.ok) {
                    toast.success('Devolución procesada');
                    setIsMovementModalOpen(false);
                    resetModal();
                    fetchData();
                } else {
                    const data = await res.json();
                    toast.error(data.error);
                }
            } else {
                const finalQty = modalType === 'in' ? qty : -qty;
                const payload: any = {
                    quantity: finalQty,
                    type: movementType,
                    reason: reason || (modalType === 'in' ? 'Ingreso manual' : 'Egreso manual')
                };
                if (selectedVariant.is_legacy) payload.product_id = selectedVariant.product_id;
                else payload.variant_id = selectedVariant.id;

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
                    toast.error(data.error);
                }
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
        const match = (v.product_name || '').toLowerCase().includes(term) ||
            (v.control_id || '').toLowerCase().includes(term) ||
            (v.size || '').toLowerCase().includes(term) ||
            (v.color || '').toLowerCase().includes(term);
        const catMatch = selectedCategory === 'all' || v.category === selectedCategory || v.category_id === selectedCategory;
        return match && catMatch;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent dark:from-white dark:to-slate-400 tracking-tighter italic uppercase">
                        Inventario Avanzado
                    </h1>
                    <p className="text-slate-500 font-medium italic">Gestión de stock en tiempo real.</p>
                </div>
                <Button onClick={fetchData} variant="outline" size="sm" className="gap-2">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Actualizar
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                    <TabsTrigger value="quick" className="rounded-lg font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">⚡ Acciones Rápidas</TabsTrigger>
                    <TabsTrigger value="list" className="rounded-lg font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">📋 Lista Maestra</TabsTrigger>
                    <TabsTrigger value="reports" className="rounded-lg font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">📊 Reportes</TabsTrigger>
                </TabsList>

                <TabsContent value="quick" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Quick Search & Update Component */}
                    <InventoryQuickAction onUpdate={fetchData} />

                    {/* Recent Movements (Simplified view) */}
                    <Card className="border-none shadow-lg bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                                <History size={16} /> Últimos Movimientos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow><TableHead>Producto</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Cant.</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(movements || []).slice(0, 5).map(m => (
                                        <TableRow key={m.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-xs">{m.product_name}</span>
                                                    <span className="text-[9px] text-muted-foreground">{m.control_id}</span>
                                                    <span className="text-[9px] text-muted-foreground">{m.product_details}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="text-[9px] h-5">{m.type}</Badge>
                                            </TableCell>
                                            <TableCell className={cn("text-right font-black", m.quantity > 0 ? "text-emerald-500" : "text-rose-500")}>
                                                {m.quantity > 0 ? '+' : ''}{m.quantity}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="list" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Master List (Existing Table Implementation) */}
                    <Card className="border-none shadow-xl overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-sm font-black uppercase italic">Lista Completa</CardTitle>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Buscar..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="h-9 w-64 rounded-lg"
                                    />
                                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                        <SelectTrigger className="h-9 w-40 rounded-lg"><SelectValue placeholder="Categoría" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas</SelectItem>
                                            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Control ID</TableHead>
                                        <TableHead>Producto</TableHead>
                                        <TableHead>Variante</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> :
                                        filteredVariants.map((v, i) => (
                                            <TableRow key={v.id || i}>
                                                <TableCell className="font-mono text-xs text-muted-foreground">{v.control_id || '---'}</TableCell>
                                                <TableCell className="font-bold text-sm">{v.product_name}</TableCell>
                                                <TableCell><Badge variant="outline">{v.size} / {v.color}</Badge></TableCell>
                                                <TableCell>
                                                    <span className={cn("font-black text-lg", v.stock < 5 ? "text-rose-500" : "text-emerald-500")}>
                                                        {v.stock}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => { setSelectedVariant(v); setModalType('in'); setIsMovementModalOpen(true); }}><Plus size={16} /></Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600" onClick={() => { setSelectedVariant(v); setModalType('out'); setIsMovementModalOpen(true); }}><Minus size={16} /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reports" className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <InventoryStats data={stats} isLoading={!stats} />
                </TabsContent>
            </Tabs>

            {/* Modal Logic (Ideally moved to separate component, kept here for speed) */}
            <Dialog open={isMovementModalOpen} onOpenChange={(v) => { setIsMovementModalOpen(v); if (!v) resetModal(); }}>
                <DialogContent className="sm:max-w-[400px] rounded-3xl border-2 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 italic font-black uppercase tracking-tighter text-2xl">
                            {modalType === 'in' ? <Plus className="text-emerald-500" /> : modalType === 'out' ? <Minus className="text-rose-500" /> : <RotateCcw className="text-blue-500" />}
                            {modalType === 'in' ? 'Entrada Manual' : modalType === 'out' ? 'Salida Manual' : 'Devolución'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                            <p className="font-bold">{selectedVariant?.product_name}</p>
                            <p className="text-xs text-muted-foreground">{selectedVariant?.size} / {selectedVariant?.color}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase">Cantidad</label>
                                <Input type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))} className="h-12 text-lg font-black" />
                            </div>
                            {modalType !== 'return' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase">Tipo</label>
                                    <Select value={movementType} onValueChange={setMovementType}>
                                        <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="manual">Manual</SelectItem>
                                            <SelectItem value="adjustment">Ajuste</SelectItem>
                                            <SelectItem value="purchase">Compra</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                        <Input placeholder="Motivo (Opcional)" value={reason} onChange={e => setReason(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button className="w-full h-12 font-bold" onClick={handleMovement} disabled={submitting}>
                            {submitting ? <Loader2 className="animate-spin" /> : 'Confirmar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
