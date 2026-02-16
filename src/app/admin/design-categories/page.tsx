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
    created_at: string;
}

export default function AdminDesignCategoriesPage() {
    const [categories, setCategories] = useState<DesignCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<DesignCategory | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
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
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '' });
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
                body: JSON.stringify(formData),
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
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-48 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                                <span>Cargando datos...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredCategories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-48 text-center text-muted-foreground">
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
                                            <TableCell className="text-muted-foreground max-w-xs truncate">
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
                <DialogContent className="sm:max-w-[425px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Editar Tipo' : 'Nuevo Tipo'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
                                className="rounded-xl min-h-[100px]"
                            />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={saving} className="rounded-xl gap-2 shadow-lg shadow-primary/20">
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {editingCategory ? 'Actualizar' : 'Crear Grupo'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
