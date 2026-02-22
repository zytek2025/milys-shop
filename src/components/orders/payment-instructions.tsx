'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, Smartphone, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { PriceDisplay } from '@/components/store-settings-provider';

export function PaymentInstructions({ paymentMethodId, orderTotal = 0 }: { paymentMethodId?: string, orderTotal?: number }) {
    const safeOrderTotal = orderTotal || 0;
    const [methods, setMethods] = useState<any[]>([]);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.payment_methods) {
                    setMethods(data.payment_methods);
                }
            });
    }, []);

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        toast.success('Copiado al portapapeles');
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // Si ya hay un método seleccionado (ej. por el admin o sistema), lo mostramos solo a él.
    // De lo contrario, mostramos todos los activos.
    const displayMethods = paymentMethodId
        ? methods.filter(m => m.id === paymentMethodId)
        : methods;

    if (displayMethods.length === 0) return null;

    return (
        <div className="space-y-3 my-4">
            <h3 className="text-sm font-black italic uppercase tracking-tighter text-primary">Formas de Pago</h3>
            <p className="text-[9px] text-muted-foreground font-bold uppercase italic opacity-70">
                {paymentMethodId
                    ? 'Realiza el pago siguiendo estas instrucciones:'
                    : 'Selecciona una opción y transfiere:'}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
                {displayMethods.map((method) => {
                    const discountRate = method.is_discount_active ? (method.discount_percentage / 100) : 0;
                    const finalForThisMethod = orderTotal * (1 - discountRate);

                    return (
                        <Card key={method.id} className="border border-primary/20 shadow-sm bg-primary/5 overflow-hidden transition-all hover:bg-primary/10">
                            <CardHeader className="p-2 bg-white dark:bg-slate-900 border-b border-primary/5">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-[10px] flex items-center gap-1.5 uppercase italic font-black">
                                        <Landmark className="h-3 w-3 text-primary" /> {method.name}
                                    </CardTitle>
                                    {orderTotal > 0 && method.is_discount_active && method.discount_percentage > 0 && (
                                        <Badge className="bg-emerald-500 text-white font-black text-[8px] uppercase italic py-0 h-3.5 px-1">
                                            -{method.discount_percentage}%
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-2 space-y-1.5">
                                <div className="bg-white dark:bg-slate-900 p-2 rounded-lg relative group border border-slate-100 dark:border-slate-800">
                                    <p className="text-[9px] font-mono whitespace-pre-wrap leading-tight">{method.instructions}</p>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="absolute top-0.5 right-0.5 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => copyToClipboard(method.instructions, method.id)}
                                    >
                                        {copiedKey === method.id ? <Check className="h-2.5 w-2.5 text-emerald-500" /> : <Copy className="h-2.5 w-2.5" />}
                                    </Button>
                                </div>

                                {orderTotal > 0 && (
                                    <div className="flex justify-between items-center px-1 pt-1 overflow-hidden">
                                        <span className="text-[9px] font-black uppercase italic text-muted-foreground whitespace-nowrap">Monto a pagar:</span>
                                        <PriceDisplay amount={finalForThisMethod} className="font-black text-primary tracking-tighter text-sm" />
                                    </div>
                                )}

                                {method.name.toLowerCase().includes('pago móvil') && (
                                    <div className="mt-3 flex flex-col items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border-2 border-primary/20">
                                        <p className="text-[8px] font-black uppercase italic text-primary tracking-widest">Escanea para pagar</p>
                                        <div className="bg-white p-1 rounded-lg">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(method.instructions + "\nMonto: " + finalForThisMethod.toFixed(2))}`}
                                                alt="QR Pago Móvil"
                                                className="w-24 h-24"
                                            />
                                        </div>
                                        <p className="text-[7px] text-muted-foreground font-bold uppercase text-center leading-tight">
                                            Usa tu app bancaria para escanear y pagar el monto exacto.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-100 dark:border-amber-800 flex gap-2">
                <div className="h-6 w-6 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-amber-600" />
                </div>
                <p className="text-[9px] text-amber-800 dark:text-amber-200 font-medium italic leading-tight">
                    Adjunta tu comprobante en el formulario para procesar tu pedido.
                </p>
            </div>
        </div>
    );
}
