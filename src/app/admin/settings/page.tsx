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
    personalization_price_small: number;
    personalization_price_large: number;
    design_price_small: number;
    design_price_medium: number;
    design_price_large: number;
    pago_movil_info: string;
    zelle_info: string;
    crm_webhook_url: string;
    canva_api_key?: string;
}

export default function AdminSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<StoreSettings>({
        personalization_price_small: 1.00,
        personalization_price_large: 3.00,
        design_price_small: 2.00,
        design_price_medium: 5.00,
        design_price_large: 10.00,
        pago_movil_info: '',
        zelle_info: '',
        crm_webhook_url: '',
        canva_api_key: ''
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
                    personalization_price_small: Number(data.personalization_price_small ?? 1.00),
                    personalization_price_large: Number(data.personalization_price_large ?? 3.00),
                    design_price_small: Number(data.design_price_small ?? 2.00),
                    design_price_medium: Number(data.design_price_medium ?? 5.00),
                    design_price_large: Number(data.design_price_large ?? 10.00),
                    pago_movil_info: data.pago_movil_info || '',
                    zelle_info: data.zelle_info || '',
                    crm_webhook_url: data.crm_webhook_url || '',
                    canva_api_key: data.canva_api_key || ''
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
                <p className="text-muted-foreground">Configura los precios globales, métodos de pago e integraciones.</p>
            </div>

            <div className="grid gap-6">
                {/* Payment Methods Section Start */}

                {/* Pago Móvil */}
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Smartphone className="text-primary h-5 w-5" /> Pago Móvil
                        </CardTitle>
                        <CardDescription>Información que verá el cliente para realizar el pago móvil.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Ej: Banco Mercantil, Cedula: V-1234567, Tlf: 0412..."
                            value={settings.pago_movil_info}
                            onChange={(e) => handleUpdateField('pago_movil_info', e.target.value)}
                            className="min-h-[100px] font-mono text-sm bg-slate-50 dark:bg-slate-900 border-none"
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

                {/* Canva Integration */}
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="text-primary h-5 w-5" /> Integración Canva
                        </CardTitle>
                        <CardDescription>API Key de Canva para habilitar el botón de diseño en el panel.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Input
                            type="password"
                            placeholder="Canva API Key"
                            value={settings.canva_api_key || ''}
                            onChange={(e) => handleUpdateField('canva_api_key', e.target.value)}
                            className="font-mono text-sm bg-slate-50 dark:bg-slate-900 border-none h-12"
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
