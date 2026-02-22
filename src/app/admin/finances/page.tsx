'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Loader2, TrendingDown, TrendingUp, Trash2, PlusCircle, AlertCircle,
    Wallet, Landmark, Bitcoin, ArrowRightLeft, DollarSign,
    PieChart as PieChartIcon, BarChart2, History, Settings2, Plus,
    X, Check, Banknote, CreditCard as CardIcon
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

export default function FinancesDashboard() {
    const settings = useStoreSettings();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter states
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');

    // Form States
    const [newAccount, setNewAccount] = useState({ name: '', type: 'bank', currency: 'USD', balance: '' });
    const [newTx, setNewTx] = useState({ account_id: '', category_id: '', amount: '', description: '', transaction_date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [accRes, catRes, txRes] = await Promise.all([
                fetch('/api/admin/finances/accounts'),
                fetch('/api/admin/finances/categories'),
                fetch('/api/admin/finances/transactions?limit=100')
            ]);

            const [accData, catData, txData] = await Promise.all([
                accRes.json(),
                catRes.json(),
                txRes.json()
            ]);

            setAccounts(accData);
            setCategories(catData);
            setTransactions(txData);
        } catch (error) {
            toast.error('Error al cargar datos financieros');
        } finally {
            setLoading(false);
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
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
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

    // Derived Data for Charts
    const getChartData = () => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        return last7Days.map(date => {
            const dayTxs = transactions.filter(t => t.transaction_date.startsWith(date));
            const income = dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount_usd_equivalent), 0);
            const expense = dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount_usd_equivalent), 0);
            return {
                date: new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
                Ingresos: income,
                Egresos: expense
            };
        });
    };

    const getCategoryData = () => {
        const expenseTxs = transactions.filter(t => t.type === 'expense');
        const grouped = expenseTxs.reduce((acc: any, tx) => {
            const catName = tx.category?.name || 'Otros';
            acc[catName] = (acc[catName] || 0) + Number(tx.amount_usd_equivalent);
            return acc;
        }, {});

        return Object.entries(grouped).map(([name, value]) => ({ name, value }));
    };

    const totalBalanceUSD = accounts.reduce((sum, acc) => {
        if (acc.currency === 'VES') return sum + (acc.balance / settings.exchange_rate);
        return sum + Number(acc.balance);
    }, 0);

    if (loading) {
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
                    {/* Top Cards: Account Quick View */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {accounts.map(account => (
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
                                    <span>Flujo de Caja (USD Equiv)</span>
                                    <TrendingUp className="text-emerald-500 opacity-30" />
                                </CardTitle>
                                <CardDescription>Consolidado de ingresos y egresos de los últimos 7 días.</CardDescription>
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
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} tickFormatter={v => `$${v}`} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                            labelStyle={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '10px' }}
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
                                        <Pie data={getCategoryData()} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                            {getCategoryData().map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
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
                                <CardTitle className="text-xl font-black uppercase italic tracking-tight">Nueva Cuenta</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateAccount} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Nombre</Label>
                                        <Input
                                            required placeholder="Ej. Banesco"
                                            className="rounded-xl"
                                            value={newAccount.name}
                                            onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Tipo</Label>
                                            <Select value={newAccount.type} onValueChange={v => setNewAccount({ ...newAccount, type: v as any })}>
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
                                            <Select value={newAccount.currency} onValueChange={v => setNewAccount({ ...newAccount, currency: v })}>
                                                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="USD">USD ($)</SelectItem>
                                                    <SelectItem value="VES">VES (Bs)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Saldo Inicial</Label>
                                        <Input
                                            type="number" step="0.01"
                                            className="rounded-xl font-bold"
                                            value={newAccount.balance}
                                            onChange={e => setNewAccount({ ...newAccount, balance: e.target.value })}
                                        />
                                    </div>
                                    <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl font-black uppercase italic">
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Guardar Cuenta'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 h-fit">
                            {accounts.map(acc => (
                                <Card key={acc.id} className="border-none shadow-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
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
                                            <div className="text-right">
                                                <p className="text-lg font-black">{acc.currency} {acc.balance.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
