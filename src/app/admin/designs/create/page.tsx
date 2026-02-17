'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Palette, Save, ArrowLeft, Upload, Image as ImageIcon, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AdminDesignCreatePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDesigning, setIsDesigning] = useState(false);
    const [designFile, setDesignFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Form fields
    const [name, setName] = useState('');
    const [price, setPrice] = useState('0');

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setDesignFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            if (!name) setName(file.name.split('.')[0]);
        }
    };

    const handleSaveDesign = async () => {
        if (!designFile) {
            toast.error("Por favor selecciona una imagen");
            return;
        }

        setSaving(true);
        const formData = new FormData();
        formData.append('file', designFile);
        formData.append('name', name);
        formData.append('price', price);

        try {
            const res = await fetch('/api/admin/designs/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                toast.success("Diseño guardado exitosamente");
                router.push('/admin/designs');
            } else {
                const data = await res.json();
                toast.error(data.error || "Error al guardar el diseño");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" asChild className="rounded-xl">
                        <Link href="/admin/designs"><ArrowLeft className="mr-2" size={18} /> Volver</Link>
                    </Button>
                    <h1 className="text-2xl font-black italic tracking-tighter uppercase">Subir Nuevo Diseño</h1>
                </div>
            </div>

            <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-1.5 text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Production Ready Studio</span>
                </div>

                <CardContent className="p-8 md:p-12">
                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Left Side: Upload / Preview */}
                        <div className="space-y-6">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "aspect-square rounded-[2rem] border-4 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 text-center overflow-hidden",
                                    previewUrl ? "border-emerald-500/50 bg-slate-50 dark:bg-slate-950" : "border-slate-200 dark:border-slate-800 hover:border-primary/50 bg-slate-50/50"
                                )}
                            >
                                {previewUrl ? (
                                    <div className="relative w-full h-full">
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="absolute top-2 right-2 rounded-full h-8 w-8"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewUrl(null);
                                                setDesignFile(null);
                                            }}
                                        >
                                            <X size={16} />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="h-20 w-20 bg-primary/10 rounded-3xl mx-auto flex items-center justify-center text-primary">
                                            <Upload size={40} />
                                        </div>
                                        <div>
                                            <p className="font-black text-xl italic uppercase tracking-tight">Seleccionar Archivo</p>
                                            <p className="text-sm text-muted-foreground mt-1">PNG, JPG o SVG (Max 5MB)</p>
                                        </div>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                />
                            </div>
                        </div>

                        {/* Right Side: Details */}
                        <div className="flex flex-col justify-center space-y-8">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nombre del Diseño</Label>
                                    <Input
                                        placeholder="Ej: Logo Mily's 2024"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-14 rounded-2xl border-2 font-bold text-lg focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Precio de Venta ($)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="h-14 rounded-2xl border-2 font-black text-2xl text-emerald-600 focus:ring-emerald-500/20"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={handleSaveDesign}
                                    disabled={saving || !designFile}
                                    className="w-full h-16 rounded-[1.5rem] text-xl font-black italic uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 gap-3"
                                >
                                    {saving ? <Loader2 className="animate-spin" /> : <Save />}
                                    Guardar en Colección
                                </Button>
                                <p className="text-center text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mt-4">
                                    El diseño estará disponible inmediatamente para los clientes.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
import { cn } from '@/lib/utils';
