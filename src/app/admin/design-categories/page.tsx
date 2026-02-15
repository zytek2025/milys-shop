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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface DesignCategory {
    id: string;
    name: string;
    description: string | null;
    price: number;
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
        price: '0',
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
                price: category.price?.toString() || '0',
                price_small: category.price_small?.toString() || '0',
                price_medium: category.price_medium?.toString() || '0',
                price_large: category.price_large?.toString() || '0'
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                description: '',
                price: '0',
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
                    price: parseFloat(formData.price),
                    price_small: parseFloat(formData.price_small),
                    price_medium: parseFloat(formData.price_medium),
                    price_large: parseFloat(formData.price_large)
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
                    <h1 className="text-2xl font-bold tracking-tight">Tipos de Logos</h1>
                    <p className="text-muted-foreground">Clasifica tus diseños por temas o estilos.</p>
                </div>
                <Button
                    className="shrink-0 gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20"
                    onClick={() => handleOpenDialog()}
                >
                    <Plus size={18} />
                    Nuevo Tipo
                </Button>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader className="pb-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Buscar tipos..."
                            className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Base</TableHead>
                                    <TableHead>S / M / L</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                                <span>Cargando datos...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredCategories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                            No se encontraron categorías.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCategories.map((category) => (
                                        <TableRow key={category.id} className="group border-slate-100 dark:border-slate-800">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Tags size={14} className="text-primary" />
                                                    {category.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                ${category.price || '0.00'}
                                            </TableCell>
                                            <TableCell className="font-mono text-[10px] text-muted-foreground">
                                                ${category.price_small} / ${category.price_medium} / ${category.price_large}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground max-w-xs truncate text-xs">
                                                {category.description || '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-lg h-8 w-8"
                                                        onClick={() => handleOpenDialog(category)}
                                                    >
                                                        <Edit2 size={16} className="text-slate-600" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-lg h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={() => handleDelete(category.id)}
                                                    >
                                                        <Trash2 size={16} />
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
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl max-h-[95vh] flex flex-col">
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                        <DialogHeader className="px-8 pt-8 pb-4 shrink-0">
                            <DialogTitle className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3">
                                <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                                    <Tags size={24} />
                                </div>
                                {editingCategory ? 'Editar Tipo' : 'Nuevo Tipo'}
                            </DialogTitle>
                        </DialogHeader>

                        <ScrollArea className="flex-1 px-8 min-h-0">
                            <div className="space-y-6 py-4 pb-8">
                                <div className="space-y-2">
                                    <Label htmlFor="cat-name">Nombre del Grupo</Label>
                                    <Input
                                        id="cat-name"
                                        placeholder="Ej: Superhéroes, Logos Minimalistas..."
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="rounded-xl h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cat-desc">Descripción (Opcional)</Label>
                                    <Textarea
                                        id="cat-desc"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="rounded-xl min-h-[60px]"
                                    />
                                </div>

                                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                        Tarifas de Personalización (USD)
                                    </h3>

                                    <div className="space-y-2">
                                        <Label>Precio Base (Instalación/Arte)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            className="rounded-xl h-11"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase font-bold text-blue-500">Peq. (S)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={formData.price_small}
                                                onChange={e => setFormData({ ...formData, price_small: e.target.value })}
                                                className="rounded-xl h-10 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase font-bold text-purple-500">Med. (M)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={formData.price_medium}
                                                onChange={e => setFormData({ ...formData, price_medium: e.target.value })}
                                                className="rounded-xl h-10 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase font-bold text-orange-500">Grd. (L)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={formData.price_large}
                                                onChange={e => setFormData({ ...formData, price_large: e.target.value })}
                                                className="rounded-xl h-10 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </ScrollArea>

                        <DialogFooter className="px-8 py-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 sm:justify-end gap-3 rounded-b-[2rem] shrink-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsDialogOpen(false)}
                                className="rounded-2xl h-12 px-6 font-semibold"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="rounded-2xl h-12 px-8 font-bold gap-2 shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-primary/90 hover:scale-[1.02] transition-transform"
                            >
                                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save size={20} />}
                                {editingCategory ? 'Guardar Cambios' : 'Crear Grupo'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
