'use client';

import { useState, useEffect } from 'react';
import {
    DollarSign,
    CreditCard,
    RotateCcw,
    TrendingUp,
    Users,
    History,
    Search,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    BadgeDollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function FinancesPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchFinances();
    }, []);

    const fetchFinances = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/finances');
            const result = await res.json();
            if (res.ok) {
                setData(result);
            } else {
                toast.error(result.error || 'Error al cargar finanzas');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const { stats, topCustomersByCredit, recentMovements } = data || {};

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                        Gestión <span className="text-primary">Financiera</span>
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium italic">Control de ingresos, devoluciones y saldos a favor.</p>
                </div>
                <Button
                    className="rounded-2xl font-bold uppercase text-xs tracking-widest h-12 shadow-lg shadow-primary/20"
                    onClick={fetchFinances}
                >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Actualizar Datos
                </Button>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                        <DollarSign size={80} />
                    </div>
                    <CardContent className="p-6">
                        <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Facturación Total</p>
                        <h3 className="text-3xl font-black mt-2">
                            ${(stats?.totalRevenue || 0).toLocaleString()}
                        </h3>
                        <div className="flex items-center gap-2 mt-4 text-xs font-bold bg-white/20 w-fit px-2 py-1 rounded-lg">
                            <ArrowUpRight size={14} />
                            <span>Ingresos Brutos</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 relative overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Crédito Pendiente</p>
                            <Wallet className="text-primary" size={20} />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                            ${(stats?.totalCreditLiability || 0).toLocaleString()}
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-2 font-medium">Deuda en saldos a favor para clientes.</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 relative overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Devoluciones</p>
                            <RotateCcw className="text-rose-500" size={20} />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                            ${(stats?.totalReturnsAmount || 0).toLocaleString()}
                        </h3>
                        <p className="text-[10px] text-rose-500 mt-2 font-bold">{stats?.returnsCount || 0} productos devueltos.</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-primary/20 rounded-full blur-2xl" />
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Retención Rate</p>
                            <TrendingUp className="text-primary" size={20} />
                        </div>
                        <h3 className="text-3xl font-black mb-2 italic">
                            94.2%
                        </h3>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: '94.2%' }} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Customers with Credit */}
                <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <CardHeader className="border-b border-slate-50 dark:border-slate-800 px-8 py-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
                                    <Users className="text-primary" size={24} />
                                    Cartera de Clientes (Saldos)
                                </CardTitle>
                                <CardDescription className="font-medium">Clientes con saldo a favor activo en su cuenta.</CardDescription>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <Input
                                    placeholder="Buscar por cliente..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-11 w-full md:w-64 rounded-xl border-2"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
                                    <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest h-14">Cliente</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Email</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest h-14 text-right">Saldo a Favor</TableHead>
                                    <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest h-14 text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topCustomersByCredit?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground font-medium italic">
                                            No hay clientes con saldo pendiente.
                                        </TableCell>
                                    </TableRow>
                                ) : topCustomersByCredit?.filter((c: any) =>
                                    (c.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
                                ).map((customer: any) => (
                                    <TableRow key={customer.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <TableCell className="px-8 font-black italic tracking-tight">{customer.full_name || 'Sin Nombre'}</TableCell>
                                        <TableCell className="text-slate-500 font-medium text-xs">{customer.email}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-black px-3 py-1 text-sm border-none shadow-sm h-8 rounded-lg">
                                                ${Number(customer.store_credit).toLocaleString()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-8 text-right">
                                            <Button variant="outline" size="sm" className="rounded-xl border-2 font-black uppercase text-[10px] tracking-widest h-9" asChild>
                                                <a href={`/admin/customers?search=${customer.email}`}>Ver CRM</a>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Audit Trail / History */}
                <Card className="border-none shadow-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
                    <CardHeader>
                        <CardTitle className="text-lg font-black uppercase italic tracking-tight flex items-center gap-2">
                            <History className="text-primary" size={20} />
                            Auditoría de Fondos
                        </CardTitle>
                        <CardDescription className="text-xs">Últimos movimientos de crédito.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {recentMovements?.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground italic text-xs font-medium">
                                No hay movimientos registrados.
                            </div>
                        ) : recentMovements?.map((move: any) => (
                            <div key={move.id} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group hover:border-primary/20 transition-all">
                                <div className={cn(
                                    "mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                    Number(move.amount) > 0 ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                                )}>
                                    {Number(move.amount) > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                </div>
                                <div className="flex-1 space-y-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <p className="font-black text-[11px] uppercase tracking-tight truncate pr-2">
                                            {move.profiles?.full_name || move.profiles?.email || 'Sistema'}
                                        </p>
                                        <span className={cn(
                                            "font-black text-xs",
                                            Number(move.amount) > 0 ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            {Number(move.amount) > 0 ? '+' : ''}{Number(move.amount).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-medium italic line-clamp-2">
                                        {move.reason || 'Sin descripción'}
                                    </p>
                                    <div className="flex justify-between items-center pt-1">
                                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-1.5 h-4 border-slate-200">
                                            {move.type === 'return' ? 'Devolución' : move.type === 'purchase' ? 'Gasto' : 'Ajuste'}
                                        </Badge>
                                        <span className="text-[8px] font-bold text-slate-400 capitalize">
                                            {new Date(move.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
