'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Loader2, Landmark, Smartphone, MessageSquareQuote, Type, Palette, Plus, Trash2, Globe, CreditCard, DollarSign, Wallet, Bitcoin, Zap, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    whatsapp_number?: string;
    instagram_handle?: string;
    telegram_username?: string;
    facebook_url?: string;
    contact_email?: string;
    tiktok_handle?: string;
    pinterest_handle?: string;
    payment_methods?: PaymentMethod[];
}

interface PaymentMethod {
    id: string;
    name: string;
    instructions: string;
    icon: string;
    discount_percentage: number;
    is_discount_active: boolean;
}

const AVAILABLE_ICONS = [
    { value: 'Landmark', label: 'Banco/Transferencia', icon: Landmark },
    { value: 'Smartphone', label: 'Pago Móvil/App', icon: Smartphone },
    { value: 'CreditCard', label: 'Tarjeta/POS', icon: CreditCard },
    { value: 'DollarSign', label: 'Divisas/Efectivo', icon: DollarSign },
    { value: 'Wallet', label: 'Billetera Digital', icon: Wallet },
    { value: 'Bitcoin', label: 'Cripto', icon: Bitcoin },
    { value: 'Zap', label: 'Rápido/Flash', icon: Zap },
    { value: 'Globe', label: 'Internacional', icon: Globe },
];

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
        canva_api_key: '',
        whatsapp_number: '',
        instagram_handle: '',
        telegram_username: '',
        facebook_url: '',
        contact_email: '',
        tiktok_handle: '',
        pinterest_handle: '',
        payment_methods: []
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
                    canva_api_key: data.canva_api_key || '',
                    whatsapp_number: data.whatsapp_number || '',
                    instagram_handle: data.instagram_handle || '',
                    telegram_username: data.telegram_username || '',
                    facebook_url: data.facebook_url || '',
                    contact_email: data.contact_email || '',
                    tiktok_handle: data.tiktok_handle || '',
                    pinterest_handle: data.pinterest_handle || '',
                    payment_methods: data.payment_methods || []
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

    const addPaymentMethod = () => {
        const newMethod: PaymentMethod = {
            id: Math.random().toString(36).substring(2, 9),
            name: 'Nuevo Método',
            instructions: '',
            icon: 'Landmark',
            discount_percentage: 0,
            is_discount_active: false
        };
        handleUpdateField('payment_methods', [...(settings.payment_methods || []), newMethod]);
    };

    const removePaymentMethod = (id: string) => {
        handleUpdateField('payment_methods', (settings.payment_methods || []).filter(m => m.id !== id));
    };

    const updatePaymentMethod = (id: string, updates: Partial<PaymentMethod>) => {
        handleUpdateField('payment_methods', (settings.payment_methods || []).map(m =>
            m.id === id ? { ...m, ...updates } : m
        ));
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

                {/* Métodos de Pago Dinámicos */}
                <Card className="border-2 border-primary/20 bg-slate-50/50 dark:bg-slate-900/20">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 uppercase italic font-black tracking-tighter">
                                <CreditCard className="text-primary h-5 w-5" /> Métodos de Pago
                            </CardTitle>
                            <CardDescription>Configura las formas de pago que verán tus clientes.</CardDescription>
                        </div>
                        <Button
                            onClick={addPaymentMethod}
                            variant="outline"
                            size="sm"
                            className="rounded-full border-primary text-primary hover:bg-primary/10 gap-2 font-bold uppercase italic text-[10px]"
                        >
                            <Plus size={14} /> Añadir Método
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {(settings.payment_methods || []).length === 0 ? (
                            <div className="text-center py-10 bg-white dark:bg-slate-950 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <Info className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                <p className="text-xs font-bold uppercase italic text-muted-foreground">No hay métodos de pago configurados</p>
                                <Button variant="link" onClick={addPaymentMethod} className="text-primary text-xs font-black uppercase">¡Crea el primero!</Button>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {(settings.payment_methods || []).map((method, index) => (
                                    <div key={method.id} className="relative group p-6 bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary/30 transition-all">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-4 right-4 h-8 w-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removePaymentMethod(method.id)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase italic text-primary">Nombre del Método</Label>
                                                    <Input
                                                        value={method.name}
                                                        onChange={(e) => updatePaymentMethod(method.id, { name: e.target.value })}
                                                        placeholder="Ej: Binance (USDT), Pago Móvil..."
                                                        className="h-11 bg-slate-50 border-none dark:bg-slate-900 font-bold"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black uppercase italic text-primary">Icono</Label>
                                                        <div className="grid grid-cols-4 gap-1">
                                                            {AVAILABLE_ICONS.map((i) => (
                                                                <Button
                                                                    key={i.value}
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className={cn(
                                                                        "h-9 w-9 rounded-lg border",
                                                                        method.icon === i.value ? "border-primary bg-primary/10 text-primary" : "border-transparent"
                                                                    )}
                                                                    onClick={() => updatePaymentMethod(method.id, { icon: i.value })}
                                                                    title={i.label}
                                                                >
                                                                    <i.icon size={16} />
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black uppercase italic text-emerald-600">% Descuento</Label>
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number"
                                                                value={method.discount_percentage}
                                                                onChange={(e) => updatePaymentMethod(method.id, { discount_percentage: Number(e.target.value) })}
                                                                className="h-11 bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 font-bold text-center"
                                                            />
                                                            <div className="flex items-center gap-1">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={method.is_discount_active}
                                                                    onChange={(e) => updatePaymentMethod(method.id, { is_discount_active: e.target.checked })}
                                                                    className="h-4 w-4 rounded border-slate-300 text-primary"
                                                                />
                                                                <span className="text-[9px] font-black uppercase italic text-slate-400">Activo</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase italic text-primary">Instrucciones de Pago (Lo que verá el cliente)</Label>
                                                <Textarea
                                                    value={method.instructions}
                                                    onChange={(e) => updatePaymentMethod(method.id, { instructions: e.target.value })}
                                                    placeholder="Ej: Envía a: correo@ejemplo.com, Beneficiario: ..."
                                                    className="min-h-[120px] bg-slate-50 border-none dark:bg-slate-900 font-mono text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pago Móvil - Legacy Support/Quick Info */}
                <Card className="border-2 opacity-50">
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

                {/* Contact Information */}
                <Card className="border-2 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 uppercase italic font-black tracking-tighter">
                            Información de Contacto
                        </CardTitle>
                        <CardDescription>Estos datos se utilizarán para que los clientes te contacten.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase flex items-center gap-2">
                                <Smartphone className="h-3 w-3" /> WhatsApp
                            </Label>
                            <Input
                                placeholder="+58 412 000 0000"
                                value={settings.whatsapp_number}
                                onChange={(e) => handleUpdateField('whatsapp_number', e.target.value)}
                                className="bg-white dark:bg-slate-900 border-none h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase flex items-center gap-2 font-mono">
                                @ Instagram
                            </Label>
                            <Input
                                placeholder="tu_usuario"
                                value={settings.instagram_handle}
                                onChange={(e) => handleUpdateField('instagram_handle', e.target.value)}
                                className="bg-white dark:bg-slate-900 border-none h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase flex items-center gap-2">
                                Telegram
                            </Label>
                            <Input
                                placeholder="usuario_telegram"
                                value={settings.telegram_username}
                                onChange={(e) => handleUpdateField('telegram_username', e.target.value)}
                                className="bg-white dark:bg-slate-900 border-none h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase flex items-center gap-2">
                                Facebook (URL)
                            </Label>
                            <Input
                                placeholder="https://facebook.com/tu_pagina"
                                value={settings.facebook_url}
                                onChange={(e) => handleUpdateField('facebook_url', e.target.value)}
                                className="bg-white dark:bg-slate-900 border-none h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase flex items-center gap-2">
                                Email de Contacto
                            </Label>
                            <Input
                                placeholder="contacto@milys.shop"
                                value={settings.contact_email}
                                onChange={(e) => handleUpdateField('contact_email', e.target.value)}
                                className="bg-white dark:bg-slate-900 border-none h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase flex items-center gap-2 font-mono">
                                TikTok
                            </Label>
                            <Input
                                placeholder="@tu_tiktok"
                                value={settings.tiktok_handle}
                                onChange={(e) => handleUpdateField('tiktok_handle', e.target.value)}
                                className="bg-white dark:bg-slate-900 border-none h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase flex items-center gap-2">
                                Pinterest
                            </Label>
                            <Input
                                placeholder="usuario_pinterest"
                                value={settings.pinterest_handle}
                                onChange={(e) => handleUpdateField('pinterest_handle', e.target.value)}
                                className="bg-white dark:bg-slate-900 border-none h-11"
                            />
                        </div>
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
