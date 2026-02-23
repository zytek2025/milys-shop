'use client';

import { useState, useEffect } from 'react';
import {
    FileText,
    Search,
    Clock,
    ShoppingBag,
    Eye,
    Printer,
    Loader2,
    TrendingUp,
    CheckCircle2,
    ArrowRight,
    Users,
    Palette,
    Edit,
    Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PrintButton } from '@/components/admin/shared/PrintButton';
import { ReceiptDocument } from '@/components/admin/orders/ReceiptDocument';
import { useStoreSettings } from '@/components/store-settings-provider';

export default function AdminQuotesPage() {
    const [quotes, setQuotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedQuote, setSelectedQuote] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const settings = useStoreSettings();
    const router = useRouter();

    useEffect(() => {
        fetchQuotes();
    }, []);

    const fetchQuotes = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/orders?status=quote');
            if (res.ok) {
                const data = await res.json();
                setQuotes(data);
            }
        } catch (error) {
            toast.error('Error al cargar presupuestos');
        } finally {
            setLoading(false);
        }
    };

    const handleConvertToOrder = async (quoteId: string) => {
        try {
            const res = await fetch(`/api/admin/orders/${quoteId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'pending' }),
            });

            if (res.ok) {
                toast.success('Presupuesto convertido a Pedido');
                setIsDetailsOpen(false);
                fetchQuotes();
            } else {
                toast.error('Error al convertir presupuesto');
            }
        } catch (error) {
            toast.error('Error de conexión');
        }
    };

    const handleDeleteQuote = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este presupuesto? Esta acción no se puede deshacer.')) return;
        try {
            const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Presupuesto eliminado');
                setIsDetailsOpen(false);
                fetchQuotes();
            } else {
                toast.error('Error al eliminar');
            }
        } catch (error) {
            toast.error('Error de conexión');
        }
    };

    const filteredQuotes = quotes.filter(q =>
        q.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.control_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary animate-in fade-in slide-in-from-left-4 duration-700">
                        <FileText size={12} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Gestión de Ventas</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white leading-none">
                        Presupuestos
                    </h1>
                    <p className="text-muted-foreground font-medium max-w-md">
                        Administra y convierte tus cotizaciones en pedidos reales.
                    </p>
                </div>

                <div className="flex bg-white dark:bg-slate-900 p-2 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm w-full md:w-96 group focus-within:ring-2 ring-primary/20 transition-all">
                    <div className="flex items-center pl-3 text-slate-400 group-focus-within:text-primary transition-colors">
                        <Search size={18} />
                    </div>
                    <Input
                        placeholder="Buscar por cliente o ID..."
                        className="border-0 focus-visible:ring-0 bg-transparent font-bold"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-500 group">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-500">
                            <Clock size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Pendientes</p>
                            <h3 className="text-3xl font-black tracking-tighter italic uppercase">{quotes.length}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-500 group">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-500">
                            <TrendingUp size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Cotizado</p>
                            <h3 className="text-3xl font-black tracking-tighter italic uppercase">
                                ${quotes.reduce((acc, q) => acc + q.total, 0).toFixed(2)}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
                    <div className="bg-primary/5 absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-1000" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                            <CheckCircle2 size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Eficiencia</p>
                            <h3 className="text-3xl font-black tracking-tighter italic uppercase">100%</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Cargando Presupuestos...</p>
                    </div>
                ) : filteredQuotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] opacity-40">
                        <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <FileText size={40} className="text-slate-400" />
                        </div>
                        <p className="text-lg font-bold tracking-tight">No se encontraron presupuestos</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">ID / Control</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Cliente</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Fecha</th>
                                    <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Total</th>
                                    <th className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {filteredQuotes.map((quote) => (
                                    <tr
                                        key={quote.id}
                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
                                        onClick={() => {
                                            setSelectedQuote(quote);
                                            setIsDetailsOpen(true);
                                        }}
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-[11px] text-muted-foreground group-hover:text-primary transition-colors">#{quote.id.slice(0, 8)}</span>
                                                <span className="text-sm font-black tracking-tight">{quote.control_id || 'SIN CONTROL'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold">{quote.customer_name || 'Cliente Genérico'}</span>
                                                <span className="text-[10px] font-medium text-muted-foreground">{quote.customer_email || 'Sin correo'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold">
                                                <Clock size={12} className="text-primary" />
                                                {new Date(quote.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="text-lg font-black tracking-tighter italic text-primary">
                                                ${quote.total.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white transition-all duration-300">
                                                    <Eye size={18} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
                    {selectedQuote && (
                        <>
                            <div className="p-8 md:p-12 space-y-8">
                                <DialogHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
                                    <div className="space-y-1">
                                        <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tighter italic uppercase text-primary flex items-center gap-3">
                                            <FileText size={24} /> Presupuesto
                                        </DialogTitle>
                                        <DialogDescription className="font-mono text-[10px] sm:text-xs uppercase tracking-widest font-bold opacity-60">
                                            ID: {selectedQuote.id} | Control: {selectedQuote.control_id}
                                        </DialogDescription>
                                    </div>
                                    <div className="flex flex-wrap gap-2 no-print w-full md:w-auto">
                                        <Button
                                            className="h-10 sm:h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 px-4 shadow-lg shadow-emerald-500/20 uppercase italic text-[10px] sm:text-xs tracking-widest flex-1 sm:flex-none justify-center"
                                            onClick={() => handleConvertToOrder(selectedQuote.id)}
                                        >
                                            <CheckCircle2 size={16} />
                                            Convertir
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-10 sm:h-12 rounded-2xl gap-2 font-bold uppercase italic text-[10px] flex-1 sm:flex-none justify-center"
                                            onClick={() => {
                                                setIsDetailsOpen(false);
                                                router.push(`/admin/pos?edit=${selectedQuote.id}`);
                                            }}
                                        >
                                            <Edit size={16} />
                                            Editar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-10 sm:h-12 rounded-2xl gap-2 font-bold uppercase italic text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200 flex-1 sm:flex-none justify-center"
                                            onClick={() => handleDeleteQuote(selectedQuote.id)}
                                        >
                                            <Trash2 size={16} />
                                            Eliminar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-10 sm:h-12 rounded-2xl gap-2 font-bold uppercase italic text-[10px] flex-1 sm:flex-none justify-center"
                                            onClick={() => setIsReceiptOpen(true)}
                                        >
                                            <Printer size={16} />
                                            Recibo
                                        </Button>
                                    </div>
                                </DialogHeader>

                                {/* Customer Info Card */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Users size={80} />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 block italic">Información del Cliente</p>
                                        <div className="space-y-4">
                                            <div className="flex flex-col">
                                                <span className="text-lg font-black tracking-tight">{selectedQuote.customer_name || 'No proporcionado'}</span>
                                                <span className="text-sm font-medium text-slate-400">{selectedQuote.customer_email || 'Sin correo electrónico'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm font-bold py-3 border-y border-slate-50 dark:border-slate-800">
                                                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary italic">@</div>
                                                {selectedQuote.customer_phone || 'Sin WhatsApp'}
                                            </div>
                                            <div className="text-xs font-semibold leading-relaxed text-slate-500 italic">
                                                {selectedQuote.shipping_address || 'Sin dirección de envío'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-amber-500 p-6 rounded-[2.5rem] shadow-xl shadow-amber-500/20 flex flex-col justify-between relative overflow-hidden group text-white">
                                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:rotate-12 transition-transform duration-500 pointer-events-none">
                                            <TrendingUp size={100} />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/80 mb-4 block italic">Resumen de Cotización</p>
                                        </div>
                                        <div className="space-y-1 relative z-10 text-right mt-auto">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Total a Pagar</span>
                                            <h2 className="text-4xl lg:text-5xl font-black italic tracking-tighter leading-none">${selectedQuote.total.toFixed(2)}</h2>
                                            {settings?.exchange_rate && (
                                                <p className="text-xs font-bold opacity-90 italic mt-1">≈ Bs {(selectedQuote.total * settings.exchange_rate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">Detalle de Productos</h3>
                                        <Badge variant="secondary" className="rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest italic">{selectedQuote.items?.length || 0} ITEMS</Badge>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {selectedQuote.items?.map((item: any, idx: number) => {
                                                const designs = item.custom_metadata?.budget_request?.designs || [];
                                                return (
                                                    <div key={idx} className="p-8 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <div className="flex justify-between items-start gap-6">
                                                            <div className="space-y-2 grow">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary font-black italic">
                                                                        {idx + 1}
                                                                    </div>
                                                                    <h4 className="text-lg font-black tracking-tight">{item.product_name}</h4>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2 pl-13">
                                                                    {item.custom_metadata?.size && <Badge variant="outline" className="rounded-lg text-[10px] font-black border-slate-200 uppercase bg-slate-50">Talla: {item.custom_metadata.size}</Badge>}
                                                                    {item.custom_metadata?.color && <Badge variant="outline" className="rounded-lg text-[10px] font-black border-slate-200 uppercase bg-slate-50">Color: {item.custom_metadata.color}</Badge>}
                                                                </div>
                                                                {designs.length > 0 && (
                                                                    <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-3">
                                                                        {designs.map((d: any, dIdx: number) => (
                                                                            <div key={dIdx} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 flex gap-3 items-center">
                                                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0">
                                                                                    {d.image_url ? (
                                                                                        <img src={d.image_url} className="w-full h-full object-contain" alt="" />
                                                                                    ) : (
                                                                                        <div className="w-full h-full flex items-center justify-center text-slate-300"><Palette size={16} /></div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex flex-col text-[10px] leading-tight font-bold uppercase overflow-hidden">
                                                                                    <span className="text-slate-400 truncate tracking-widest">{d.location || 'UBIC. S/N'}</span>
                                                                                    <span className="text-primary truncate">${d.price || '0.00'}</span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground italic mb-1">CANT: {item.quantity}</p>
                                                                <p className="text-2xl font-black italic tracking-tighter text-primary">${(item.price * item.quantity).toFixed(2)}</p>
                                                                <p className="text-[10px] font-bold text-slate-400">${item.price.toFixed(2)} c/u</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Receipt Modal */}
            <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
                <DialogContent className="max-w-[1000px] max-h-[95vh] p-0 overflow-y-auto bg-white border-none shadow-3xl">
                    <DialogHeader className="opacity-0 h-0 p-0 m-0"><DialogTitle>Recibo</DialogTitle></DialogHeader>
                    {selectedQuote && settings && (
                        <div className="relative group">
                            <div className="absolute top-8 right-8 z-50 no-print flex gap-2">
                                <PrintButton label="Imprimir PDF" className="h-12 px-6 rounded-2xl shadow-xl shadow-primary/20" />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-12 w-12 rounded-2xl bg-white/80 backdrop-blur-md shadow-lg"
                                    onClick={() => setIsReceiptOpen(false)}
                                >
                                    <ShoppingBag size={20} />
                                </Button>
                            </div>
                            <ReceiptDocument order={selectedQuote} settings={settings} />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
