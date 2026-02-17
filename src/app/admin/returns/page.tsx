'use client';

import { useState, useEffect } from 'react';
import {
    RotateCcw,
    Search,
    Clock,
    CheckCircle2,
    XCircle,
    Eye,
    Loader2,
    ArrowRight,
    User,
    ShoppingBag,
    DollarSign
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
    DialogFooter
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminReturnsPage() {
    const [returns, setReturns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReturn, setSelectedReturn] = useState<any | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchReturns();
    }, []);

    const fetchReturns = async () => {
        try {
            const res = await fetch('/api/admin/returns');
            const data = await res.json();
            if (res.ok) {
                setReturns(data);
            } else {
                toast.error('Error al cargar devoluciones');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string, notes?: string) => {
        setProcessing(id);
        try {
            const res = await fetch(`/api/admin/returns/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, admin_notes: notes })
            });

            if (res.ok) {
                toast.success('Estado actualizado correctamente');
                fetchReturns();
                setIsDetailsOpen(false);
            } else {
                const data = await res.json();
                toast.error(data.error || 'Error al actualizar');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setProcessing(null);
        }
    };

    const statusMap: any = {
        requested: { label: 'Solicitada', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500', icon: Clock },
        approved: { label: 'Aprobada', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500', icon: CheckCircle2 },
        rejected: { label: 'Rechazada', color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-500', icon: XCircle },
        completed: { label: 'Completada', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500', icon: RotatingCcwIcon },
    };

    function RotatingCcwIcon({ size, className }: any) {
        return <RotateCcw size={size} className={className} />;
    }

    const filteredReturns = returns.filter(r =>
        r.control_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent dark:from-white dark:to-slate-400 tracking-tighter italic uppercase">
                        Gestión de Devoluciones
                    </h1>
                    <p className="text-slate-500 font-medium italic">Control de solicitudes, reembolsos y reintegro de stock.</p>
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
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-100 dark:border-slate-800">
                                <TableHead>ID Devolución</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Pedido Original</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-12"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                            ) : filteredReturns.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">No hay devoluciones registradas.</TableCell></TableRow>
                            ) : filteredReturns.map((item) => {
                                const status = statusMap[item.status] || statusMap.requested;
                                return (
                                    <TableRow key={item.id} className="group border-slate-100 dark:border-slate-800">
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono text-[9px] bg-slate-50 dark:bg-slate-900">
                                                {item.control_id || '---'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm">{item.profiles?.full_name || 'Desconocido'}</span>
                                                <span className="text-[10px] text-muted-foreground">{item.profiles?.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-[10px] font-bold">
                                                {item.orders?.control_id || 'ORD-???'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase italic",
                                                status.color
                                            )}>
                                                <status.icon size={10} />
                                                {status.label}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                                                onClick={() => {
                                                    setSelectedReturn(item);
                                                    setIsDetailsOpen(true);
                                                }}
                                            >
                                                <Eye size={14} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 italic font-black uppercase tracking-tighter text-2xl">
                            <RotateCcw className="text-primary" />
                            Detalle de Devolución
                        </DialogTitle>
                    </DialogHeader>

                    {selectedReturn && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1 flex items-center gap-1"><User size={10} /> Cliente</p>
                                    <p className="font-bold text-sm leading-tight">{selectedReturn.profiles?.full_name}</p>
                                    {selectedReturn.profiles?.whatsapp && (
                                        <a href={`https://wa.me/${selectedReturn.profiles.whatsapp}`} target="_blank" className="text-[10px] text-emerald-600 font-bold hover:underline block mt-1">Chat WhatsApp</a>
                                    )}
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1 flex items-center gap-1"><ShoppingBag size={10} /> Pedido</p>
                                    <p className="font-bold text-sm leading-tight">{selectedReturn.orders?.control_id}</p>
                                    <p className="text-[10px] text-primary font-bold block mt-1">Total: ${selectedReturn.orders?.total?.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest px-1">Productos a devolver</p>
                                <div className="space-y-2">
                                    {selectedReturn.items?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-white dark:bg-slate-950 rounded-xl border-2 border-slate-50 dark:border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center font-black text-xs">
                                                    {item.quantity}x
                                                </div>
                                                <span className="font-bold text-xs">ID Var: {item.variant_id?.slice(0, 8)}</span>
                                            </div>
                                            <span className="font-black text-xs text-primary">${item.price?.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-800">
                                <p className="text-[10px] uppercase font-black text-amber-600 mb-1 flex items-center gap-1"><MessageSquare size={10} /> Motivo del cliente</p>
                                <p className="text-xs italic font-medium">"{selectedReturn.reason || 'Sin motivo especificado'}"</p>
                            </div>

                            {selectedReturn.status === 'requested' && (
                                <div className="grid grid-cols-2 gap-3 pt-4 border-t-2">
                                    <Button
                                        variant="outline"
                                        className="h-12 rounded-2xl font-black uppercase italic border-2 border-rose-100 text-rose-600 hover:bg-rose-50"
                                        onClick={() => handleStatusUpdate(selectedReturn.id, 'rejected')}
                                        disabled={!!processing}
                                    >
                                        {processing === selectedReturn.id ? <Loader2 className="animate-spin" /> : 'Rechazar'}
                                    </Button>
                                    <Button
                                        className="h-12 rounded-2xl font-black uppercase italic bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                                        onClick={() => handleStatusUpdate(selectedReturn.id, 'approved')}
                                        disabled={!!processing}
                                    >
                                        {processing === selectedReturn.id ? <Loader2 className="animate-spin" /> : 'Aprobar'}
                                    </Button>
                                </div>
                            )}

                            {selectedReturn.status === 'approved' && (
                                <div className="space-y-3 pt-4 border-t-2">
                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-3">
                                        <DollarSign className="text-emerald-600" />
                                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Al pulsar "Completar", se integrará el stock y se acreditará el saldo al cliente automáticamente.</p>
                                    </div>
                                    <Button
                                        className="w-full h-14 rounded-2x font-black uppercase italic bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20"
                                        onClick={() => handleStatusUpdate(selectedReturn.id, 'completed')}
                                        disabled={!!processing}
                                    >
                                        {processing === selectedReturn.id ? <Loader2 className="animate-spin" /> : 'Completar y Reembolsar'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
