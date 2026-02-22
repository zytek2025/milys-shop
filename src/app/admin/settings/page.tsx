'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, Loader2, Landmark, Smartphone, MessageSquareQuote, Type, Palette, Plus, Trash2, Globe, CreditCard, DollarSign, Wallet, Bitcoin, Zap, Info, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

interface StoreSettings {
    personalization_price_small: number;
    personalization_price_large: number;
    design_price_small: number;
    design_price_medium: number;
    design_price_large: number;
    crm_webhook_url: string;
    canva_api_key?: string;
    whatsapp_number?: string;
    instagram_handle?: string;
    telegram_username?: string;
    facebook_url?: string;
    contact_email?: string;
    tiktok_handle?: string;
    pinterest_handle?: string;
    payment_methods?: any[];
    store_country?: string;
    currency_symbol?: string;
    exchange_rate?: number;
    bcv_last_sync_at?: string;
}


export default function AdminSettingsPage() {
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [settings, setSettings] = useState<StoreSettings>({
        personalization_price_small: 1.00,
        personalization_price_large: 3.00,
        design_price_small: 2.00,
        design_price_medium: 5.00,
        design_price_large: 10.00,
        crm_webhook_url: '',
        canva_api_key: '',
        whatsapp_number: '',
        instagram_handle: '',
        telegram_username: '',
        facebook_url: '',
        contact_email: '',
        tiktok_handle: '',
        pinterest_handle: '',
        payment_methods: [],
        store_country: 'VE',
        currency_symbol: '$',
        exchange_rate: 60.0
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
                    crm_webhook_url: data.crm_webhook_url || '',
                    canva_api_key: data.canva_api_key || '',
                    whatsapp_number: data.whatsapp_number || '',
                    instagram_handle: data.instagram_handle || '',
                    telegram_username: data.telegram_username || '',
                    facebook_url: data.facebook_url || '',
                    contact_email: data.contact_email || '',
                    tiktok_handle: data.tiktok_handle || '',
                    pinterest_handle: data.pinterest_handle || '',
                    payment_methods: data.payment_methods || [],
                    store_country: data.store_country || 'VE',
                    currency_symbol: data.currency_symbol || '$',
                    exchange_rate: Number(data.exchange_rate ?? 60.0),
                    bcv_last_sync_at: data.bcv_last_sync_at || undefined
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

    const handleCountryChange = (countryCode: string) => {
        let newSymbol = '$';
        switch (countryCode) {
            case 'VE': newSymbol = 'Bs'; break;
            case 'CO': newSymbol = 'COP'; break;
            case 'CL': newSymbol = 'CLP'; break;
            case 'MX': newSymbol = '$'; break;
            case 'AR': newSymbol = 'ARS'; break;
            case 'PE': newSymbol = 'S/'; break;
            case 'US': newSymbol = '$'; break;
            case 'ES': newSymbol = '€'; break;
            default: newSymbol = '$';
        }
        setSettings(prev => ({ ...prev, store_country: countryCode, currency_symbol: newSymbol }));
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
                queryClient.invalidateQueries({ queryKey: ['store-settings'] });
            } else {
                toast.error(data.error || 'Error al guardar');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBcvSync = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch('/api/admin/settings/bcv/sync', {
                method: 'POST'
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`Tipo de cambio actualizado a Bs ${data.rate}`);
                setSettings(prev => ({
                    ...prev,
                    exchange_rate: data.rate,
                    bcv_last_sync_at: new Date().toISOString()
                }));
            } else {
                toast.error(data.error || 'Error al sincronizar con BCV');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setIsSyncing(false);
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

                {/* Regional & Currency Settings */}
                <Card className="border-2 border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-900/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 uppercase italic font-black tracking-tighter">
                            <Globe className="text-emerald-600 h-5 w-5" /> Región y Moneda
                        </CardTitle>
                        <CardDescription>Configura el país de la tienda, símbolo de moneda y factor de cambio base.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-emerald-700">País Base</Label>
                            <Select value={settings.store_country} onValueChange={handleCountryChange}>
                                <SelectTrigger className="bg-white dark:bg-slate-900 h-11 border-emerald-100">
                                    <SelectValue placeholder="Selecciona un país" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="VE">🇻🇪 Venezuela</SelectItem>
                                    <SelectItem value="CO">🇨🇴 Colombia</SelectItem>
                                    <SelectItem value="CL">🇨🇱 Chile</SelectItem>
                                    <SelectItem value="MX">🇲🇽 México</SelectItem>
                                    <SelectItem value="AR">🇦🇷 Argentina</SelectItem>
                                    <SelectItem value="PE">🇵🇪 Perú</SelectItem>
                                    <SelectItem value="US">🇺🇸 Estados Unidos</SelectItem>
                                    <SelectItem value="ES">🇪🇸 España</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-emerald-700">Símbolo Local</Label>
                            <Input
                                value={settings.currency_symbol}
                                onChange={(e) => handleUpdateField('currency_symbol', e.target.value)}
                                className="bg-white dark:bg-slate-900 h-11 font-black px-4 border-emerald-100"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-emerald-700 font-mono">Factor de Cambio</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={settings.exchange_rate}
                                    onChange={(e) => handleUpdateField('exchange_rate', Number(e.target.value))}
                                    className="bg-white dark:bg-slate-900 h-11 font-mono font-bold border-emerald-100 flex-1"
                                />
                                <Button
                                    onClick={handleBcvSync}
                                    disabled={isSyncing}
                                    variant="outline"
                                    className="h-11 px-4 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 flex-shrink-0"
                                    title="Sincronizar con BCV"
                                >
                                    {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                </Button>
                            </div>
                            {settings.bcv_last_sync_at ? (
                                <p className="text-[10px] text-muted-foreground italic flex items-center justify-between">
                                    <span>* Multiplicador para moneda local.</span>
                                    <span className="text-emerald-600/70">
                                        Última sync: {new Intl.DateTimeFormat('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(settings.bcv_last_sync_at))}
                                    </span>
                                </p>
                            ) : (
                                <p className="text-[10px] text-muted-foreground italic">
                                    * Multiplicador para moneda local.
                                </p>
                            )}
                        </div>
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

                {/* Canva Integration */}
                <Card className="border-2 border-[#7D2AE8]/20 bg-[#7D2AE8]/5 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#7D2AE8] to-[#00C4CC] h-1.5 w-full" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="text-[#7D2AE8] h-5 w-5" /> Integración con Canva
                        </CardTitle>
                        <CardDescription>Permite diseñar arte para productos directamente desde el panel.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-50">Canva API Key / Client ID</Label>
                            <Input
                                placeholder="Paste your Canva API Key here..."
                                value={settings.canva_api_key}
                                onChange={(e) => handleUpdateField('canva_api_key', e.target.value)}
                                className="font-mono text-sm bg-white dark:bg-slate-900 border-none h-12"
                            />
                            <p className="text-[10px] text-muted-foreground italic">
                                * Necesitas añadir <span className="font-bold underline">milys.shop</span> a tus dominios permitidos en Canva Developers.
                            </p>
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
