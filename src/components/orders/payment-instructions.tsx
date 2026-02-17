'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, Smartphone, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge'; // Added import for Badge

export function PaymentInstructions({ paymentMethodId, orderTotal = 0 }: { paymentMethodId?: string, orderTotal?: number }) {
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
        <div className="space-y-4 my-6">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-primary">Formas de Pago</h3>
            <p className="text-xs text-muted-foreground font-bold uppercase italic opacity-70">
                {paymentMethodId
                    ? 'Realiza el pago siguiendo estas instrucciones:'
                    : 'Elige tu forma de pago preferida y realiza la transferencia:'}
            </p>

            <div className="grid gap-4">
                {displayMethods.map((method) => {
                    const discountRate = method.is_discount_active ? (method.discount_percentage / 100) : 0;
                    const finalForThisMethod = orderTotal * (1 - discountRate);

                    return (
                        <Card key={method.id} className="border-2 border-primary/20 shadow-sm bg-primary/5 overflow-hidden">
                            <CardHeader className="pb-2 bg-white dark:bg-slate-900 border-b-2 border-primary/5">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-sm flex items-center gap-2 uppercase italic font-black">
                                        <Landmark className="h-4 w-4 text-primary" /> {method.name}
                                    </CardTitle>
                                    {orderTotal > 0 && method.is_discount_active && method.discount_percentage > 0 && (
                                        <Badge className="bg-emerald-500 text-white font-black text-[9px] uppercase italic">
                                            -{method.discount_percentage}% DTO
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl relative group border-2 border-slate-100 dark:border-slate-800">
                                    <p className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed">{method.instructions}</p>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => copyToClipboard(method.instructions, method.id)}
                                    >
                                        {copiedKey === method.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>

                                {orderTotal > 0 && (
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] font-black uppercase italic text-muted-foreground">Monto a pagar:</span>
                                        <span className="text-lg font-black text-primary tracking-tighter">
                                            ${finalForThisMethod.toFixed(2)}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-800 flex gap-3">
                <div className="h-8 w-8 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center shrink-0">
                    <Check className="h-4 w-4 text-amber-600" />
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-200 font-medium italic leading-tight">
                    Una vez realizado el pago, recuerda adjuntar el comprobante en el formulario de la derecha para procesar tu pedido.
                </p>
            </div>
        </div>
    );
}
