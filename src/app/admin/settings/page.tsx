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
    payment_methods?: PaymentMethod[];
    store_country?: string;
    currency_symbol?: string;
    exchange_rate?: number;
    bcv_last_sync_at?: string;
}

interface PaymentMethod {
    id: string;
    name: string;
    instructions: string;
    icon: string;
    discount_percentage: number;
    is_discount_active: boolean;
    account_id?: string;
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
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);
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
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/admin/finances/accounts');
            const data = await res.json();
            if (res.ok) setAccounts(data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

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
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black uppercase italic text-primary">Nombre del Método</Label>
                                                        <Input
                                                            value={method.name}
                                                            onChange={(e) => updatePaymentMethod(method.id, { name: e.target.value })}
                                                            placeholder="Ej: Binance (USDT), Pago Móvil..."
                                                            className="h-11 bg-slate-50 border-none dark:bg-slate-900 font-bold"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black uppercase italic text-primary">Cuenta Destino (Libro Mayor)</Label>
                                                        <Select
                                                            value={method.account_id}
                                                            onValueChange={(val) => updatePaymentMethod(method.id, { account_id: val })}
                                                        >
                                                            <SelectTrigger className="h-11 bg-slate-50 border-none dark:bg-slate-900 font-bold">
                                                                <SelectValue placeholder="Seleccionar Cuenta" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {accounts.map(acc => (
                                                                    <SelectItem key={acc.id} value={acc.id}>
                                                                        {acc.name} ({acc.currency})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
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
