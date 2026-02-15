'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, Smartphone, Copy, Check, Wallet, Bitcoin, Zap, CreditCard, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ICON_MAP: Record<string, any> = {
    Smartphone,
    Landmark,
    Wallet,
    Bitcoin,
    Zap,
    CreditCard,
    DollarSign
};

export function PaymentInstructions() {
    const [methods, setMethods] = useState<any[]>([]);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/settings')
            .then(res => res.json())
            .then(data => {
                if (data && data.payment_methods) {
                    setMethods(data.payment_methods);
                }
            })
            .finally(() => setIsLoading(false));
    }, []);

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        toast.success('Copiado al portapapeles');
        setTimeout(() => setCopiedKey(null), 2000);
    };

    if (isLoading || methods.length === 0) return null;

    return (
        <div className="space-y-4 my-6">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-primary">Información de Pago</h3>
            <p className="text-xs font-bold uppercase italic opacity-60">Por favor, realiza el pago usando uno de los siguientes métodos:</p>

            <div className="grid gap-4 sm:grid-cols-2">
                {methods.map((method) => {
                    const Icon = ICON_MAP[method.icon] || Landmark;

                    return (
                        <Card key={method.id} className="border-2 border-primary/10 overflow-hidden bg-white dark:bg-slate-950">
                            <CardHeader className="pb-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                <CardTitle className="text-sm font-black uppercase italic flex items-center gap-2">
                                    <Icon className="h-4 w-4 text-primary" /> {method.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 text-[10px] sm:text-xs">
                                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl relative group border-2 border-dashed border-slate-200 dark:border-slate-800">
                                    <p className="font-mono whitespace-pre-wrap leading-relaxed">{method.instructions}</p>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-950 border shadow-sm"
                                        onClick={() => copyToClipboard(method.instructions, method.id)}
                                    >
                                        {copiedKey === method.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {method.is_discount_active && method.discount_percentage > 0 && (
                                    <p className="mt-3 text-[9px] font-black uppercase italic text-emerald-600 flex items-center gap-1">
                                        ✨ Descuento del {method.discount_percentage}% aplicado al elegir este método
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/30">
                <p className="text-[10px] text-emerald-800 dark:text-emerald-200 font-bold uppercase italic tracking-tight">
                    💡 IMPORTANTE: Una vez realizado el pago, nuestro equipo verificará la transacción. Asegúrate de guardar tu comprobante.
                </p>
            </div>
        </div>
    );
}
