'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Loader2, TrendingDown, TrendingUp, Trash2, PlusCircle, AlertCircle,
    Wallet, Landmark, Bitcoin, ArrowRightLeft, DollarSign,
    PieChart as PieChartIcon, BarChart2, History, Settings2, Plus,
    X, Check, Banknote, CreditCard as CardIcon,
    Smartphone, Globe, CreditCard, Zap, Info, Save, Calendar, Filter
} from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useStoreSettings } from '@/components/store-settings-provider';
import { useQueryClient } from '@tanstack/react-query';

// Types
interface Account {
    id: string;
    name: string;
    type: 'bank' | 'cash' | 'crypto' | 'wallet';
    currency: string;
    balance: number;
    is_active: boolean;
}

interface Category {
    id: string;
    name: string;
    type: 'income' | 'expense';
    icon: string;
}

interface Transaction {
    id: string;
    account_id: string;
    category_id: string;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    currency: string;
    exchange_rate: number;
    amount_usd_equivalent: number;
    description: string;
    transaction_date: string;
    account?: { name: string; currency: string };
    category?: { name: string; type: string };
}

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

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

export default function FinancesDashboard() {
    const settings = useStoreSettings();
    const queryClient = useQueryClient();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter states
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');

    // Dashboard filters
    const [currencyFilter, setCurrencyFilter] = useState<'all' | 'USD' | 'VES'>('all');
    const [timePeriod, setTimePeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');

    // Form States
    const [newAccount, setNewAccount] = useState({ name: '', type: 'bank', currency: 'USD', balance: '' });
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

    const [newTx, setNewTx] = useState({ account_id: '', category_id: '', amount: '', description: '', transaction_date: '' });

    // Category management
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [newCategory, setNewCategory] = useState({ name: '', type: 'income', icon: '' });

    // Payment methods state
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [isSavingMethods, setIsSavingMethods] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        setNewTx(prev => ({ ...prev, transaction_date: new Date().toISOString().split('T')[0] }));
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [accRes, catRes, txRes] = await Promise.all([
                fetch('/api/admin/finances/accounts'),
                fetch('/api/admin/finances/categories'),
                fetch('/api/admin/finances/transactions?limit=500')
            ]);

            const [accData, catData, txData] = await Promise.all([
                accRes.ok ? accRes.json() : [],
                catRes.ok ? catRes.json() : [],
                txRes.ok ? txRes.json() : []
            ]);

            setAccounts(Array.isArray(accData) ? accData : []);
            setCategories(Array.isArray(catData) ? catData : []);
            setTransactions(Array.isArray(txData) ? txData : []);
        } catch (error) {
            toast.error('Error al cargar datos financieros');
            setAccounts([]);
            setCategories([]);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch payment methods from settings
    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    const fetchPaymentMethods = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (res.ok) {
                setPaymentMethods(data.payment_methods || []);
            }
        } catch (error) {
            console.error('Error fetching payment methods:', error);
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
        setPaymentMethods(prev => [...prev, newMethod]);
    };

    const removePaymentMethod = (id: string) => {
        setPaymentMethods(prev => prev.filter(m => m.id !== id));
    };

    const updatePaymentMethod = (id: string, updates: Partial<PaymentMethod>) => {
        setPaymentMethods(prev => prev.map(m =>
            m.id === id ? { ...m, ...updates } : m
        ));
    };

    const savePaymentMethods = async () => {
        setIsSavingMethods(true);
        try {
            // First fetch current settings to avoid overwriting other fields
            const getRes = await fetch('/api/admin/settings');
            const currentSettings = await getRes.json();

            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...currentSettings, payment_methods: paymentMethods })
            });
            if (res.ok) {
                toast.success('Métodos de pago guardados');
                queryClient.invalidateQueries({ queryKey: ['store-settings'] });
            } else {
                const data = await res.json();
                toast.error(data.error || 'Error al guardar');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setIsSavingMethods(false);
        }
    };

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/finances/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAccount)
            });
            if (!res.ok) throw new Error('Error al crear cuenta');
            toast.success('Cuenta creada correctamente');
            setNewAccount({ name: '', type: 'bank', currency: 'USD', balance: '' });
            setIsAccountModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAccount) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/finances/accounts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingAccount)
            });
            if (!res.ok) throw new Error('Error al actualizar cuenta');
            toast.success('Cuenta actualizada correctamente');
            setEditingAccount(null);
            setIsAccountModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAccount = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta cuenta?')) return;
        try {
            const res = await fetch(`/api/admin/finances/accounts?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al eliminar cuenta');
            toast.success('Cuenta eliminada');
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/finances/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCategory)
            });
            if (!res.ok) throw new Error('Error al crear categoría');
            toast.success('Categoría creada');
            setNewCategory({ name: '', type: 'income', icon: '' });
            setIsCategoryModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/finances/categories', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingCategory)
            });
            if (!res.ok) throw new Error('Error al actualizar categoría');
            toast.success('Categoría actualizada');
            setEditingCategory(null);
            setIsCategoryModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) return;
        try {
            const res = await fetch(`/api/admin/finances/categories?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al eliminar categoría');
            toast.success('Categoría eliminada');
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleCreateTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/finances/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newTx, type: transactionType })
            });
            if (!res.ok) throw new Error('Error al registrar movimiento');
            toast.success('Movimiento registrado correctamente');
            setIsTransactionModalOpen(false);
            setNewTx({ account_id: '', category_id: '', amount: '', description: '', transaction_date: new Date().toISOString().split('T')[0] });
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // === FILTERED DATA HELPERS ===
    const getDateRange = () => {
        const now = new Date();
        const start = new Date();
        switch (timePeriod) {
            case 'day': start.setHours(0, 0, 0, 0); break;
            case 'week': start.setDate(now.getDate() - 7); break;
            case 'month': start.setMonth(now.getMonth() - 1); break;
            case 'year': start.setFullYear(now.getFullYear() - 1); break;
        }
        return { start, end: now };
    };

    const filteredTransactions = (() => {
        const { start } = getDateRange();
        return transactions.filter(t => {
            const txDate = new Date(t.transaction_date);
            const inDateRange = txDate >= start;
            const inCurrency = currencyFilter === 'all' || t.currency === currencyFilter;
            return inDateRange && inCurrency;
        });
    })();

    const filteredAccounts = currencyFilter === 'all'
        ? accounts
        : accounts.filter(a => a.currency === currencyFilter);

    // Derived Data for Charts
    const getChartData = () => {
        const { start } = getDateRange();
        let daysCount: number;
        let dateFormat: Intl.DateTimeFormatOptions;

        switch (timePeriod) {
            case 'day': daysCount = 1; dateFormat = { hour: '2-digit' }; break;
            case 'week': daysCount = 7; dateFormat = { day: 'numeric', month: 'short' }; break;
            case 'month': daysCount = 30; dateFormat = { day: 'numeric', month: 'short' }; break;
            case 'year': daysCount = 12; dateFormat = { month: 'short', year: '2-digit' }; break;
            default: daysCount = 7; dateFormat = { day: 'numeric', month: 'short' };
        }

        if (timePeriod === 'year') {
            // Group by month for yearly view
            const months = Array.from({ length: 12 }, (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - (11 - i));
                return d;
            });

            return months.map(month => {
                const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
                const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
                const monthTxs = filteredTransactions.filter(t => {
                    const d = new Date(t.transaction_date);
                    return d >= monthStart && d <= monthEnd;
                });
                const income = monthTxs.filter(t => t.type === 'income').reduce((sum, t) =>
                    sum + (currencyFilter === 'VES' ? Number(t.amount) : Number(t.amount_usd_equivalent)), 0);
                const expense = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) =>
                    sum + (currencyFilter === 'VES' ? Number(t.amount) : Number(t.amount_usd_equivalent)), 0);
                return {
                    date: month.toLocaleDateString('es-VE', dateFormat),
                    Ingresos: income,
                    Egresos: expense
                };
            });
        }

        if (timePeriod === 'day') {
            // Group by hour for daily view
            const hours = Array.from({ length: 24 }, (_, i) => i);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            return hours.map(hour => {
                const hourTxs = filteredTransactions.filter(t => {
                    const d = new Date(t.transaction_date);
                    return d >= today && d.getHours() === hour;
                });
                const income = hourTxs.filter(t => t.type === 'income').reduce((sum, t) =>
                    sum + (currencyFilter === 'VES' ? Number(t.amount) : Number(t.amount_usd_equivalent)), 0);
                const expense = hourTxs.filter(t => t.type === 'expense').reduce((sum, t) =>
                    sum + (currencyFilter === 'VES' ? Number(t.amount) : Number(t.amount_usd_equivalent)), 0);
                return {
                    date: `${hour}:00`,
                    Ingresos: income,
                    Egresos: expense
                };
            });
        }

        // Week/Month: group by day
        const days = Array.from({ length: daysCount }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (daysCount - 1 - i));
            return d;
        });

        return days.map(day => {
            const dayStr = day.toISOString().split('T')[0];
            const dayTxs = filteredTransactions.filter(t => t.transaction_date.startsWith(dayStr));
            const income = dayTxs.filter(t => t.type === 'income').reduce((sum, t) =>
                sum + (currencyFilter === 'VES' ? Number(t.amount) : Number(t.amount_usd_equivalent)), 0);
            const expense = dayTxs.filter(t => t.type === 'expense').reduce((sum, t) =>
                sum + (currencyFilter === 'VES' ? Number(t.amount) : Number(t.amount_usd_equivalent)), 0);
            return {
                date: day.toLocaleDateString('es-VE', dateFormat),
                Ingresos: income,
                Egresos: expense
            };
        });
    };

    const getCategoryData = () => {
        const expenseTxs = filteredTransactions.filter(t => t.type === 'expense');
        const grouped = expenseTxs.reduce((acc: any, tx) => {
            const catName = tx.category?.name || 'Otros';
            acc[catName] = (acc[catName] || 0) + (currencyFilter === 'VES' ? Number(tx.amount) : Number(tx.amount_usd_equivalent));
            return acc;
        }, {});

        return Object.entries(grouped).map(([name, value]) => ({ name, value }));
    };

    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) =>
        sum + (currencyFilter === 'VES' ? Number(t.amount) : Number(t.amount_usd_equivalent)), 0);
    const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) =>
        sum + (currencyFilter === 'VES' ? Number(t.amount) : Number(t.amount_usd_equivalent)), 0);
    const netBalance = totalIncome - totalExpense;

    const currencyPrefix = currencyFilter === 'VES' ? 'Bs ' : '$';

    const totalBalanceUSD = accounts.reduce((sum, acc) => {
        if (acc.currency === 'VES') return sum + (acc.balance / (settings.exchange_rate || 60));
        return sum + Number(acc.balance);
    }, 0);

    if (!isMounted || loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border shadow-sm">
                <div>
                    <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white flex items-center gap-2">
                        Dashboard <span className="text-primary">Financiero</span>
                        <BarChart2 className="h-8 w-8 text-primary opacity-20" />
                    </h1>
                    <p className="text-muted-foreground font-medium italic">Control ERP de ingresos, egresos y flujo de caja.</p>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Patrimonio Total Estimado</span>
                    <div className="text-3xl font-black text-emerald-600 tracking-tight">
                        ${totalBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <TabsList className="bg-white dark:bg-slate-900 border p-1 h-12 rounded-2xl">
                        <TabsTrigger value="dashboard" className="rounded-xl h-10 px-6 font-bold uppercase italic text-[10px] tracking-widest gap-2">
                            <BarChart2 size={14} /> Resumen
                        </TabsTrigger>
                        <TabsTrigger value="ledger" className="rounded-xl h-10 px-6 font-bold uppercase italic text-[10px] tracking-widest gap-2">
                            <History size={14} /> Libro Mayor
                        </TabsTrigger>
                        <TabsTrigger value="accounts" className="rounded-xl h-10 px-6 font-bold uppercase italic text-[10px] tracking-widest gap-2">
                            <Landmark size={14} /> Cuentas
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="rounded-xl h-10 px-6 font-bold uppercase italic text-[10px] tracking-widest gap-2">
                            <Settings2 size={14} /> Ajustes
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex gap-2">
                        <Dialog open={isTransactionModalOpen} onOpenChange={setIsTransactionModalOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    size="sm"
                                    className="rounded-xl font-bold uppercase italic text-[10px] tracking-widest h-10 px-4 bg-emerald-500 hover:bg-emerald-600 gap-2"
                                    onClick={() => setTransactionType('income')}
                                >
                                    <Plus size={14} /> Ingreso
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-3xl max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                                        Registrar <span className={transactionType === 'income' ? "text-emerald-500" : "text-red-500"}>
                                            {transactionType === 'income' ? 'Ingreso' : 'Egreso'}
                                        </span>
                                    </DialogTitle>
                                    <DialogDescription>Completa los detalles del movimiento manual.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreateTransaction} className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Cuenta</Label>
                                            <Select value={newTx.account_id} onValueChange={v => setNewTx({ ...newTx, account_id: v })}>
                                                <SelectTrigger className="rounded-xl h-12 text-xs">
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    {accounts.map(acc => (
                                                        <SelectItem key={acc.id} value={acc.id} className="text-xs">{acc.name} ({acc.currency})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Categoría</Label>
                                            <Select value={newTx.category_id} onValueChange={v => setNewTx({ ...newTx, category_id: v })}>
                                                <SelectTrigger className="rounded-xl h-12 text-xs">
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    {categories.filter(c => c.type === transactionType).map(cat => (
                                                        <SelectItem key={cat.id} value={cat.id} className="text-xs">{cat.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Monto</Label>
                                        <Input
                                            type="number" step="0.01" required placeholder="0.00"
                                            className="rounded-xl h-12 text-lg font-bold"
                                            value={newTx.amount}
                                            onChange={e => setNewTx({ ...newTx, amount: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Descripción</Label>
                                        <Input
                                            required placeholder="Ej. Pago de publicidad, Venta directa..."
                                            className="rounded-xl h-12 text-xs"
                                            value={newTx.description}
                                            onChange={e => setNewTx({ ...newTx, description: e.target.value })}
                                        />
                                    </div>
                                    <DialogFooter className="pt-4">
                                        <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-12 font-black uppercase tracking-widest italic">
                                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirmar Registro'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Button
                            size="sm"
                            variant="destructive"
                            className="rounded-xl font-bold uppercase italic text-[10px] tracking-widest h-10 px-4 gap-2"
                            onClick={() => {
                                setTransactionType('expense');
                                setIsTransactionModalOpen(true);
                            }}
                        >
                            <Plus size={14} /> Egreso
                        </Button>
                    </div>
                </div>

                <TabsContent value="dashboard" className="space-y-6">
                    {/* Currency Toggle + Time Period Filters */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-2xl border p-1">
                            {[
                                { value: 'all' as const, label: 'Consolidado', icon: '📊' },
                                { value: 'USD' as const, label: 'USD ($)', icon: '💵' },
                                { value: 'VES' as const, label: 'Bs', icon: '🇻🇪' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setCurrencyFilter(opt.value)}
                                    className={cn(
                                        "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase italic tracking-widest transition-all flex items-center gap-2",
                                        currencyFilter === opt.value
                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                            : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    )}
                                >
                                    <span>{opt.icon}</span> {opt.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-2xl border p-1">
                            {[
                                { value: 'day' as const, label: 'Hoy' },
                                { value: 'week' as const, label: 'Semana' },
                                { value: 'month' as const, label: 'Mes' },
                                { value: 'year' as const, label: 'Año' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setTimePeriod(opt.value)}
                                    className={cn(
                                        "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase italic tracking-widest transition-all",
                                        timePeriod === opt.value
                                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg"
                                            : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* KPI Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-3xl overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Ingresos</p>
                                        <p className="text-3xl font-black tracking-tight mt-1">
                                            {currencyPrefix}{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-white/20 rounded-2xl">
                                        <TrendingUp size={24} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-lg bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-3xl overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Egresos</p>
                                        <p className="text-3xl font-black tracking-tight mt-1">
                                            {currencyPrefix}{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-white/20 rounded-2xl">
                                        <TrendingDown size={24} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className={cn(
                            "border-none shadow-lg text-white rounded-3xl overflow-hidden",
                            netBalance >= 0
                                ? "bg-gradient-to-br from-blue-500 to-blue-600"
                                : "bg-gradient-to-br from-amber-500 to-amber-600"
                        )}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Balance Neto</p>
                                        <p className="text-3xl font-black tracking-tight mt-1">
                                            {netBalance >= 0 ? '+' : ''}{currencyPrefix}{netBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-white/20 rounded-2xl">
                                        <Banknote size={24} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Account Quick View */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {filteredAccounts.map(account => (
                            <Card key={account.id} className="relative overflow-hidden group border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={cn(
                                            "p-3 rounded-2xl shadow-sm",
                                            account.currency === 'VES' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                                        )}>
                                            {account.type === 'bank' && <Landmark size={20} />}
                                            {account.type === 'cash' && <Wallet size={20} />}
                                            {account.type === 'crypto' && <Bitcoin size={20} />}
                                            {account.type === 'wallet' && <CardIcon size={20} />}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter mb-1">{account.name}</p>
                                            <div className="flex flex-col">
                                                <span className="text-xl font-black text-slate-900 dark:text-white">
                                                    {account.currency} {account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                                {account.currency === 'VES' && (
                                                    <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                                                        ≈ ${(account.balance / settings.exchange_rate).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 pointer-events-none" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 shadow-xl border-none bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-xl font-black uppercase italic tracking-tight flex items-center justify-between">
                                    <span>Flujo de Caja {currencyFilter === 'VES' ? '(Bs)' : currencyFilter === 'USD' ? '(USD)' : '(Consolidado USD)'}</span>
                                    <TrendingUp className="text-emerald-500 opacity-30" />
                                </CardTitle>
                                <CardDescription>
                                    {timePeriod === 'day' ? 'Desglose por hora del día de hoy' :
                                        timePeriod === 'week' ? 'Últimos 7 días' :
                                            timePeriod === 'month' ? 'Últimos 30 días' : 'Últimos 12 meses'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px] p-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={getChartData()}>
                                        <defs>
                                            <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} tickFormatter={v => `${currencyPrefix}${v}`} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                            labelStyle={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '10px' }}
                                            formatter={(value: any) => [`${currencyPrefix}${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, undefined]}
                                        />
                                        <Area type="monotone" dataKey="Ingresos" stroke="#10b981" fillOpacity={1} fill="url(#colorIngresos)" strokeWidth={3} />
                                        <Area type="monotone" dataKey="Egresos" stroke="#ef4444" fillOpacity={1} fill="url(#colorEgresos)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="shadow-xl border-none bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
                                    <PieChartIcon className="text-red-500" />
                                    Gastos por Categoría
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[350px] p-6 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={getCategoryData()} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" cornerRadius={8}>
                                            {getCategoryData().map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none' }}
                                            formatter={(value: any) => [`${currencyPrefix}${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, undefined]}
                                        />
                                        <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '10px', fontWeight: 800 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="ledger" className="space-y-6">
                    <Card className="shadow-xl border-none bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black uppercase italic tracking-tight">Libro Mayor</CardTitle>
                                <CardDescription>Historial detallado de transacciones.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Fecha</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Cuenta</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Descripción</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {transactions.map(tx => (
                                            <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                                    {new Date(tx.transaction_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-xs font-black uppercase">{tx.account?.name}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold">{tx.description}</span>
                                                        <span className="text-[10px] font-black uppercase text-primary opacity-60">{tx.category?.name}</span>
                                                    </div>
                                                </td>
                                                <td className={cn(
                                                    "px-6 py-4 text-right font-black",
                                                    tx.type === 'income' ? "text-emerald-500" : "text-red-500"
                                                )}>
                                                    {tx.type === 'income' ? '+' : '-'}{tx.currency} {Number(tx.amount).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="accounts" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-1 shadow-xl border-none bg-white dark:bg-slate-900 rounded-3xl h-fit">
                            <CardHeader>
                                <CardTitle className="text-xl font-black uppercase italic tracking-tight">Gestión de Cuenta</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={editingAccount ? handleUpdateAccount : handleCreateAccount} className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Nombre</Label>
                                            {editingAccount && (
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    className="h-auto p-0 text-[10px] font-black uppercase text-red-500"
                                                    onClick={() => setEditingAccount(null)}
                                                >
                                                    Cancelar Edición
                                                </Button>
                                            )}
                                        </div>
                                        <Input
                                            required placeholder="Ej. Banesco"
                                            className="rounded-xl"
                                            value={editingAccount ? editingAccount.name : newAccount.name}
                                            onChange={e => editingAccount
                                                ? setEditingAccount({ ...editingAccount, name: e.target.value })
                                                : setNewAccount({ ...newAccount, name: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Tipo</Label>
                                            <Select
                                                value={editingAccount ? editingAccount.type : newAccount.type}
                                                onValueChange={v => editingAccount
                                                    ? setEditingAccount({ ...editingAccount, type: v as any })
                                                    : setNewAccount({ ...newAccount, type: v as any })
                                                }
                                            >
                                                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="bank">Banco</SelectItem>
                                                    <SelectItem value="cash">Efectivo</SelectItem>
                                                    <SelectItem value="crypto">Cripto</SelectItem>
                                                    <SelectItem value="wallet">Billetera</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Moneda</Label>
                                            <Select
                                                value={editingAccount ? editingAccount.currency : newAccount.currency}
                                                onValueChange={v => editingAccount
                                                    ? setEditingAccount({ ...editingAccount, currency: v })
                                                    : setNewAccount({ ...newAccount, currency: v })
                                                }
                                            >
                                                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="USD">USD ($)</SelectItem>
                                                    <SelectItem value="VES">VES (Bs)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                                            {editingAccount ? 'Ajustar Saldo' : 'Saldo Inicial'}
                                        </Label>
                                        <Input
                                            type="number" step="0.01"
                                            className="rounded-xl font-bold"
                                            value={editingAccount ? editingAccount.balance : newAccount.balance}
                                            onChange={e => editingAccount
                                                ? setEditingAccount({ ...editingAccount, balance: Number(e.target.value) })
                                                : setNewAccount({ ...newAccount, balance: e.target.value })
                                            }
                                        />
                                    </div>
                                    <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl font-black uppercase italic">
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : (editingAccount ? 'Actualizar Cuenta' : 'Guardar Cuenta')}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 h-fit">
                            {accounts.map(acc => (
                                <Card key={acc.id} className="border-none shadow-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden group">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800">
                                                    {acc.type === 'bank' && <Landmark className="text-primary" />}
                                                    {acc.type === 'cash' && <Wallet className="text-emerald-500" />}
                                                    {acc.type === 'crypto' && <Bitcoin className="text-amber-500" />}
                                                    {acc.type === 'wallet' && <CardIcon className="text-blue-500" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black tracking-tight">{acc.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{acc.currency}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <p className="text-lg font-black">{acc.currency} {acc.balance.toLocaleString()}</p>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10"
                                                        onClick={() => {
                                                            setEditingAccount(acc);
                                                        }}
                                                    >
                                                        <Settings2 size={14} />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50/50"
                                                        onClick={() => handleDeleteAccount(acc.id)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                    {/* Payment Methods Section */}
                    <Card className="shadow-xl border-2 border-primary/20 bg-white dark:bg-slate-900 rounded-3xl">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
                                    <CreditCard className="text-primary h-5 w-5" /> Métodos de Pago
                                </CardTitle>
                                <CardDescription>Configura las formas de pago que verán tus clientes.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={addPaymentMethod}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full border-primary text-primary hover:bg-primary/10 gap-2 font-bold uppercase italic text-[10px]"
                                >
                                    <Plus size={14} /> Añadir Método
                                </Button>
                                <Button
                                    onClick={savePaymentMethods}
                                    disabled={isSavingMethods}
                                    size="sm"
                                    className="rounded-full gap-2 font-bold uppercase italic text-[10px] bg-emerald-500 hover:bg-emerald-600"
                                >
                                    {isSavingMethods ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {paymentMethods.length === 0 ? (
                                <div className="text-center py-10 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                    <Info className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                    <p className="text-xs font-bold uppercase italic text-muted-foreground">No hay métodos de pago configurados</p>
                                    <Button variant="link" onClick={addPaymentMethod} className="text-primary text-xs font-black uppercase">¡Crea el primero!</Button>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {paymentMethods.map((method) => (
                                        <div key={method.id} className="relative group p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary/30 transition-all">
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
                                                                className="h-11 bg-white border-none dark:bg-slate-900 font-bold"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-black uppercase italic text-primary">Cuenta Destino (Libro Mayor)</Label>
                                                            <Select
                                                                value={method.account_id}
                                                                onValueChange={(val) => updatePaymentMethod(method.id, { account_id: val })}
                                                            >
                                                                <SelectTrigger className="h-11 bg-white border-none dark:bg-slate-900 font-bold">
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
                                                        className="min-h-[120px] bg-white border-none dark:bg-slate-900 font-mono text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Category Creation/Edit */}
                        <Card className="shadow-xl border-none bg-white dark:bg-slate-900 rounded-3xl h-fit">
                            <CardHeader>
                                <CardTitle className="text-xl font-black uppercase italic tracking-tight">Gestión de Categorías</CardTitle>
                                <CardDescription>Crea o modifica categorías de ingresos y egresos.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Nombre</Label>
                                        <Input
                                            required placeholder="Ej. Ventas, Alquiler, Publicidad..."
                                            className="rounded-xl"
                                            value={editingCategory ? editingCategory.name : newCategory.name}
                                            onChange={e => editingCategory
                                                ? setEditingCategory({ ...editingCategory, name: e.target.value })
                                                : setNewCategory({ ...newCategory, name: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Tipo</Label>
                                            <Select
                                                value={editingCategory ? editingCategory.type : newCategory.type}
                                                onValueChange={v => editingCategory
                                                    ? setEditingCategory({ ...editingCategory, type: v as any })
                                                    : setNewCategory({ ...newCategory, type: v as any })
                                                }
                                            >
                                                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="income">Ingreso</SelectItem>
                                                    <SelectItem value="expense">Egreso</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Emoji / Icono</Label>
                                            <Input
                                                placeholder="Ej. 💰, 🛒, 🏢"
                                                className="rounded-xl text-center text-xl"
                                                value={editingCategory ? (editingCategory.icon || '') : newCategory.icon}
                                                onChange={e => editingCategory
                                                    ? setEditingCategory({ ...editingCategory, icon: e.target.value })
                                                    : setNewCategory({ ...newCategory, icon: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-2 flex gap-2">
                                        <Button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl font-black uppercase italic">
                                            {isSubmitting ? <Loader2 className="animate-spin" /> : (editingCategory ? 'Actualizar' : 'Crear Categoría')}
                                        </Button>
                                        {editingCategory && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="rounded-xl font-black uppercase italic"
                                                onClick={() => setEditingCategory(null)}
                                            >
                                                Cancelar
                                            </Button>
                                        )}
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Category List */}
                        <Card className="shadow-xl border-none bg-white dark:bg-slate-900 rounded-3xl">
                            <CardHeader>
                                <CardTitle className="text-xl font-black uppercase italic tracking-tight">Categorías Existentes</CardTitle>
                            </CardHeader>
                            <CardContent className="max-h-[500px] overflow-y-auto pl-2 pr-4 custom-scrollbar">
                                <div className="space-y-2">
                                    {categories.map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 group">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{cat.icon || '📁'}</span>
                                                <div>
                                                    <p className="text-sm font-black tracking-tight">{cat.name}</p>
                                                    <p className={cn(
                                                        "text-[10px] font-black uppercase tracking-widest",
                                                        cat.type === 'income' ? "text-emerald-500" : "text-red-500"
                                                    )}>
                                                        {cat.type === 'income' ? 'Ingreso' : 'Egreso'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10"
                                                    onClick={() => setEditingCategory(cat)}
                                                >
                                                    <Settings2 size={14} />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50/50"
                                                    onClick={() => handleDeleteCategory(cat.id)}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
