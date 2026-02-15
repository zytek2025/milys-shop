'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLogin } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Lock, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const login = useLogin();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await login.mutateAsync({ email, password });

            if (result.data?.role === 'admin') {
                toast.success('Acceso concedido. Bienvenido al panel.');
                router.push('/admin');
            } else {
                toast.error('No tienes permisos de administrador.');
                router.push('/');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <div className="absolute top-8 left-8">
                <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                    <ArrowLeft size={16} />
                    Volver a la tienda
                </Link>
            </div>

            <Card className="w-full max-w-md shadow-xl border-lavanda/20">
                <CardHeader className="space-y-2 text-center">
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary/20 mb-2">
                        M
                    </div>
                    <CardTitle className="text-2xl font-serif tracking-tight">Acceso Administrativo</CardTitle>
                    <CardDescription>
                        Ingresa tus credenciales para gestionar Mily's Shop
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@milys.shop"
                                    className="pl-10"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Contraseña</Label>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    className="pl-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-semibold tracking-wide"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Verificando...' : 'Entrar al Panel'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
