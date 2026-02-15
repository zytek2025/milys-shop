'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Save, Loader2, Landmark, Smartphone, MessageSquareQuote, Plus, Trash2, Percent, Wallet, CreditCard, Zap, Bitcoin, DollarSign, CheckCircle2, Circle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface PaymentMethod {
    id: string;
    name: string;
    instructions: string;
    icon: string;
    discount_percentage: number;
    is_discount_active: boolean;
}

interface StoreSettings {
    payment_methods: PaymentMethod[];
    crm_webhook_url: string;
    canva_api_key: string;
}

const AVAILABLE_ICONS = [
    { id: 'Smartphone', icon: Smartphone, label: 'Pago Móvil' },
    { id: 'Landmark', icon: Landmark, label: 'Banco' },
    { id: 'Wallet', icon: Wallet, label: 'Billetera' },
    { id: 'Bitcoin', icon: Bitcoin, label: 'Binance / Crypto' },
    { id: 'Zap', icon: Zap, label: 'Apollo / Rápido' },
    { id: 'CreditCard', icon: CreditCard, label: 'Tarjeta' },
    { id: 'DollarSign', icon: DollarSign, label: 'Efectivo / Divisas' }
];

export default function AdminSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<StoreSettings>({
        payment_methods: [],
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
                    payment_methods: Array.isArray(data.payment_methods) ? data.payment_methods : [],
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

    const handleAddPaymentMethod = () => {
        const newMethod: PaymentMethod = {
            id: `pay-${Date.now()}`,
            name: 'Nuevo Método',
            instructions: '',
            icon: 'Landmark',
            discount_percentage: 0,
            is_discount_active: false
        };
        handleUpdateField('payment_methods', [...settings.payment_methods, newMethod]);
    };

    const handleRemovePaymentMethod = (id: string) => {
        handleUpdateField('payment_methods', settings.payment_methods.filter(m => m.id !== id));
    };

    const handleUpdatePaymentMethod = (id: string, updates: Partial<PaymentMethod>) => {
        const updated = settings.payment_methods.map(m =>
            m.id === id ? { ...m, ...updates } : m
        );
        handleUpdateField('payment_methods', updated);
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
        <div className="space-y-6 max-w-5xl mx-auto p-4">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter">Ajustes de la Tienda</h1>
                    <p className="text-muted-foreground">Gestiona métodos de pago, descuentos e integraciones.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-14 rounded-2xl px-8 text-lg font-black italic uppercase shadow-xl shadow-primary/20 gap-3"
                >
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                    Guardar Cambios
                </Button>
            </div>

            <div className="grid gap-6">
                {/* Payment Methods Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                            <CreditCard className="text-primary" /> Métodos de Pago y Descuentos
                        </h2>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddPaymentMethod}
                            className="rounded-xl border-2 border-primary/20 hover:bg-primary/5 font-bold italic uppercase text-xs"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Añadir Método
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {settings.payment_methods.map((method) => {
                            const IconComponent = AVAILABLE_ICONS.find(i => i.id === method.icon)?.icon || Landmark;

                            return (
                                <Card key={method.id} className="border-2 shadow-sm relative group overflow-hidden bg-white dark:bg-slate-950">
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                            {/* Left side: Icon and Basic Info */}
                                            <div className="md:col-span-4 space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground italic">Nombre del Método</Label>
                                                    <Input
                                                        value={method.name}
                                                        onChange={(e) => handleUpdatePaymentMethod(method.id, { name: e.target.value })}
                                                        placeholder="Ej: Binance Pay"
                                                        className="font-bold rounded-xl border-2"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground italic">Icono Visual</Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {AVAILABLE_ICONS.map((iconItem) => (
                                                            <button
                                                                key={iconItem.id}
                                                                onClick={() => handleUpdatePaymentMethod(method.id, { icon: iconItem.id })}
                                                                className={cn(
                                                                    "p-2.5 rounded-xl border-2 transition-all",
                                                                    method.icon === iconItem.id
                                                                        ? "border-primary bg-primary/10 text-primary"
                                                                        : "border-slate-100 hover:border-slate-300 text-slate-400"
                                                                )}
                                                                title={iconItem.label}
                                                            >
                                                                <iconItem.icon size={18} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Center: Instructions */}
                                            <div className="md:col-span-5 space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-muted-foreground italic">Instrucciones / Datos de Pago</Label>
                                                <Textarea
                                                    value={method.instructions}
                                                    onChange={(e) => handleUpdatePaymentMethod(method.id, { instructions: e.target.value })}
                                                    placeholder="Ej: Binance ID: 1234567, Red: BSC..."
                                                    className="min-h-[140px] font-mono text-xs rounded-xl border-2 bg-slate-50/50 dark:bg-slate-900/50"
                                                />
                                            </div>

                                            {/* Right side: Discount and Status */}
                                            <div className="md:col-span-3 space-y-4 flex flex-col justify-between">
                                                <div className="space-y-4">
                                                    <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-emerald-100 dark:border-emerald-900/30 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-[10px] font-black uppercase text-emerald-600 flex items-center gap-1 italic">
                                                                <Percent size={12} /> Descuento Especial
                                                            </Label>
                                                            <Switch
                                                                checked={method.is_discount_active}
                                                                onCheckedChange={(checked) => handleUpdatePaymentMethod(method.id, { is_discount_active: checked })}
                                                            />
                                                        </div>
                                                        <div className="relative">
                                                            <Input
                                                                type="number"
                                                                value={method.discount_percentage}
                                                                onChange={(e) => handleUpdatePaymentMethod(method.id, { discount_percentage: Number(e.target.value) })}
                                                                className="pl-8 font-black rounded-xl border-2 text-emerald-600"
                                                                placeholder="5"
                                                            />
                                                            <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-400 uppercase italic">% de ahorro</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    onClick={() => handleRemovePaymentMethod(method.id)}
                                                    className="w-full text-destructive hover:bg-destructive/10 rounded-xl font-bold uppercase italic text-xs h-10"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar Método
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {settings.payment_methods.length === 0 && (
                            <div className="p-12 border-2 border-dashed rounded-3xl text-center space-y-4 bg-slate-50/30">
                                <CreditCard size={48} className="mx-auto text-slate-200" />
                                <div className="space-y-1">
                                    <p className="font-bold text-slate-500 uppercase italic tracking-tighter">No hay métodos de pago configurados</p>
                                    <p className="text-xs text-slate-400">Añade uno para que tus clientes puedan completar sus compras.</p>
                                </div>
                                <Button onClick={handleAddPaymentMethod} className="rounded-2xl">Crear Primer Método</Button>
                            </div>
                        )}
                    </div>
                </div>

                <Separator />

                {/* CRM Webhook */}
                <Card className="border-2 shadow-sm bg-slate-50/50 dark:bg-slate-900/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 italic uppercase tracking-tighter text-lg font-black">
                            <MessageSquareQuote className="text-primary h-5 w-5" /> Integración CRM (n8n)
                        </CardTitle>
                        <CardDescription className="text-xs font-bold uppercase opacity-60 italic">URL del Webhook para notificar pedidos pagados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Input
                            placeholder="https://n8n.tuempresa.com/webhook/..."
                            value={settings.crm_webhook_url}
                            onChange={(e) => handleUpdateField('crm_webhook_url', e.target.value)}
                            className="font-mono text-sm bg-white dark:bg-slate-950 border-2 h-12 rounded-xl"
                        />
                    </CardContent>
                </Card>

                {/* Canva Integration */}
                <Card className="border-2 shadow-sm bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 italic uppercase tracking-tighter text-lg font-black text-blue-600 dark:text-blue-400">
                            <Plus className="h-5 w-5" /> Integración Canva Pro
                        </CardTitle>
                        <CardDescription className="text-xs font-bold uppercase opacity-60 italic">
                            Configura tu Canva API Key para diseñar artes directamente desde la tienda.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase italic">API Key de Canva</Label>
                            <Input
                                type="password"
                                placeholder="Pega aquí tu API Key de Canva..."
                                value={settings.canva_api_key}
                                onChange={(e) => handleUpdateField('canva_api_key', e.target.value)}
                                className="font-mono text-sm bg-white dark:bg-slate-950 border-2 h-12 rounded-xl"
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground italic flex items-center gap-2">
                            <CheckCircle2 size={12} className="text-blue-500" />
                            Solo disponible para administradores en la sección de Biblioteca de Diseños.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
