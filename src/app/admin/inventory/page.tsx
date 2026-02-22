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
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Info,
    LayoutGrid,
    Target
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
import { PrintButton } from '@/components/admin/shared/PrintButton';

export default function InventoryPage() {
    const [variants, setVariants] = useState<any[]>([]);
    const [movements, setMovements] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdjustmentMode, setIsAdjustmentMode] = useState(false);

    // Adjustment State
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedItems, setSelectedItems] = useState<any[]>([]); // Current items being adjusted
    const [adjustmentType, setAdjustmentType] = useState<'in' | 'out'>('in');
    const [adjustmentReason, setAdjustmentReason] = useState('purchase');
    const [commonCost, setCommonCost] = useState<string>('');
    const [commonUtility, setCommonUtility] = useState<string>('30');
    const [commonPrice, setCommonPrice] = useState<string>('');
    const [updatePublicPrice, setUpdatePublicPrice] = useState(true);
    const [exchangeRate, setExchangeRate] = useState(1);

    const [aiRecommendations, setAiRecommendations] = useState<any>(null);
    const [aiLoading, setAiLoading] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('adjust');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        fetchData();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            if (res.ok) {
                const data = await res.json();
                setExchangeRate(data.exchange_rate || 1);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    // Refresh stats when tab changes to reports
    useEffect(() => {
        if (activeTab === 'reports' && !stats) {
            fetchStats();
        }
    }, [activeTab]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const headers = { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' };
            const [vRes, mRes] = await Promise.all([
                fetch('/api/admin/products', { headers }),
                fetch('/api/admin/inventory/movements', { headers })
            ]);

            const products = await vRes.json();
            const moves = await mRes.json();

            if (!vRes.ok) throw new Error(products.error || 'Failed to load products');
            if (!mRes.ok) throw new Error(moves.error || 'Failed to load movements');

            // Fix movement name fallback
            const validMoves = Array.isArray(moves) ? moves : [];
            const processedMoves = validMoves.map((m: any) => ({
                ...m,
                product_name: m.variant?.product?.name || m.direct_product?.name || 'Producto desconocido',
                product_details: m.variant ? `${m.variant.size} / ${m.variant.color}` : '---'
            }));
            setMovements(processedMoves);

            // Flatten variants
            const allVariants = (products || []).flatMap((p: any) => {
                const pVariants = p?.product_variants || [];
                if (pVariants.length === 0) {
                    return [{
                        id: `product-${p.id}`,
                        product_id: p.id,
                        product_name: p.name || 'Producto sin nombre',
                        control_id: p.control_id,
                        category_id: p.category_id || p.category,
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
                    category_id: p.category_id || p.category,
                    price: v.price_override || p.price || 0
                }));
            });

            setVariants(allVariants);
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

    const handleSearch = async (val: string) => {
        setSearchTerm(val);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(val)}`);
            if (res.ok) setSearchResults(await res.json());
        } catch (error) {
            console.error(error);
        } finally {
            setSearching(false);
        }
    };

    const addItemToAdjustment = (item: any) => {
        if (selectedItems.find(i => i.id === item.id)) return;
        setSelectedItems([...selectedItems, {
            ...item,
            qty: 1,
            cost: commonCost || item.cost || 0,
            utility: commonUtility || 30,
            price: item.price || 0
        }]);
        setSearchTerm('');
        setSearchResults([]);
    };

    const removeItem = (id: string) => {
        setSelectedItems(selectedItems.filter(i => i.id !== id));
    };

    const updateItemField = (id: string, field: string, val: any) => {
        setSelectedItems(selectedItems.map(item => {
            if (item.id !== id) return item;
            const updated = { ...item, [field]: val };

            // Auto-calculate logic
            if (field === 'cost' || field === 'utility') {
                const cost = field === 'cost' ? parseFloat(val) : parseFloat(item.cost);
                const util = field === 'utility' ? parseFloat(val) : parseFloat(item.utility);
                if (!isNaN(cost) && !isNaN(util)) {
                    updated.price = parseFloat((cost * (1 + util / 100)).toFixed(2));
                }
            } else if (field === 'price') {
                const price = parseFloat(val);
                const cost = parseFloat(item.cost);
                if (!isNaN(price) && !isNaN(cost) && cost > 0) {
                    updated.utility = parseFloat((((price / cost) - 1) * 100).toFixed(2));
                }
            }
            return updated;
        }));
    };

    const processAdjustment = async () => {
        if (selectedItems.length === 0) return toast.error('No hay productos seleccionados');
        setSubmitting(true);
        try {
            for (const item of selectedItems) {
                const res = await fetch('/api/admin/inventory/movements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        variant_id: item.type === 'variant' ? item.id : undefined,
                        product_id: item.type === 'product' ? item.id : undefined,
                        quantity: adjustmentType === 'in' ? item.qty : -item.qty,
                        type: adjustmentReason,
                        reason: `Ajuste Panel: ${adjustmentReason}`,
                        unit_cost: item.cost,
                        utility_percentage: item.utility,
                        unit_price: item.price,
                        exchange_rate: exchangeRate,
                        update_price: updatePublicPrice
                    }),
                });
                if (!res.ok) {
                    const errData = await res.json().catch(() => null);
                    throw new Error(errData?.error || `Error en item ${item.name}`);
                }
            }
            toast.success('Inventario actualizado correctamente');
            setSelectedItems([]);
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const getAiAdvice = async () => {
        if (selectedItems.length === 0) return;
        setAiLoading(true);
        try {
            const res = await fetch('/api/admin/inventory/advisor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: selectedItems,
                    exchange_rate: exchangeRate
                })
            });
            if (res.ok) {
                setAiRecommendations(await res.json());
            } else {
                toast.error('No se pudo obtener el análisis de la IA');
            }
        } catch (error) {
            console.error('AI Advisor error:', error);
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent dark:from-white dark:to-slate-400 tracking-tighter italic uppercase">
                        Control de <span className="text-primary">Inventario</span>
                    </h1>
                    <p className="text-slate-500 font-medium italic">Gestión inteligente de stock y precios ERP.</p>
                </div>
                <div className="flex gap-2 no-print">
                    <PrintButton label="Imprimir Stock" />
                    <Card className="bg-primary/5 border-primary/10 px-4 py-2 flex items-center gap-3 rounded-2xl">
                        <DollarSign className="text-primary w-5 h-5" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400">Tasa del Día</p>
                            <p className="text-sm font-black text-primary">Bs. {exchangeRate.toFixed(2)}</p>
                        </div>
                    </Card>
                    <Button onClick={fetchData} variant="outline" size="icon" className="h-12 w-12 rounded-2xl">
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1.5 shadow-inner">
                    <TabsTrigger value="adjust" className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-xl transition-all">
                        <LayoutGrid size={16} /> Ajuste Maestro
                    </TabsTrigger>
                    <TabsTrigger value="ledger" className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-xl transition-all">
                        <History size={16} /> Historial de Movimientos
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-xl transition-all">
                        <TrendingUp size={16} /> Analítica
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="adjust" className="mt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Selector & Settings */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white dark:bg-slate-900 overflow-hidden">
                                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <CardTitle className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
                                            <Package className="text-primary" /> Selección de Productos
                                        </CardTitle>
                                        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                                            <Button
                                                variant={adjustmentType === 'in' ? 'default' : 'ghost'}
                                                size="sm"
                                                onClick={() => setAdjustmentType('in')}
                                                className="rounded-lg h-8 text-[10px] font-black uppercase"
                                            >Entrada</Button>
                                            <Button
                                                variant={adjustmentType === 'out' ? 'default' : 'ghost'}
                                                size="sm"
                                                onClick={() => setAdjustmentType('out')}
                                                className="rounded-lg h-8 text-[10px] font-black uppercase"
                                            >Salida</Button>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <Input
                                            placeholder="Buscar por nombre o Control ID..."
                                            className="h-14 pl-12 rounded-2xl text-lg font-medium border-slate-200 shadow-lg focus:ring-4 focus:ring-primary/10 transition-all"
                                            value={searchTerm}
                                            onChange={(e) => handleSearch(e.target.value)}
                                        />

                                        {searchResults.length > 0 && (
                                            <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-2xl rounded-2xl border-none max-h-80 overflow-y-auto ring-1 ring-black/5">
                                                <div className="p-2 space-y-1">
                                                    {searchResults.map(result => (
                                                        <div
                                                            key={result.id}
                                                            className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer group transition-colors"
                                                            onClick={() => addItemToAdjustment(result)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400">
                                                                    <Package size={20} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold leading-none mb-1">{result.name}</p>
                                                                    <p className="text-[10px] font-mono text-slate-400">{result.control_id} • {result.details}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs font-black text-slate-900 dark:text-white">${result.price.toFixed(2)}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Stock: {result.stock}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Card>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="p-0">
                                    <div className="min-h-[300px]">
                                        {selectedItems.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                                                <LayoutGrid size={64} className="mb-4 opacity-20" />
                                                <p className="font-bold uppercase tracking-widest text-xs">Busca y agrega productos para ajustar</p>
                                            </div>
                                        ) : (
                                            <Table>
                                                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                                                    <TableRow className="hover:bg-transparent border-none">
                                                        <TableHead className="font-black uppercase text-[9px] tracking-widest pl-8">Producto / Variante</TableHead>
                                                        <TableHead className="font-black uppercase text-[9px] tracking-widest w-24">Cantidad</TableHead>
                                                        <TableHead className="font-black uppercase text-[9px] tracking-widest w-32">Costo (USD)</TableHead>
                                                        <TableHead className="font-black uppercase text-[9px] tracking-widest w-32">Utilidad %</TableHead>
                                                        <TableHead className="font-black uppercase text-[9px] tracking-widest w-32">Venta (USD)</TableHead>
                                                        <TableHead className="w-12 pr-8"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {selectedItems.map((item) => (
                                                        <TableRow key={item.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                            <TableCell className="py-6 pl-8">
                                                                <p className="font-black text-sm">{item.name}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.details}</p>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    type="number"
                                                                    value={item.qty}
                                                                    onChange={(e) => updateItemField(item.id, 'qty', parseInt(e.target.value))}
                                                                    className="h-10 text-center font-black border-slate-200 rounded-xl focus:ring-0"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="relative">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">$</span>
                                                                    <Input
                                                                        type="number"
                                                                        value={item.cost}
                                                                        onChange={(e) => updateItemField(item.id, 'cost', e.target.value)}
                                                                        className="h-10 pl-7 font-bold border-slate-200 rounded-xl focus:ring-0"
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="relative">
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
                                                                    <Input
                                                                        type="number"
                                                                        value={item.utility}
                                                                        onChange={(e) => updateItemField(item.id, 'utility', e.target.value)}
                                                                        className="h-10 pr-7 font-bold border-slate-200 rounded-xl focus:ring-0 border-emerald-100 bg-emerald-50/30 text-emerald-600"
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="relative">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">$</span>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={item.price}
                                                                        onChange={(e) => updateItemField(item.id, 'price', e.target.value)}
                                                                        className="h-10 pl-7 font-black border-primary/20 rounded-xl focus:ring-0 bg-primary/5 text-primary"
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="pr-8">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg" onClick={() => removeItem(item.id)}>
                                                                    <Minus size={16} />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </div>
                                </CardContent>

                                {selectedItems.length > 0 && (
                                    <div className="p-8 bg-slate-50 dark:bg-slate-800/80 border-t flex items-center justify-between gap-6">
                                        <div className="flex flex-wrap gap-4 items-center">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 block ml-1">Motivo del Ajuste</label>
                                                <Select value={adjustmentReason} onValueChange={setAdjustmentReason}>
                                                    <SelectTrigger className="w-48 h-12 rounded-xl bg-white dark:bg-slate-900 border-slate-200">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="purchase">Compra de Inventario</SelectItem>
                                                        <SelectItem value="adjustment">Ajuste de Auditoría</SelectItem>
                                                        <SelectItem value="loss">Perdida / Daño</SelectItem>
                                                        <SelectItem value="transfer">Traspaso</SelectItem>
                                                        <SelectItem value="production">Producción Propia</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 px-5 rounded-xl border border-slate-200 h-12">
                                                <input
                                                    type="checkbox"
                                                    id="update-price"
                                                    checked={updatePublicPrice}
                                                    onChange={e => setUpdatePublicPrice(e.target.checked)}
                                                    className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary h-4 w-4"
                                                />
                                                <label htmlFor="update-price" className="text-xs font-bold uppercase cursor-pointer">Actualizar precio en Home</label>
                                            </div>
                                        </div>

                                        <Button
                                            className="h-14 px-10 rounded-2xl font-black uppercase italic tracking-wider text-sm shadow-xl shadow-primary/20 flex gap-3"
                                            onClick={processAdjustment}
                                            disabled={submitting}
                                        >
                                            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Target size={18} />}
                                            Ejecutar Movimiento
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* AI Advisor Panel */}
                        <div className="space-y-6">
                            <Card className="border-none shadow-2xl rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-violet-700 text-white overflow-hidden sticky top-6">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                                            <Sparkles className="text-yellow-300" size={20} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-black uppercase tracking-widest">AI Advisor</CardTitle>
                                            <p className="text-[10px] text-white/60 font-medium">Asistente de Precios y Stock</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        {aiRecommendations ? (
                                            <div className="space-y-4 animate-in fade-in duration-700">
                                                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                                                    <p className="text-[9px] font-black uppercase text-white/40 mb-2 flex items-center gap-1.5"><TrendingUp size={10} /> Sugerencia de Margen</p>
                                                    <p className="text-xs leading-relaxed font-medium">{aiRecommendations.margin}</p>
                                                </div>
                                                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                                                    <p className="text-[9px] font-black uppercase text-white/40 mb-2 flex items-center gap-1.5"><AlertTriangle size={10} /> Análisis de Rotación</p>
                                                    <p className="text-xs leading-relaxed font-medium">{aiRecommendations.stock}</p>
                                                </div>
                                                <div className="bg-emerald-500/30 backdrop-blur-md p-4 rounded-2xl border border-emerald-400/30">
                                                    <p className="text-[9px] font-black uppercase text-emerald-200 mb-2 flex items-center gap-1.5"><CheckCircle2 size={10} /> Precio Sugerido (USD)</p>
                                                    <p className="text-xs leading-relaxed font-bold">{aiRecommendations.price}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                                <Info className="mb-3 opacity-40" size={32} />
                                                <p className="text-xs font-bold text-white/60 leading-relaxed">
                                                    Agrega productos para obtener consejos inteligentes sobre márgenes y rotación.
                                                </p>
                                            </div>
                                        )}

                                        <Button
                                            variant="secondary"
                                            className="w-full h-12 rounded-xl font-black uppercase italic tracking-tighter shadow-lg shadow-black/10 transition-all hover:scale-[1.02] active:scale-95"
                                            onClick={getAiAdvice}
                                            disabled={aiLoading || selectedItems.length === 0}
                                        >
                                            {aiLoading ? <Loader2 size={18} className="animate-spin" /> : "Solicitar Análisis IA"}
                                        </Button>
                                    </div>

                                    <div className="pt-4 border-t border-white/10">
                                        <p className="text-[9px] font-black uppercase text-white/40 mb-3 tracking-widest">Preguntas Frecuentes</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {["¿Cómo proteger márgenes ante BCV?", "¿Qué variantes se venden más?", "Optimizar precios por volumen"].map((q, i) => (
                                                <button key={i} className="text-left py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold transition-colors border border-white/5">
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="ledger" className="mt-8">
                    <Card className="border-none shadow-xl overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-8 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                                <History className="text-primary" /> Libro Mayor de Inventario
                            </CardTitle>
                            <div className="flex gap-2">
                                <Input placeholder="Filtro rápido..." className="h-10 w-64 rounded-xl" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/20">
                                    <TableRow className="border-none">
                                        <TableHead className="font-black uppercase text-[9px] tracking-widest pl-8">Fecha / Admin</TableHead>
                                        <TableHead className="font-black uppercase text-[9px] tracking-widest">Producto</TableHead>
                                        <TableHead className="font-black uppercase text-[9px] tracking-widest">Tipo / Motivo</TableHead>
                                        <TableHead className="font-black uppercase text-[9px] tracking-widest text-right">Cantidad</TableHead>
                                        <TableHead className="font-black uppercase text-[9px] tracking-widest text-right">Costo (USD)</TableHead>
                                        <TableHead className="font-black uppercase text-[9px] tracking-widest text-right pr-8">Val. Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {movements.map((m) => (
                                        <TableRow key={m.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                            <TableCell className="pl-8 py-5">
                                                <p className="font-bold text-xs">{new Date(m.created_at).toLocaleDateString()}</p>
                                                <p className="text-[9px] text-slate-400 font-medium">{new Date(m.created_at).toLocaleTimeString()}</p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-xs">{m.product_name}</span>
                                                    <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">{m.product_details}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant="secondary" className="text-[9px] font-black uppercase h-5 px-2 w-fit">{m.type}</Badge>
                                                    <span className="text-[9px] italic text-slate-400 font-medium">{m.reason}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className={cn("text-right font-black text-sm", m.quantity > 0 ? "text-emerald-500" : "text-rose-500")}>
                                                {m.quantity > 0 ? '+' : ''}{m.quantity}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-xs space-y-1">
                                                <div className="flex flex-col items-end">
                                                    <span>${(m.unit_cost || 0).toFixed(2)}</span>
                                                    <span className="text-[9px] text-emerald-500 font-black">{m.utility_percentage}% Util.</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-black pr-8 text-sm">
                                                <div className="flex flex-col items-end">
                                                    <span>${(m.total_value || (m.quantity * (m.unit_cost || 0))).toFixed(2)}</span>
                                                    <span className="text-[9px] text-slate-400 font-medium">Tasa: {m.exchange_rate}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="stats" className="mt-8">
                    <InventoryStats data={stats} isLoading={!stats} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
