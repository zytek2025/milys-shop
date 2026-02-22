'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { PrintButton } from '../shared/PrintButton';
import { DollarSign, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FinanceReport() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFinances() {
            try {
                const res = await fetch('/api/admin/reports?type=finances&period=30days');
                if (res.ok) {
                    const result = await res.json();
                    setTransactions(result.transactions || []);
                }
            } catch (error) {
                console.error('Error fetching finance data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchFinances();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse text-xs font-bold uppercase italic">Generando balance financiero...</div>;
    }

    // Process data for charts
    let totalIncome = 0;
    let totalExpense = 0;

    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};

    transactions.forEach(tx => {
        const amount = Number(tx.amount_usd_equivalent || 0);
        const catName = tx.finance_categories?.name || 'Sin Categoría';

        if (tx.type === 'income') {
            totalIncome += amount;
            incomeByCategory[catName] = (incomeByCategory[catName] || 0) + amount;
        } else if (tx.type === 'expense') {
            totalExpense += amount;
            expenseByCategory[catName] = (expenseByCategory[catName] || 0) + amount;
        }
    });

    const incomeData = Object.keys(incomeByCategory).map(name => ({
        name,
        value: incomeByCategory[name]
    })).filter(d => d.value > 0);

    const expenseData = Object.keys(expenseByCategory).map(name => ({
        name,
        value: expenseByCategory[name]
    })).filter(d => d.value > 0);

    const COLORS_INCOME = ['#10b981', '#34d399', '#059669', '#6ee7b7'];
    const COLORS_EXPENSE = ['#f43f5e', '#fb7185', '#e11d48', '#fda4af'];

    const formatCurrency = (val: number) => new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div className="space-y-8">
            <header className="report-header">
                <h1 className="text-2xl font-black uppercase italic tracking-tighter">Mily's Premium Shop</h1>
                <p className="text-sm font-bold uppercase italic opacity-70">Resultados Financieros — Generado el {new Date().toLocaleDateString()}</p>
            </header>

            <div className="flex justify-end no-print">
                <PrintButton label="Imprimir Reporte Financiero" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
                <Card className="bg-white/50 dark:bg-slate-900/50 border-border/50 shadow-sm border-2">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase italic tracking-tighter flex items-center gap-2">
                            <ArrowUpCircle className="h-4 w-4 text-emerald-500" /> Desglose de Ingresos
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase italic">Distribución de ingresos por categoría.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center p-0 pt-4">
                        {incomeData.length === 0 ? (
                            <p className="text-muted-foreground text-[10px] font-bold uppercase italic text-center">No hay ingresos registrados.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={incomeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {incomeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS_INCOME[index % COLORS_INCOME.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value: number) => [formatCurrency(value), '']} />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", fontStyle: "italic" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                    <CardFooter className="border-t border-border/50 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center py-4">
                        <span className="text-[10px] font-black uppercase italic">Total Ingresos:</span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(totalIncome)}</span>
                    </CardFooter>
                </Card>

                <Card className="bg-white/50 dark:bg-slate-900/50 border-border/50 shadow-sm border-2">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase italic tracking-tighter flex items-center gap-2">
                            <ArrowDownCircle className="h-4 w-4 text-rose-500" /> Desglose de Gastos
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase italic">Mayores centros de egresos.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center p-0 pt-4">
                        {expenseData.length === 0 ? (
                            <p className="text-muted-foreground text-[10px] font-bold uppercase italic text-center">No hay egresos registrados.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={expenseData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {expenseData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS_EXPENSE[index % COLORS_EXPENSE.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value: number) => [formatCurrency(value), '']} />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", fontStyle: "italic" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                    <CardFooter className="border-t border-border/50 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center py-4">
                        <span className="text-[10px] font-black uppercase italic">Total Gastos:</span>
                        <span className="text-lg font-black text-rose-600 dark:text-rose-400">{formatCurrency(totalExpense)}</span>
                    </CardFooter>
                </Card>
            </div>

            {/* Detailed Transaction List for Print */}
            <Card className="border-2 shadow-sm print:border-none print:shadow-none">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b print:bg-white no-print">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-black uppercase italic tracking-tighter flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-primary" /> Historial de Transacciones
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100 dark:bg-slate-800/50 text-[9px] font-black uppercase italic tracking-widest text-muted-foreground border-b print:bg-slate-50">
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3">Categoría</th>
                                    <th className="px-4 py-3">Referencia / Nota</th>
                                    <th className="px-4 py-3 text-right">Monto (USD)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[10px] font-bold italic">
                                {transactions.map((tx, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 uppercase">{tx.finance_categories?.name || '-'}</td>
                                        <td className="px-4 py-3 truncate max-w-[250px] font-normal italic opacity-80">{tx.description || '-'}</td>
                                        <td className={cn("px-4 py-3 text-right font-black", tx.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount_usd_equivalent)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
