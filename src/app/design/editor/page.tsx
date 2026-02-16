'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Palette, Save, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function DesignEditorPage() {
    const [isDesigning, setIsDesigning] = useState(false);
    const [designUrl, setDesignUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Simulated Canva integration configuration
    const CANVA_API_KEY = "PLACEHOLDER_KEY";
    const USER_EMAIL = "bejarano.v189@gmail.com"; // Provided by user

    const handleLaunchCanva = () => {
        setIsDesigning(true);
        // In a real implementation, this would initialize the Canva SDK
        // window.Canva.DesignButton.initialize({ apiKey: CANVA_API_KEY });

        // Simulating the design process
        setTimeout(() => {
            setIsDesigning(false);
            setDesignUrl("https://www.canva.com/design/DAFxtXyZ/view?utm_content=DAFxtXyZ&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink"); // Mock URL
            toast.success("¡Diseño creado en Canva exitosamente!");
        }, 3000);
    };

    const handleSaveDesign = async () => {
        if (!designUrl) return;
        setSaving(true);

        // Simulate saving to Supabase
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success("Diseño guardado en tu cuenta");
            // Redirect or close modal logic would go here
        } catch (error) {
            toast.error("Error al guardar el diseño");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-4xl">
                <div className="mb-8 flex items-center gap-4">
                    <Button variant="ghost" asChild>
                        <Link href="/"><ArrowLeft className="mr-2" size={18} /> Volver a la tienda</Link>
                    </Button>
                </div>

                <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 p-1 text-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Custom Studio // Powered by Canva</span>
                    </div>

                    <CardContent className="p-12 text-center min-h-[500px] flex flex-col items-center justify-center">
                        {!designUrl ? (
                            isDesigning ? (
                                <div className="space-y-6 animate-pulse">
                                    <div className="h-20 w-20 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-400/30">
                                        <Palette className="text-white h-10 w-10 animate-spin" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white italic">Abriendo Studio...</h2>
                                    <p className="text-slate-500">Conectando con Canva para crear tu obra maestra.</p>
                                </div>
                            ) : (
                                <div className="space-y-8 max-w-lg mx-auto">
                                    <div className="h-32 w-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl shadow-purple-500/20 rotate-6 hover:rotate-0 transition-transform duration-500">
                                        <Palette className="text-white h-16 w-16" />
                                    </div>
                                    <div>
                                        <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-4 italic">Diseña tu Estilo</h1>
                                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                                            Usa nuestras herramientas profesionales para personalizar cada detalle. Añade textos, logos y colores únicos.
                                        </p>
                                    </div>

                                    <Button
                                        onClick={handleLaunchCanva}
                                        size="lg"
                                        className="h-16 px-12 rounded-2xl text-lg font-black uppercase tracking-wider bg-[#00C4CC] hover:bg-[#00b3ba] text-white shadow-xl shadow-[#00C4CC]/30 transition-all hover:scale-105"
                                    >
                                        <span className="flex items-center gap-3">
                                            Iniciar Diseño <ExternalLink size={20} />
                                        </span>
                                    </Button>
                                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Powered by Canva API</p>
                                </div>
                            )
                        ) : (
                            <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 mb-2">
                                        <Save size={32} />
                                    </div>
                                    <h2 className="text-4xl font-black italic tracking-tight text-slate-900 dark:text-white">¡Diseño Completado!</h2>
                                    <p className="text-slate-500 max-w-md mx-auto">Tu diseño ha sido generado exitosamente. Guarda los cambios para añadirlo a tu pedido.</p>
                                </div>

                                <div className="relative aspect-video w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                                    {/* Placeholder for iframe or image of the design */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-200 dark:bg-slate-900/50">
                                        <span className="text-slate-400 font-bold italic">Vista previa del diseño</span>
                                    </div>
                                </div>

                                <div className="flex justify-center gap-4">
                                    <Button variant="outline" onClick={() => setDesignUrl(null)} className="h-12 px-8 rounded-xl font-bold">
                                        Editar de nuevo
                                    </Button>
                                    <Button
                                        onClick={handleSaveDesign}
                                        disabled={saving}
                                        className="h-12 px-8 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                                    >
                                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Guardar y Continuar'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
