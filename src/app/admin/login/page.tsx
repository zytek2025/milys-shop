'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Shield, Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/store/cart-store';

export default function AdminLoginPage() {
    const router = useRouter();
    const { setUserId, setUser, setAuthenticated, setAdmin } = useAuth();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const supabase = createClient();
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                toast.error("Credenciales incorrectas o acceso no autorizado");
                setLoading(false);
                return;
            }

            if (data.user) {
                // Fetch profile to verify admin status
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                // Check staff_users as fallback/primary source of truth for permissions
                const { data: staff } = await supabase
                    .from('staff_users')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (!staff && (!profile || profile.role !== 'admin')) {
                    toast.error("Este usuario no tiene permisos de administrador");
                    await supabase.auth.signOut();
                    setLoading(false);
                    return;
                }

                // Merge staff info into profile for the store if needed
                const finalProfile = {
                    ...(profile || {}),
                    role: 'admin',
                    is_super_admin: staff?.is_super_admin || profile?.is_super_admin || false,
                    permissions: staff?.permissions || profile?.permissions
                };

                // Update store
                setUserId(data.user.id);
                setUser(finalProfile as any);
                setAuthenticated(true);
                setAdmin(true);

                toast.success("Bienvenido al Panel Administrativo");
                router.push('/admin');
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50"></div>

            <Card className="w-full max-w-xl border-none bg-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden relative z-10 transition-all">
                <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-500 to-primary animate-shimmer bg-[length:200%_100%]"></div>

                <CardHeader className="pt-16 pb-8 text-center space-y-4">
                    <div className="inline-flex h-20 w-20 bg-slate-800 rounded-[2rem] items-center justify-center mx-auto mb-4 border border-slate-700 shadow-xl shadow-black/20 group hover:rotate-6 transition-transform">
                        <Shield className="h-10 w-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <CardTitle className="text-4xl font-black italic tracking-tighter uppercase text-white">Acceso de Seguridad</CardTitle>
                        <CardDescription className="text-slate-400 font-medium text-lg">Inicia sesión con tus credenciales administrativas</CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="px-12 py-8">
                    <form onSubmit={handleLogin} className="space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Email Corporativo</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@milys.shop"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-16 pl-12 bg-slate-950 border-slate-800 text-white rounded-2xl font-bold text-lg focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Contraseña Maestra</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-16 pl-12 bg-slate-950 border-slate-800 text-white rounded-2xl font-bold text-lg focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-18 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 text-xl font-black italic uppercase tracking-widest gap-3 shadow-[0_10px_40px_rgba(255,255,255,0.1)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Shield className="h-6 w-6" />}
                            Entrar al Sistema
                            <ArrowRight size={20} className="ml-1" />
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="pb-16 pt-4 flex flex-col gap-4 text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold opacity-50">
                        Sistema Encriptado de Grado Militar
                    </p>
                    <div className="flex justify-center gap-6">
                        <div className="h-1 w-12 bg-slate-800 rounded-full"></div>
                        <div className="h-1 w-12 bg-slate-800 rounded-full"></div>
                        <div className="h-1 w-12 bg-slate-800 rounded-full"></div>
                    </div>
                </CardFooter>
            </Card>

            {/* Bottom info */}
            <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-600 text-[10px] font-bold uppercase tracking-[0.4em]">
                Mily's Shop © 2024 • Admin Security Layer
            </p>
        </div>
    );
}
