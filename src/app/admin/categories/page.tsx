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
    X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import type { Category } from '@/types';

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        has_variants: false,
        is_customizable: true,
        available_sizes: [] as string[],
        available_colors: [] as { name: string; hex: string }[]
    });
    const [newSize, setNewSize] = useState('');
    const [newColorName, setNewColorName] = useState('');
    const [newColorHex, setNewColorHex] = useState('#000000');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/admin/categories');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Err');
            setCategories(data);
        } catch (error) {
            toast.error('Error al cargar categorías');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                has_variants: !!category.has_variants,
                is_customizable: category.is_customizable !== false,
                available_sizes: category.available_sizes || [],
                available_colors: category.available_colors || []
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                description: '',
                has_variants: false,
                is_customizable: true,
                available_sizes: [],
                available_colors: []
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingCategory
                ? `/api/admin/categories/${editingCategory.id}`
                : '/api/admin/categories';
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

            toast.success(editingCategory ? 'Categoría actualizada' : 'Categoría creada');
            fetchCategories();
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro? Se borrará la categoría de forma permanente.')) return;
        try {
            const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            toast.success('Categoría eliminada');
            setCategories(categories.filter(c => c.id !== id));
        } catch (error) {
            toast.error('Error al eliminar categoría');
        }
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
                    <p className="text-muted-foreground">Administra las categorías de productos de la tienda.</p>
                </div>
                <Button
                    className="shrink-0 gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20"
                    onClick={() => handleOpenDialog()}
                >
                    <Plus size={18} />
                    Nueva Categoría
                </Button>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader className="pb-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Buscar categorías..."
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
                                    <TableHead>Variantes</TableHead>
                                    <TableHead>Personalizable</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                                <span>Cargando categorías...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredCategories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                                            No se encontraron categorías.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCategories.map((category) => (
                                        <TableRow key={category.id} className="group border-slate-100 dark:border-slate-800">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Tag size={14} className="text-muted-foreground" />
                                                    {category.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground max-w-xs truncate">
                                                {category.description || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {category.has_variants ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        Sí
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                                        No
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {category.is_customizable !== false ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                                                        Sí
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                                        No
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{category.slug}</TableCell>
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
                        <DialogTitle>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="cat-name">Nombre</Label>
                            <Input
                                id="cat-name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="rounded-xl h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cat-desc">Descripción</Label>
                            <Textarea
                                id="cat-desc"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="rounded-xl min-h-[100px]"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-semibold">Activar Variantes</Label>
                                <p className="text-xs text-muted-foreground">Permite tallas y colores (Ropa/Zapatos).</p>
                            </div>
                            <Switch
                                checked={formData.has_variants}
                                onCheckedChange={checked => setFormData({ ...formData, has_variants: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-semibold">Permitir Personalización</Label>
                                <p className="text-xs text-muted-foreground">Solicitar logos/diseños al cliente.</p>
                            </div>
                            <Switch
                                checked={formData.is_customizable}
                                onCheckedChange={checked => setFormData({ ...formData, is_customizable: checked })}
                            />
                        </div>

                        {formData.has_variants && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top duration-300">
                                <Separator />
                                <div className="space-y-3">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-slate-400">Tallas Globales</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Ej: XL"
                                            value={newSize}
                                            onChange={e => setNewSize(e.target.value.toUpperCase())}
                                            className="h-9 rounded-lg"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => {
                                                if (newSize && !formData.available_sizes.includes(newSize)) {
                                                    setFormData({ ...formData, available_sizes: [...formData.available_sizes, newSize] });
                                                    setNewSize('');
                                                }
                                            }}
                                        >
                                            <Plus size={16} />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.available_sizes.map(size => (
                                            <Badge key={size} variant="secondary" className="gap-1 rounded-lg px-2 py-1">
                                                {size}
                                                <X size={12} className="cursor-pointer" onClick={() => setFormData({ ...formData, available_sizes: formData.available_sizes.filter(s => s !== size) })} />
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-slate-400">Colores Globales</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            placeholder="Nombre: Azul"
                                            value={newColorName}
                                            onChange={e => setNewColorName(e.target.value)}
                                            className="h-9 rounded-lg"
                                        />
                                        <div className="flex gap-2">
                                            <Input
                                                type="color"
                                                value={newColorHex}
                                                onChange={e => setNewColorHex(e.target.value)}
                                                className="h-9 w-12 p-1 rounded-lg"
                                            />
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => {
                                                    if (newColorName) {
                                                        setFormData({
                                                            ...formData,
                                                            available_colors: [...formData.available_colors, { name: newColorName, hex: newColorHex }]
                                                        });
                                                        setNewColorName('');
                                                    }
                                                }}
                                            >
                                                <Plus size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.available_colors.map((color, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 group">
                                                <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: color.hex }} />
                                                <span className="text-xs font-medium">{color.name}</span>
                                                <X size={12} className="cursor-pointer text-slate-400 hover:text-destructive" onClick={() => setFormData({ ...formData, available_colors: formData.available_colors.filter((_, idx) => idx !== i) })} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={saving} className="rounded-xl gap-2 shadow-lg shadow-primary/20">
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
