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
import { ScrollArea } from '@/components/ui/scroll-area';
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
        available_colors: [] as { name: string; hex: string }[],
        design_price_small: 0,
        design_price_medium: 0,
        design_price_large: 0,
        text_price_small: 0,
        text_price_large: 0
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
                available_colors: category.available_colors || [],
                design_price_small: category.design_price_small || 0,
                design_price_medium: category.design_price_medium || 0,
                design_price_large: category.design_price_large || 0,
                text_price_small: category.text_price_small || 0,
                text_price_large: category.text_price_large || 0
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                description: '',
                has_variants: false,
                is_customizable: true,
                available_sizes: [],
                available_colors: [],
                design_price_small: 0,
                design_price_medium: 0,
                design_price_large: 0,
                text_price_small: 0,
                text_price_large: 0
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
                                    <TableHead className="w-[80px]">ID</TableHead>
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
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl max-h-[95vh] flex flex-col">
                    <form onSubmit={handleSubmit} className="flex flex-col max-h-[95vh]">
                        <DialogHeader className="px-8 pt-8 pb-4 shrink-0">
                            <DialogTitle className="text-2xl font-bold tracking-tight">
                                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground">
                                Configura los detalles y precios de personalización.
                            </p>
                        </DialogHeader>

                        <ScrollArea className="flex-1 px-8 min-h-0">
                            <div className="space-y-6 pb-8">
                                <div className="space-y-2">
                                    <Label htmlFor="cat-name" className="text-xs font-bold uppercase tracking-widest text-slate-400">Nombre</Label>
                                    <Input
                                        id="cat-name"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="rounded-2xl h-12 bg-slate-50 dark:bg-slate-900 border-none px-4"
                                        placeholder="Ej: Camisetas, Tazas..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cat-desc" className="text-xs font-bold uppercase tracking-widest text-slate-400">Descripción</Label>
                                    <Textarea
                                        id="cat-desc"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="rounded-2xl min-h-[100px] bg-slate-50 dark:bg-slate-900 border-none px-4"
                                        placeholder="Breve descripción de la categoría..."
                                    />
                                </div>

                                <div className="flex items-center justify-between p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-bold">Activar Variantes</Label>
                                        <p className="text-[10px] text-muted-foreground italic">Permite tallas y colores (Ropa/Zapatos).</p>
                                    </div>
                                    <Switch
                                        checked={formData.has_variants}
                                        onCheckedChange={checked => setFormData({ ...formData, has_variants: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-bold">Permitir Personalización</Label>
                                        <p className="text-[10px] text-muted-foreground italic">Solicitar logos/diseños al cliente.</p>
                                    </div>
                                    <Switch
                                        checked={formData.is_customizable}
                                        onCheckedChange={checked => setFormData({ ...formData, is_customizable: checked })}
                                    />
                                </div>

                                {formData.is_customizable && (
                                    <div className="space-y-4 p-5 rounded-[2rem] bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 animate-in fade-in slide-in-from-top duration-300">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                                            🎨 Precios de Personalización
                                        </Label>
                                        <p className="text-[9px] text-indigo-700/60 dark:text-indigo-500/50 italic leading-tight">
                                            Define precios por categoría. Deja en $0 para usar precios globales.
                                        </p>

                                        <div className="space-y-4 pt-2">
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Logo S</Label>
                                                    <Input
                                                        type="number"
                                                        value={formData.design_price_small}
                                                        onChange={e => setFormData({ ...formData, design_price_small: Number(e.target.value) })}
                                                        className="h-10 rounded-xl bg-white dark:bg-slate-950 border-none shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Logo M</Label>
                                                    <Input
                                                        type="number"
                                                        value={formData.design_price_medium}
                                                        onChange={e => setFormData({ ...formData, design_price_medium: Number(e.target.value) })}
                                                        className="h-10 rounded-xl bg-white dark:bg-slate-950 border-none shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Logo L</Label>
                                                    <Input
                                                        type="number"
                                                        value={formData.design_price_large}
                                                        onChange={e => setFormData({ ...formData, design_price_large: Number(e.target.value) })}
                                                        className="h-10 rounded-xl bg-white dark:bg-slate-950 border-none shadow-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Texto S</Label>
                                                    <Input
                                                        type="number"
                                                        value={formData.text_price_small}
                                                        onChange={e => setFormData({ ...formData, text_price_small: Number(e.target.value) })}
                                                        className="h-10 rounded-xl bg-white dark:bg-slate-950 border-none shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Texto L</Label>
                                                    <Input
                                                        type="number"
                                                        value={formData.text_price_large}
                                                        onChange={e => setFormData({ ...formData, text_price_large: Number(e.target.value) })}
                                                        className="h-10 rounded-xl bg-white dark:bg-slate-950 border-none shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {formData.has_variants && (
                                    <div className="space-y-4 p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top duration-300">
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">Tallas</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Ej: XL"
                                                    value={newSize}
                                                    onChange={e => setNewSize(e.target.value.toUpperCase())}
                                                    className="h-10 rounded-xl bg-white dark:bg-slate-950 border-none shadow-sm px-4"
                                                />
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    className="rounded-xl h-10 w-10 shrink-0"
                                                    onClick={() => {
                                                        if (newSize && !formData.available_sizes.includes(newSize)) {
                                                            setFormData({ ...formData, available_sizes: [...formData.available_sizes, newSize] });
                                                            setNewSize('');
                                                        }
                                                    }}
                                                >
                                                    <Plus size={18} />
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {formData.available_sizes.map(size => (
                                                    <Badge key={size} variant="secondary" className="gap-1 rounded-lg px-3 py-1 bg-white dark:bg-slate-800 border-none shadow-sm">
                                                        {size}
                                                        <X size={12} className="cursor-pointer text-slate-400 hover:text-destructive" onClick={() => setFormData({ ...formData, available_sizes: formData.available_sizes.filter(s => s !== size) })} />
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <Separator className="bg-slate-200 dark:bg-slate-800" />

                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">Colores</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input
                                                    placeholder="Ej: Azul"
                                                    value={newColorName}
                                                    onChange={e => setNewColorName(e.target.value)}
                                                    className="h-10 rounded-xl bg-white dark:bg-slate-950 border-none shadow-sm px-4"
                                                />
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="color"
                                                        value={newColorHex}
                                                        onChange={e => setNewColorHex(e.target.value)}
                                                        className="h-10 w-12 p-1.5 rounded-xl bg-white dark:bg-slate-950 border-none shadow-sm cursor-pointer"
                                                    />
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        className="rounded-xl h-10 w-10 shrink-0"
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
                                                        <Plus size={18} />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {formData.available_colors.map((color, i) => (
                                                    <div key={i} className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg px-3 py-1 shadow-sm group">
                                                        <div className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: color.hex }} />
                                                        <span className="text-xs font-medium">{color.name}</span>
                                                        <X size={12} className="cursor-pointer text-slate-400 hover:text-destructive" onClick={() => setFormData({ ...formData, available_colors: formData.available_colors.filter((_, idx) => idx !== i) })} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        <DialogFooter className="px-8 py-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 sm:justify-end gap-3 rounded-b-[2rem]">
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
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
