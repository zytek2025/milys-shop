'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

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
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando reporte financiero...</div>;
    }

    // Process data for charts
    let totalIncome = 0;
    let totalExpense = 0;

    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};

    transactions.forEach(tx => {
        const amount = Number(tx.amount_usd_equivalent || 0);
        // Supabase returns related table as an object if joined
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
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white/50 dark:bg-slate-900/50 border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle>Desglose de Ingresos</CardTitle>
                        <CardDescription>Distribución de ingresos registrados.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] flex items-center justify-center p-0 pt-4">
                        {incomeData.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No hay ingresos en este periodo.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
                                    <Pie
                                        data={incomeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {incomeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS_INCOME[index % COLORS_INCOME.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value: number) => [formatCurrency(value), '']} />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "12px" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                    <CardFooter className="border-t border-border/50 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center py-4">
                        <span className="text-sm font-semibold">Total Ingresos:</span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(totalIncome)}</span>
                    </CardFooter>
                </Card>

                <Card className="bg-white/50 dark:bg-slate-900/50 border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle>Desglose de Gastos</CardTitle>
                        <CardDescription>Categorías de mayores egresos.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] flex items-center justify-center p-0 pt-4">
                        {expenseData.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No hay gastos en este periodo.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
                                    <Pie
                                        data={expenseData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {expenseData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS_EXPENSE[index % COLORS_EXPENSE.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value: number) => [formatCurrency(value), '']} />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "12px" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                    <CardFooter className="border-t border-border/50 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center py-4">
                        <span className="text-sm font-semibold">Total Gastos:</span>
                        <span className="text-lg font-black text-rose-600 dark:text-rose-400">{formatCurrency(totalExpense)}</span>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
