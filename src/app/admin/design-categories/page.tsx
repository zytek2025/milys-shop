'use client';

import { useState, useEffect } from 'react';
import {
    Tag,
    Plus,
    Search,
    Edit2,
    Trash2,
    Loader2,
    Save,
    Tags
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface DesignCategory {
    id: string;
    name: string;
    description: string | null;
    price_small: number;
    price_medium: number;
    price_large: number;
    created_at: string;
}

export default function AdminDesignCategoriesPage() {
    const [categories, setCategories] = useState<DesignCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<DesignCategory | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price_small: '0',
        price_medium: '0',
        price_large: '0'
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/admin/design-categories');
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
            if (!res.ok) toast.error(data.error || 'Error al cargar tipos de logos');
        } catch (error) {
            toast.error('Error al cargar tipos de logos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (category?: DesignCategory) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                price_small: category.price_small?.toString() || '0',
                price_medium: category.price_medium?.toString() || '0',
                price_large: category.price_large?.toString() || '0',
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                description: '',
                price_small: '0',
                price_medium: '0',
                price_large: '0'
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingCategory
                ? `/api/admin/design-categories/${editingCategory.id}`
                : '/api/admin/design-categories';
            const method = editingCategory ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    price_small: parseFloat(formData.price_small),
                    price_medium: parseFloat(formData.price_medium),
                    price_large: parseFloat(formData.price_large),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al guardar');
            }

            toast.success(editingCategory ? 'Tipo de logo actualizado' : 'Tipo de logo creado');
            fetchCategories();
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro? Se borrará este grupo de logos.')) return;
        try {
            const res = await fetch(`/api/admin/design-categories/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            toast.success('Eliminado correctamente');
            setCategories(categories.filter(c => c.id !== id));
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter">Categorías de Logos</h1>
                    <p className="text-muted-foreground">Define los precios por tamaño para cada tipo de diseño.</p>
                </div>
                <Button
                    className="shrink-0 gap-2 rounded-2xl h-12 px-8 shadow-lg shadow-primary/20 font-bold italic uppercase"
                    onClick={() => handleOpenDialog()}
                >
                    <Plus size={18} />
                    Nueva Categoría
                </Button>
            </div>

            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden rounded-[2rem]">
                <CardHeader className="pb-0 pt-8 px-8">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                        <Input
                            placeholder="Buscar categorías de logos..."
                            className="pl-12 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none text-lg font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                    <TableHead className="font-bold text-slate-800 dark:text-slate-200">Categoría</TableHead>
                                    <TableHead className="font-bold text-slate-800 dark:text-slate-200">Pequeño</TableHead>
                                    <TableHead className="font-bold text-slate-800 dark:text-slate-200">Mediano</TableHead>
                                    <TableHead className="font-bold text-slate-800 dark:text-slate-200">Grande</TableHead>
                                    <TableHead className="text-right font-bold text-slate-800 dark:text-slate-200">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                <span className="font-bold italic uppercase tracking-widest text-[10px]">Cargando Datos</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredCategories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center text-muted-foreground font-medium">
                                            No se encontraron categorías de logos.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCategories.map((category) => (
                                        <TableRow key={category.id} className="group border-slate-100 dark:border-slate-800">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                                                        <Tags size={14} className="text-primary" />
                                                        {category.name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground italic line-clamp-1">{category.description || 'Sin descripción'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-black text-lg text-primary">${Number(category.price_small || 0).toFixed(2)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-black text-lg text-primary">${Number(category.price_medium || 0).toFixed(2)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-black text-lg text-primary">${Number(category.price_large || 0).toFixed(2)}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-xl h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all"
                                                        onClick={() => handleOpenDialog(category)}
                                                    >
                                                        <Edit2 size={18} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-xl h-10 w-10 hover:bg-destructive/10 hover:text-destructive transition-all"
                                                        onClick={() => handleDelete(category.id)}
                                                    >
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8 border-none shadow-2xl bg-white dark:bg-slate-950">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">
                            {editingCategory ? 'Editar Categoría' : 'Nueva Categoría de Logos'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="cat-name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre de la Categoría</Label>
                            <Input
                                id="cat-name"
                                placeholder="Ej: Premium, Estándar, Bordados..."
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-900 border-none text-lg font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cat-desc" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Descripción</Label>
                            <Textarea
                                id="cat-desc"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Detalles sobre este tipo de logos..."
                                className="rounded-2xl min-h-[80px] bg-slate-50 dark:bg-slate-900 border-none font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <div className="space-y-2">
                                <Label htmlFor="price_s" className="text-[10px] font-black uppercase tracking-wider text-center block">Pequeño ($)</Label>
                                <Input
                                    id="price_s"
                                    type="number"
                                    step="0.01"
                                    value={formData.price_small}
                                    onChange={e => setFormData({ ...formData, price_small: e.target.value })}
                                    className="h-12 text-center rounded-xl bg-white dark:bg-slate-950 border-2 border-primary/20 font-black text-lg focus:border-primary transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price_m" className="text-[10px] font-black uppercase tracking-wider text-center block">Mediano ($)</Label>
                                <Input
                                    id="price_m"
                                    type="number"
                                    step="0.01"
                                    value={formData.price_medium}
                                    onChange={e => setFormData({ ...formData, price_medium: e.target.value })}
                                    className="h-12 text-center rounded-xl bg-white dark:bg-slate-950 border-2 border-primary/20 font-black text-lg focus:border-primary transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price_l" className="text-[10px] font-black uppercase tracking-wider text-center block">Grande ($)</Label>
                                <Input
                                    id="price_l"
                                    type="number"
                                    step="0.01"
                                    value={formData.price_large}
                                    onChange={e => setFormData({ ...formData, price_large: e.target.value })}
                                    className="h-12 text-center rounded-xl bg-white dark:bg-slate-950 border-2 border-primary/20 font-black text-lg focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-6">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-2xl h-14 px-8 font-bold text-muted-foreground hover:bg-slate-100">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={saving} className="rounded-2xl h-14 px-10 gap-3 shadow-xl shadow-primary/30 font-black italic uppercase tracking-tighter">
                                {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                {editingCategory ? 'Actualizar' : 'Crear Categoría'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
