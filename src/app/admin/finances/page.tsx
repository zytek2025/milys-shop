'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, TrendingDown, Trash2, PlusCircle, AlertCircle } from 'lucide-react';

interface Expense {
    id: string;
    amount: number;
    description: string;
    category: string;
    expense_date: string;
    profiles?: { full_name: string; email: string };
}

export default function FinancesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Operativo');

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/finances/expenses');
            if (!res.ok) throw new Error('Error al cargar egresos');
            const data = await res.json();
            setExpenses(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !description || !category) return;

        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/admin/finances/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, description, category })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al registrar egreso');
            }

            setAmount('');
            setDescription('');
            await fetchExpenses();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro de eliminar este registro?')) return;

        try {
            const res = await fetch(`/api/admin/finances/expenses/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Error eliminando gasto');
            await fetchExpenses();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const totalEgresos = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

    return (
        <div className="space-y-8 pb-8">
            <div>
                <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                    Finanzas <span className="text-red-500">Tienda</span>
                </h1>
                <p className="text-muted-foreground mt-1 font-medium italic">Control estricto de egresos y costos operativos.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario de Registro */}
                <Card className="shadow-xl bg-white dark:bg-slate-900 h-fit">
                    <CardHeader>
                        <CardTitle className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
                            <PlusCircle className="text-primary" />
                            Registrar Egreso
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateExpense} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Monto ($)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0.1"
                                    required
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="Ej. 150.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Descripción</Label>
                                <Input
                                    required
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Ej. Cajas de envío, Publicidad"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Categoría</Label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="Operativo">Operativo</option>
                                    <option value="Inventario">Inventario</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Logística">Logística</option>
                                    <option value="Servicios">Servicios (Suscripciones, Hosting)</option>
                                </select>
                            </div>

                            <Button type="submit" disabled={submitting} className="w-full font-bold uppercase tracking-widest rounded-xl">
                                {submitting ? <Loader2 className="animate-spin mr-2" /> : 'Registrar'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Lista de Egresos */}
                <Card className="lg:col-span-2 shadow-xl bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                        <div>
                            <CardTitle className="text-xl font-black uppercase italic tracking-tight">Historial de Salidas</CardTitle>
                            <CardDescription>
                                Total egresado: <span className="font-bold text-red-500">${totalEgresos.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </CardDescription>
                        </div>
                        <TrendingDown className="text-red-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-muted-foreground" />
                            </div>
                        ) : expenses.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground italic">
                                No hay egresos registrados.
                            </div>
                        ) : (
                            <div className="divide-y max-h-[500px] overflow-y-auto">
                                {expenses.map(expense => (
                                    <div key={expense.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div>
                                            <div className="font-bold">{expense.description}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                                <span className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">{expense.category}</span>
                                                <span>•</span>
                                                {new Date(expense.expense_date).toLocaleDateString()}
                                                <span>•</span>
                                                {expense.profiles?.full_name || expense.profiles?.email?.split('@')[0] || 'Admin'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-black text-red-500">-${Number(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500 hover:bg-red-50" onClick={() => handleDelete(expense.id)}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
