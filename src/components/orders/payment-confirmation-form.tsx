'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImagePlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface PaymentConfirmationFormProps {
    orderId: string;
    total: number;
    onSuccess?: () => void;
}

export function PaymentConfirmationForm({ orderId, total, onSuccess }: PaymentConfirmationFormProps) {
    const supabase = createClient();
    const [reference, setReference] = useState('');
    const [amount, setAmount] = useState(total.toString());
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDone, setIsDone] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !reference || !amount) {
            toast.error('Por favor completa todos los campos y sube el comprobante');
            return;
        }

        setIsSubmitting(true);
        try {
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
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al enviar la confirmación');
            }

            setIsDone(true);
            toast.success('Confirmación enviada con éxito');
            onSuccess?.();
        } catch (error: any) {
            console.error('Error confirming payment:', error);
            toast.error(error.message || 'Error al procesar la confirmación');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isDone) {
        return (
            <Card className="border-2 border-emerald-100 bg-emerald-50/30 dark:bg-emerald-950/10">
                <CardContent className="pt-6 text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full">
                            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-black uppercase italic tracking-tighter">¡Pago Informado!</h3>
                        <p className="text-xs text-muted-foreground font-bold uppercase italic">
                            Nuestro equipo verificará tu transacción a la brevedad. Recibirás una notificación por WhatsApp una vez aprobado.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-2 shadow-xl overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b">
                <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Informar Pago
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase italic">
                    Sube tu comprobante para agilizar el despacho de tu pedido
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="reference" className="text-[10px] font-black uppercase italic">Nro de Referencia / Transacción</Label>
                            <Input
                                id="reference"
                                placeholder="Ej: 123456789"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                className="rounded-xl border-2 font-mono"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-[10px] font-black uppercase italic">Monto Pagado ($)</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="rounded-xl border-2 font-mono"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase italic">Captura de Pantalla / Comprobante</Label>
                        <div
                            onClick={() => document.getElementById('file-upload')?.click()}
                            className="relative border-2 border-dashed rounded-2xl p-8 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all cursor-pointer group flex flex-col items-center justify-center gap-3 overflow-hidden"
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
                                    <div className="bg-primary/10 p-3 rounded-full group-hover:scale-110 transition-transform">
                                        <ImagePlus className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-black uppercase italic">Haz clic para subir</p>
                                        <p className="text-[9px] text-muted-foreground uppercase font-bold italic">JPG, PNG o PDF (Max 5MB)</p>
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
                        <p className="text-[9px] text-amber-800 dark:text-amber-200 font-bold uppercase italic">
                            Asegúrate de que el número de referencia coincida con el de tu banco para evitar retrasos.
                        </p>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-xl py-6 font-black uppercase italic tracking-tighter text-lg shadow-lg shadow-primary/20"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            'Enviar Confirmación de Pago'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
