'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Loader2, Landmark, Smartphone, MessageSquareQuote, Type, Palette } from 'lucide-react';

interface StoreSettings {
    pago_movil_info: string;
    zelle_info: string;
    crm_webhook_url: string;
}

export default function AdminSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<StoreSettings>({
        pago_movil_info: '',
        zelle_info: '',
        crm_webhook_url: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (res.ok) {
                setSettings({
                    pago_movil_info: data.pago_movil_info || '',
                    zelle_info: data.zelle_info || '',
                    crm_webhook_url: data.crm_webhook_url || ''
                });
            } else {
                toast.error(data.error || 'Error al cargar ajustes');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateField = (field: keyof StoreSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Ajustes guardados correctamente');
            } else {
                toast.error(data.error || 'Error al guardar');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-4">
            <div>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">Ajustes de la Tienda</h1>
                <p className="text-muted-foreground">Configura los métodos de pago e integraciones.</p>
            </div>

            <div className="grid gap-6">
                {/* Pago Móvil */}
                <Card className="border-2 shadow-lg shadow-primary/5 bg-slate-50/50 dark:bg-slate-900/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 italic">
                            <Smartphone className="text-primary h-5 w-5" /> Pago Móvil
                        </CardTitle>
                        <CardDescription>Información que verá el cliente para realizar el pago móvil.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Ej: Banco Mercantil, Cedula: V-1234567, Tlf: 0412..."
                            value={settings.pago_movil_info}
                            onChange={(e) => handleUpdateField('pago_movil_info', e.target.value)}
                            className="min-h-[100px] font-mono text-sm bg-white dark:bg-slate-950 border-2"
                        />
                    </CardContent>
                </Card>

                {/* Zelle */}
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Landmark className="text-primary h-5 w-5" /> Zelle
                        </CardTitle>
                        <CardDescription>Correo electrónico y titular para transferencias vía Zelle.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Ej: Correo: ventas@tienda.com, Titular: ShopHub Inc."
                            value={settings.zelle_info}
                            onChange={(e) => handleUpdateField('zelle_info', e.target.value)}
                            className="min-h-[100px] font-mono text-sm bg-slate-50 dark:bg-slate-900 border-none"
                        />
                    </CardContent>
                </Card>

                {/* CRM Webhook */}
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquareQuote className="text-primary h-5 w-5" /> Integración CRM
                        </CardTitle>
                        <CardDescription>URL del Webhook (n8n/Make) para notificar pedidos pagados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Input
                            placeholder="https://n8n.tuempresa.com/webhook/..."
                            value={settings.crm_webhook_url}
                            onChange={(e) => handleUpdateField('crm_webhook_url', e.target.value)}
                            className="font-mono text-sm bg-slate-50 dark:bg-slate-900 border-none h-12"
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-16 rounded-2xl px-12 text-xl font-black italic uppercase shadow-xl shadow-primary/20 gap-3"
                >
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                    Guardar Ajustes Globales
                </Button>
            </div>
        </div>
    );
}
