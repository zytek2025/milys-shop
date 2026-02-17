'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    RotateCcw,
    MessageSquare,
    Loader2,
    CheckCircle2,
    Package,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ReturnRequestPage({ params }: { params: { orderId: string } }) {
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
    const [reason, setReason] = useState('');
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        fetchOrder();
    }, []);

    const fetchOrder = async () => {
        try {
            const res = await fetch(`/api/orders/${params.orderId}`);
            if (res.ok) {
                const data = await res.json();
                setOrder(data);
                // Initialize selected items (all by default or none?)
                // Let's go with none
            } else {
                toast.error('No se pudo cargar el pedido');
                router.push('/orders');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const toggleItem = (itemId: string, maxQty: number) => {
        setSelectedItems(prev => {
            const next = { ...prev };
            if (next[itemId]) {
                delete next[itemId];
            } else {
                next[itemId] = maxQty;
            }
            return next;
        });
    };

    const updateQty = (itemId: string, qty: number, maxQty: number) => {
        if (qty < 1 || qty > maxQty) return;
        setSelectedItems(prev => ({ ...prev, [itemId]: qty }));
    };

    const handleSubmit = async () => {
        const itemsToReturn = Object.entries(selectedItems).map(([itemId, qty]) => {
            const item = order.order_items.find((i: any) => i.id === itemId);
            return {
                variant_id: item.variant_id,
                quantity: qty,
                price: item.price
            };
        });

        if (itemsToReturn.length === 0) {
            return toast.error('Selecciona al menos un producto para devolver');
        }

        if (!reason.trim()) {
            return toast.error('Por favor indica el motivo de la devolución');
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/returns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: params.orderId,
                    items: itemsToReturn,
                    reason
                })
            });

            if (res.ok) {
                setCompleted(true);
                toast.success('Solicitud enviada correctamente');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Error al enviar solicitud');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-primary h-8 w-8" />
        </div>
    );

    if (completed) return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">¡Solicitud Enviada!</h1>
                <p className="text-muted-foreground">Analizaremos tu caso y te contactaremos pronto. Puedes ver el estado en tu perfil.</p>
                <Button className="w-full h-14 rounded-2xl font-bold uppercase italic" onClick={() => router.push('/orders')}>
                    Volver a mis pedidos
                </Button>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <Button
                variant="ghost"
                className="mb-8 gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                onClick={() => router.back()}
            >
                <ChevronLeft size={18} /> Volver
            </Button>

            <div className="space-y-8">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                        Solicitar <span className="text-primary italic">Devolución</span>
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium italic">Pedido: {order?.control_id || params.orderId}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                            <CardHeader className="bg-slate-50 dark:bg-slate-900/50">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">
                                    Paso 1: Selecciona los productos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {order?.order_items?.map((item: any) => (
                                        <div key={item.id} className="p-6 flex gap-4 items-center">
                                            <input
                                                type="checkbox"
                                                className="h-6 w-6 rounded-lg border-2 border-slate-200 checked:bg-primary"
                                                checked={!!selectedItems[item.id]}
                                                onChange={() => toggleItem(item.id, item.quantity)}
                                            />
                                            <div className="flex-1">
                                                <p className="font-bold">{item.products?.name}</p>
                                                <p className="text-xs text-muted-foreground uppercase">
                                                    {item.product_variants?.size} / {item.product_variants?.color}
                                                </p>
                                            </div>
                                            {selectedItems[item.id] && (
                                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                                    <span className="text-[10px] font-black uppercase text-slate-400">Cant:</span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            className="h-6 w-6 rounded bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center font-bold"
                                                            onClick={() => updateQty(item.id, selectedItems[item.id] - 1, item.quantity)}
                                                        >-</button>
                                                        <span className="font-bold w-4 text-center">{selectedItems[item.id]}</span>
                                                        <button
                                                            className="h-6 w-6 rounded bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center font-bold"
                                                            onClick={() => updateQty(item.id, selectedItems[item.id] + 1, item.quantity)}
                                                        >+</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                <MessageSquare size={14} className="text-primary" />
                                Paso 2: Motivo de la Devolución
                            </label>
                            <Textarea
                                placeholder="Indica por qué deseas devolver los productos (talla incorrecta, defecto, etc.)"
                                className="min-h-[150px] rounded-3xl border-2 p-6 focus-visible:ring-primary shadow-lg"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-none shadow-2xl bg-slate-900 text-white rounded-3xl p-6">
                            <CardHeader className="p-0 mb-4">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-white/50">Resumen</CardTitle>
                            </CardHeader>
                            <div className="space-y-4">
                                <div className="bg-white/10 p-4 rounded-2xl border border-white/10 flex items-center gap-4">
                                    <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                                        <RotateCcw size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase opacity-60">Artículos</p>
                                        <p className="text-xl font-black">{Object.keys(selectedItems).length}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 py-4">
                                    <h4 className="text-[10px] font-black uppercase opacity-40 tracking-tighter">Política de devoluciones</h4>
                                    <ul className="text-[10px] space-y-2 opacity-80">
                                        <li className="flex gap-2"><div className="h-1 w-1 bg-primary rounded-full mt-1.5 flex-shrink-0" /> Los productos deben estar en su estado original.</li>
                                        <li className="flex gap-2"><div className="h-1 w-1 bg-primary rounded-full mt-1.5 flex-shrink-0" /> Plazo máximo: 7 días desde la entrega.</li>
                                        <li className="flex gap-2"><div className="h-1 w-1 bg-primary rounded-full mt-1.5 flex-shrink-0" /> Una vez aprobada, el saldo se acreditará a tu cuenta.</li>
                                    </ul>
                                </div>
                                <Button
                                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase italic rounded-2xl shadow-xl shadow-primary/20"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? <Loader2 className="animate-spin" /> : 'Enviar Solicitud'}
                                </Button>
                            </div>
                        </Card>

                        <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-100 dark:border-amber-800 p-6 rounded-3xl flex gap-4">
                            <AlertCircle className="text-amber-500 flex-shrink-0" />
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                                Una vez enviada, nuestro equipo revisará tu caso en un máximo de 24 horas hábiles.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
