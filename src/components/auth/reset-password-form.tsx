'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, CheckCircle2 } from 'lucide-react';
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
import { useUpdatePassword } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const resetPasswordSchema = z.object({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ['confirmPassword'],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
    const [isSuccess, setIsSuccess] = useState(false);
    const updatePassword = useUpdatePassword();
    const router = useRouter();

    const form = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (data: ResetPasswordValues) => {
        try {
            await updatePassword.mutateAsync({ password: data.password });
            setIsSuccess(true);
            toast.success('Contraseña actualizada correctamente');
            setTimeout(() => {
                router.push('/');
            }, 3000);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al actualizar la contraseña';
            toast.error(message);
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center space-y-4 py-8 max-w-sm mx-auto">
                <div className="flex justify-center">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-in zoom-in duration-500" />
                </div>
                <h2 className="text-2xl font-bold">¡Todo listo!</h2>
                <p className="text-muted-foreground">
                    Tu contraseña ha sido actualizada. Serás redirigido al inicio en unos segundos.
                </p>
                <Button
                    className="w-full"
                    onClick={() => router.push('/')}
                >
                    Ir al Inicio Ahora
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-sm mx-auto space-y-6 py-8">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Nueva Contraseña</h2>
                <p className="text-sm text-muted-foreground">
                    Escribe tu nueva contraseña para recuperar el acceso a tu cuenta.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nueva Contraseña</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirmar Contraseña</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
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
                        disabled={updatePassword.isPending}
                    >
                        {updatePassword.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Actualizando...
                            </>
                        ) : (
                            'Guardar Nueva Contraseña'
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
