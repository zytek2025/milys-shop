'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, Smartphone, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function PaymentInstructions() {
    const [settings, setSettings] = useState<any[]>([]);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/admin/settings') // Usamos el mismo endpoint ya que es público para lectura (según RLS)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setSettings(data);
                }
            });
    }, []);

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        toast.success('Copiado al portapapeles');
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const pagoMovil = settings.find(s => s.key === 'pago_movil_info')?.value;
    const zelle = settings.find(s => s.key === 'zelle_info')?.value;

    if (!pagoMovil && !zelle) return null;

    return (
        <div className="space-y-4 my-6">
            <h3 className="text-lg font-black italic uppercase tracking-tighter text-primary">Información de Pago</h3>
            <p className="text-sm text-muted-foreground">Por favor, realiza el pago usando uno de los siguientes métodos:</p>

            <div className="grid gap-4 sm:grid-cols-2">
                {pagoMovil && (
                    <Card className="border-2 border-primary/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Smartphone className="h-4 w-4 text-primary" /> Pago Móvil
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg relative group">
                                <p className="text-xs font-mono whitespace-pre-wrap">{pagoMovil}</p>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => copyToClipboard(pagoMovil, 'pm')}
                                >
                                    {copiedKey === 'pm' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {zelle && (
                    <Card className="border-2 border-primary/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Landmark className="h-4 w-4 text-primary" /> Zelle
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg relative group">
                                <p className="text-xs font-mono whitespace-pre-wrap">{zelle}</p>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => copyToClipboard(zelle, 'zelle')}
                                >
                                    {copiedKey === 'zelle' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                    Una vez realizado el pago, nuestro equipo verificará la transacción y procesará tu pedido. ¡Gracias!
                </p>
            </div>
        </div>
    );
}
