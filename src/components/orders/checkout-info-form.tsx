'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/store/cart-store';

const checkoutInfoSchema = z.object({
    whatsapp: z.string().min(10, 'Introduce un número de WhatsApp válido (min 10 dígitos)'),
    shipping_address: z.string().min(10, 'Por favor, introduce una dirección detallada para el envío'),
});

type CheckoutInfoValues = z.infer<typeof checkoutInfoSchema>;

interface CheckoutInfoFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export function CheckoutInfoForm({ onSuccess, onCancel }: CheckoutInfoFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { user, setUser } = useAuth();
    const supabase = createClient();

    const form = useForm<CheckoutInfoValues>({
        resolver: zodResolver(checkoutInfoSchema),
        defaultValues: {
            whatsapp: user?.whatsapp || '',
            shipping_address: user?.shipping_address || '',
        },
    });

    const onSubmit = async (data: CheckoutInfoValues) => {
        if (!user) return;
        setIsLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    whatsapp: data.whatsapp,
                    shipping_address: data.shipping_address,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            // Update local state so checkout button proceeds
            setUser({ ...user, whatsapp: data.whatsapp, shipping_address: data.shipping_address });

            toast.success('Datos de envío guardados correctamente');
            onSuccess(); // Triggers the actual checkout continuation
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'No pudimos guardar tus datos, intenta de nuevo');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl mb-4">
                    <p className="text-xs text-emerald-800 font-bold leading-relaxed">
                        ¡Casi listo! Solo necesitamos tu número de contacto y dirección para enviar tu pedido.
                        Estos datos se guardarán para tus próximas compras. ✨
                    </p>
                </div>

                <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider">Número de WhatsApp</FormLabel>
                            <FormControl>
                                <Input placeholder="+58 424 123 4567" className="h-12 rounded-xl" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="shipping_address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider">Dirección de Envío Completa</FormLabel>
                            <FormControl>
                                <textarea
                                    className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                                    placeholder="Ciudad, municipio, sector, calle/avenida, número de casa, punto de referencia..."
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Política de Devolución</p>
                    <p className="text-[11px] text-muted-foreground leading-tight italic font-medium">
                        Solo se permiten cambios por otros productos. Si el nuevo artículo es de menor valor, la diferencia se acreditará a tu cuenta como saldo a favor.
                    </p>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="w-1/3 h-12 rounded-xl"
                    >
                        Volver
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-2/3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 h-12 rounded-xl font-bold uppercase shadow-lg shadow-emerald-500/20"
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Guardar y Continuar'}
                        {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
