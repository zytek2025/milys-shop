'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Send } from 'lucide-react';
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
import { toast } from 'sonner';

const guestQuoteSchema = z.object({
    fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Por favor introduce un email válido'),
    whatsapp: z.string().min(10, 'Introduce un número de WhatsApp válido'),
});

type GuestQuoteFormValues = z.infer<typeof guestQuoteSchema>;

interface GuestQuoteFormProps {
    onSuccess: (data: GuestQuoteFormValues) => void;
    onSwitchToLogin?: () => void;
}

export function GuestQuoteForm({ onSuccess, onSwitchToLogin }: GuestQuoteFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<GuestQuoteFormValues>({
        resolver: zodResolver(guestQuoteSchema),
        defaultValues: {
            fullName: '',
            email: '',
            whatsapp: '',
        },
    });

    const onSubmit = async (data: GuestQuoteFormValues) => {
        setIsLoading(true);
        try {
            // Simplemente pasamos los datos al componente padre para que haga el checkout
            onSuccess(data);
        } catch (error) {
            toast.error('Ocurrió un error al procesar tus datos.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl mb-4">
                    <p className="text-xs text-amber-800 font-medium leading-relaxed italic">
                        Como tu pedido incluye diseños personalizados, no necesitas pagar ahora.
                        Déjanos tus datos y te contactaremos con el presupuesto final. ✨
                    </p>
                </div>

                <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre Completo</FormLabel>
                            <FormControl>
                                <Input placeholder="Juan Pérez" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="tu@ejemplo.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>WhatsApp</FormLabel>
                            <FormControl>
                                <Input placeholder="+58 424 123 4567" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl font-bold"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            SOLICITAR PRESUPUESTO <Send className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>

                {onSwitchToLogin && (
                    <p className="text-center text-xs text-muted-foreground pt-2">
                        ¿Ya tienes cuenta?{' '}
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="text-emerald-700 font-bold hover:underline"
                        >
                            Inicia Sesión
                        </button>
                    </p>
                )}
            </form>
        </Form>
    );
}
