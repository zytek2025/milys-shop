'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, RefreshCcw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HealthPage() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const checkHealth = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/health-check');
            const data = await res.json();
            setStatus(data);
        } catch (e) {
            setStatus({ error: 'Error de conexión' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkHealth();
    }, []);

    const envVars = status ? [
        { name: 'NEXT_PUBLIC_SUPABASE_URL', status: status.NEXT_PUBLIC_SUPABASE_URL },
        { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', status: status.NEXT_PUBLIC_SUPABASE_ANON_KEY },
        { name: 'SUPABASE_SERVICE_ROLE_KEY', status: status.SUPABASE_SERVICE_ROLE_KEY, isSecret: true },
    ] : [];

    return (
        <div className="max-w-2xl mx-auto space-y-6 py-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tight">Diagnóstico <span className="text-primary">de Sistema</span></h1>
                    <p className="text-muted-foreground font-medium">Verificación de variables de entorno en producción.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={checkHealth} disabled={loading} className="rounded-xl">
                    <RefreshCcw className={loading ? "animate-spin" : ""} />
                </Button>
            </div>

            {status?.SUPABASE_SERVICE_ROLE_KEY === false && (
                <Card className="border-2 border-rose-500 bg-rose-50 dark:bg-rose-950/20 rounded-[2rem]">
                    <CardContent className="p-6 flex gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white shrink-0">
                            <ShieldAlert size={24} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-black uppercase text-sm text-rose-600 dark:text-rose-400">Error Crítico Detectado</h3>
                            <p className="text-sm font-medium text-rose-800 dark:text-rose-300 leading-relaxed">
                                La <strong>SUPABASE_SERVICE_ROLE_KEY</strong> no está llegando al servidor. Sin esta clave, las funciones de administración (borrar usuarios, etc.) no funcionarán.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="border-2 shadow-xl rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b-2">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Variables de Entorno</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y-2">
                        {loading ? (
                            <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                        ) : (
                            <>
                                {envVars.map((v) => (
                                    <div key={v.name} className="p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <span className="font-bold text-sm tracking-tight">{v.name}</span>
                                        <div className="flex items-center gap-2">
                                            {v.status ? (
                                                <Badge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100 font-bold gap-1.5 px-3">
                                                    <CheckCircle2 size={14} /> Configurado
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive" className="font-bold gap-1.5 px-3">
                                                    <XCircle size={14} /> Faltante
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {status?.available_keys && status.available_keys.length > 0 && (
                                    <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">Claves detectadas en el servidor:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {status.available_keys.map((k: string) => (
                                                <Badge key={k} variant="secondary" className="font-mono text-[10px] bg-white border-2">
                                                    {k}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="p-8 bg-slate-100 dark:bg-slate-900 rounded-[2rem] space-y-4">
                <h3 className="font-black uppercase text-xs tracking-[0.2em] text-muted-foreground">Instrucciones para AWS Amplify</h3>
                <ol className="text-sm space-y-3 font-medium list-decimal ml-4 text-slate-700 dark:text-slate-300">
                    <li>Entra a tu consola de <strong>AWS Amplify</strong>.</li>
                    <li>Ve a <strong>App settings &gt; Environment variables</strong>.</li>
                    <li>Asegúrate de que <strong>SUPABASE_SERVICE_ROLE_KEY</strong> existe y tiene el valor correcto.</li>
                    <li><strong>IMPORTANTE:</strong> Después de guardarla, ve a <strong>Deploys</strong> y haz clic en <strong>"Redeploy"</strong> de la última versión para que tome los cambios.</li>
                </ol>
            </div>
        </div>
    );
}
