'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImagePlus, Loader2, CheckCircle2, AlertCircle, Plus, Eye, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

interface PaymentConfirmationFormProps {
    orderId: string;
    total: number;
    onSuccess?: () => void;
}

export function PaymentConfirmationForm({ orderId, total, onSuccess }: PaymentConfirmationFormProps) {
    const supabase = createClient();
    const router = useRouter();
    const [reference, setReference] = useState('');
    const [amount, setAmount] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingConfirmations, setExistingConfirmations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [methods, setMethods] = useState<any[]>([]);
    const [selectedMethodId, setSelectedMethodId] = useState<string>('');
    const [exchangeRate, setExchangeRate] = useState<number>(1);

    useEffect(() => {
        fetchData();
    }, [orderId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch existing confirmations
            const res = await fetch(`/api/orders/${orderId}/confirm-payment`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setExistingConfirmations(data);
            } else if (data && typeof data === 'object' && !data.error) {
                setExistingConfirmations([data]);
            }

            // Fetch payment methods to get account_ids and currencies
            const settingsRes = await fetch('/api/settings');
            const settingsData = await settingsRes.json();
            if (settingsData.exchange_rate) {
                setExchangeRate(Number(settingsData.exchange_rate) || 1);
            }
            if (settingsData.payment_methods) {
                setMethods(settingsData.payment_methods);
                // Do not auto-select, force user to choose
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !reference || !amount || !selectedMethodId) {
            toast.error('Por favor completa todos los campos y sube el comprobante');
            return;
        }

        setIsSubmitting(true);
        try {
            const selectedMethod = methods.find(m => m.id === selectedMethodId);

            // 1. Subir imagen a Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${orderId}-${Math.random()}.${fileExt}`;
            const filePath = `confirmations/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('payment-proofs')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('payment-proofs')
                .getPublicUrl(filePath);

            // 2. Registrar en la base de datos
            const response = await fetch(`/api/orders/${orderId}/confirm-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reference,
                    amount: parseFloat(amount),
                    screenshot_url: publicUrl,
                    account_id: selectedMethod?.account_id,
                    currency: selectedCurrency
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al enviar la confirmación');
            }

            toast.success('Confirmación enviada con éxito');
            setShowForm(false);
            setReference('');
            setAmount('');
            setFile(null);
            setPreview(null);
            fetchData();
            onSuccess?.();

            // Redirect to home page after briefly showing the success toast
            setTimeout(() => {
                router.push('/');
            }, 1000);
        } catch (error: any) {
            console.error('Error confirming payment:', error);
            toast.error(error.message || 'Error al procesar la confirmación');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Convert each payment to USD equivalent before summing
    const totalReportedUsd = existingConfirmations.reduce((sum, c) => {
        const confCurrency = c.finance_accounts?.currency || 'USD';
        const amountPaid = c.amount_paid || 0;
        // If the payment was in local currency (non-USD), convert to USD
        if (confCurrency !== 'USD' && exchangeRate > 0) {
            return sum + (amountPaid / exchangeRate);
        }
        return sum + amountPaid;
    }, 0);
    const isFullyReported = totalReportedUsd >= total && total > 0;

    // Determine currency of selected method
    const selectedMethod = methods.find(m => m.id === selectedMethodId);
    let selectedCurrency = selectedMethod?.currency || 'USD';

    // Heuristic: If it says "pago movil", "bs", or "ves" in the name, it's likely Bolívares
    const nameLower = selectedMethod?.name?.toLowerCase() || '';
    if (selectedCurrency === 'USD' && (
        nameLower.includes('pago movil') ||
        nameLower.includes('bolivar') ||
        nameLower.includes(' bs') ||
        nameLower.endsWith(' bs') ||
        nameLower.includes('ves')
    )) {
        selectedCurrency = 'Bs';
    }

    const isLocalCurrency = selectedCurrency !== 'USD';
    const displayTotal = isLocalCurrency ? total * exchangeRate : total;
    const displayRemaining = isLocalCurrency ? (total - totalReportedUsd) * exchangeRate : (total - totalReportedUsd);
    const currencyLabel = isLocalCurrency ? selectedCurrency : '$';

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin h-6 w-6 text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Summary Card */}
            {existingConfirmations.length > 0 && (
                <Card className="border-2 shadow-sm overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
                    <CardHeader className="pb-2 border-b bg-white dark:bg-slate-900">
                        <CardTitle className="text-xs font-black uppercase italic tracking-tighter flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <History size={14} className="text-primary" /> Pagos Informados
                            </span>
                            <Badge variant={isFullyReported ? "default" : "outline"} className="text-[9px] font-black uppercase">
                                {isFullyReported ? 'Total Cubierto' : 'Pendiente'}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        {existingConfirmations.map((conf, idx) => (
                            <div key={conf.id || idx} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200">
                                        {conf.screenshot_url ? (
                                            <img src={conf.screenshot_url} alt="Boucher" className="h-full w-full object-cover" />
                                        ) : (
                                            <Eye size={14} className="text-slate-400" />
                                        )}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black uppercase italic leading-none">Ref: {conf.reference_number}</p>
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase">{new Date(conf.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-black text-primary italic leading-none">
                                            {(conf.finance_accounts?.currency && conf.finance_accounts.currency !== 'USD')
                                                ? `${conf.finance_accounts.currency} ${conf.amount_paid.toFixed(2)}`
                                                : `$${conf.amount_paid.toFixed(2)}`
                                            }
                                        </p>
                                        <Badge className={`text-[7px] h-3 px-1 font-black uppercase ${conf.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'
                                            }`}>
                                            {conf.status === 'approved' ? 'Aprobado' : 'Pendiente'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="pt-2 border-t flex justify-between items-center px-1">
                            <span className="text-[10px] font-black uppercase italic text-muted-foreground">Total Informado:</span>
                            <span className={cn(
                                "text-sm font-black italic",
                                isFullyReported ? "text-emerald-600" : "text-primary"
                            )}>
                                ${totalReportedUsd.toFixed(2)} / ${total.toFixed(2)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {showForm || existingConfirmations.length === 0 ? (
                <Card className="border-2 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b relative">
                        {existingConfirmations.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-2 text-[10px] font-black uppercase"
                                onClick={() => setShowForm(false)}
                            >
                                Cancelar
                            </Button>
                        )}
                        <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            {existingConfirmations.length > 0 ? 'Añadir Otro Pago' : 'Informar Pago'}
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase italic">
                            Sube tu comprobante para agilizar el despacho de tu pedido
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase italic">Método Utilizado</Label>
                                <Select value={selectedMethodId} onValueChange={setSelectedMethodId}>
                                    <SelectTrigger className="rounded-xl border-2 font-bold h-11 bg-slate-50 dark:bg-slate-900">
                                        <SelectValue placeholder="Selecciona el método" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {methods.map(m => (
                                            <SelectItem key={m.id} value={m.id} className="font-black uppercase italic text-xs">
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reference" className="text-[10px] font-black uppercase italic">Ref / Transacción</Label>
                                    <Input
                                        id="reference"
                                        placeholder="Ej: 123456"
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                        className="rounded-xl border-2 font-mono h-11"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount" className={cn(
                                        "text-[10px] font-black uppercase italic transition-colors",
                                        isLocalCurrency ? "text-emerald-600" : "text-slate-700"
                                    )}>
                                        Monto ({currencyLabel})
                                    </Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        placeholder={(existingConfirmations.length > 0 ? displayRemaining : displayTotal).toFixed(2)}
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className={cn(
                                            "rounded-xl border-2 font-mono h-11 transition-all",
                                            isLocalCurrency && "border-emerald-200 focus:border-emerald-500 bg-emerald-50/30"
                                        )}
                                        required
                                    />
                                    {isLocalCurrency ? (
                                        <div className="flex flex-col gap-1">
                                            <p className="text-[10px] text-emerald-700 font-black italic uppercase leading-none">
                                                * Ingresa el monto exacto en {selectedCurrency}
                                            </p>
                                            <p className="text-[9px] text-muted-foreground font-bold italic">
                                                Equivale a ${(parseFloat(amount || '0') / exchangeRate).toFixed(2)} USD (Tasa: {exchangeRate.toFixed(2)})
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-[9px] text-muted-foreground font-bold italic">
                                            Ingresa el monto pagado en Dólares ($)
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase italic text-primary">Comprobante (Imagen/PDF)</Label>
                                <div
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                    className="relative border-2 border-dashed rounded-2xl p-6 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all cursor-pointer group flex flex-col items-center justify-center gap-2 overflow-hidden min-h-[120px]"
                                >
                                    {preview ? (
                                        <div className="absolute inset-0">
                                            <img src={preview} alt="Preview" className="w-full h-full object-cover opacity-40" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all">
                                                <p className="text-white text-[10px] font-black uppercase italic">Cambiar imagen</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="bg-primary/10 p-2 rounded-full group-hover:scale-110 transition-transform">
                                                <ImagePlus className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-black uppercase italic">Sube el boucher aquí</p>
                                                <p className="text-[8px] text-muted-foreground uppercase font-bold italic">Max 5MB</p>
                                            </div>
                                        </>
                                    )}
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl flex items-start gap-2 border border-amber-100 dark:border-amber-900/30">
                                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-[9px] text-amber-800 dark:text-amber-200 font-bold uppercase italic leading-tight">
                                    Verifica que el monto y la referencia coincidan con tu banco para evitar retrasos.
                                </p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                                <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Política de Devolución</h4>
                                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 italic leading-tight">
                                    Solo se permiten cambios por otros productos. Si el nuevo artículo es de menor valor, la diferencia se acreditará a tu cuenta como saldo a favor.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-xl h-14 font-black uppercase italic tracking-tighter text-lg shadow-lg shadow-primary/20"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    'Confirmar este Pago'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                <Button
                    className="w-full h-14 rounded-2xl border-2 border-dashed border-primary/40 text-primary hover:bg-primary/5 font-black uppercase italic tracking-tighter gap-2"
                    variant="outline"
                    onClick={() => setShowForm(true)}
                >
                    <Plus size={20} /> Informar otro pago
                </Button>
            )}
        </div>
    );
}
