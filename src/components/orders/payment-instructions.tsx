'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, Smartphone, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function PaymentInstructions({ paymentMethodId }: { paymentMethodId?: string }) {
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

    // Si tenemos un methodId específico lo buscamos, si no mostramos todos (compatibilidad)
    const activeMethods = paymentMethodId
        ? methods.filter(m => m.id === paymentMethodId)
        : methods;

    if (activeMethods.length === 0) return null;

    return (
        <div className="space-y-4 my-6">
            <h3 className="text-lg font-black italic uppercase tracking-tighter text-primary">Información de Pago</h3>
            <p className="text-sm text-muted-foreground">
                {paymentMethodId ? 'Realiza el pago siguiendo estas instrucciones:' : 'Por favor, realiza el pago usando uno de los siguientes métodos:'}
            </p>

            <div className="grid gap-4 sm:grid-cols-1">
                {activeMethods.map((method) => (
                    <Card key={method.id} className="border-2 border-primary/20 shadow-sm bg-primary/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2 uppercase italic font-black">
                                <Landmark className="h-4 w-4 text-primary" /> {method.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl relative group border-2 border-slate-100 dark:border-slate-800">
                                <p className="text-xs font-mono whitespace-pre-wrap leading-relaxed">{method.instructions}</p>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => copyToClipboard(method.instructions, method.id)}
                                >
                                    {copiedKey === method.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                    Una vez realizado el pago, nuestro equipo verificará la transacción y procesará tu pedido. ¡Gracias!
                </p>
            </div>
        </div>
    );
}
