'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ArrowLeft } from 'lucide-react';
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
import { useRequestPasswordReset } from '@/hooks/use-auth';
import { toast } from 'sonner';

const forgotPasswordSchema = z.object({
    email: z.string().email('Por favor introduce un email válido'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
    onBack?: () => void;
    onSuccess?: () => void;
}

export function ForgotPasswordForm({ onBack, onSuccess }: ForgotPasswordFormProps) {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const requestReset = useRequestPasswordReset();

    const form = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
        },
    });

    const onSubmit = async (data: ForgotPasswordValues) => {
        try {
            await requestReset.mutateAsync(data);
            setIsSubmitted(true);
            toast.success('Correo de recuperación enviado');
            onSuccess?.();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al enviar el correo';
            toast.error(message);
        }
    };

    if (isSubmitted) {
        return (
            <div className="text-center space-y-4 py-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                        Hemos enviado un enlace de recuperación a <strong>{form.getValues('email')}</strong>.
                        Por favor, revisa tu bandeja de entrada.
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={onBack}
                >
                    Volver al Inicio de Sesión
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-lg font-bold">Recuperar Contraseña</h3>
            </div>

            <p className="text-sm text-muted-foreground">
                Introduce tu email y te enviaremos un enlace para que puedas volver a entrar.
            </p>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        placeholder="tu@ejemplo.com"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600"
                        disabled={requestReset.isPending}
                    >
                        {requestReset.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando correo...
                            </>
                        ) : (
                            'Enviar Enlace'
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
