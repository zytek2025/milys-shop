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
    Layers,
    Box
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
import { Switch } from '@/components/ui/switch';
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

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    has_variants: boolean;
    is_customizable: boolean;
    available_sizes: string[];
    available_colors: { name: string; hex: string }[];
    updated_at: string;
}

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
    const [newColor, setNewColor] = useState({ name: '', hex: '#000000' });
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
                available_sizes: Array.isArray(category.available_sizes) ? category.available_sizes : [],
                available_colors: Array.isArray(category.available_colors) ? category.available_colors : []
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

    const addSize = () => {
        if (!newSize.trim()) return;
        const size = newSize.trim().toUpperCase();
        if (formData.available_sizes.includes(size)) {
            toast.error('Esta talla ya existe');
            return;
        }
        setFormData({
            ...formData,
            available_sizes: [...formData.available_sizes, size]
        });
        setNewSize('');
    };

    const removeSize = (size: string) => {
        setFormData({
            ...formData,
            available_sizes: formData.available_sizes.filter(s => s !== size)
        });
    };

    const addColor = () => {
        if (!newColor.name.trim()) return;
        if (formData.available_colors.some(c => c.name.toLowerCase() === newColor.name.toLowerCase())) {
            toast.error('Este color ya existe');
            return;
        }
        setFormData({
            ...formData,
            available_colors: [...formData.available_colors, { ...newColor }]
        });
        setNewColor({ name: '', hex: '#000000' });
    };

    const removeColor = (colorName: string) => {
        setFormData({
            ...formData,
            available_colors: formData.available_colors.filter(c => c.name !== colorName)
        });
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
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter">Categorías de Productos</h1>
                    <p className="text-muted-foreground">Define las opciones predeterminadas para las prendas y productos.</p>
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
                            placeholder="Buscar categorías de productos..."
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
                                    <TableHead className="font-bold text-slate-800 dark:text-slate-200">Nombre</TableHead>
                                    <TableHead className="font-bold text-slate-800 dark:text-slate-200">Atributos (Matriz)</TableHead>
                                    <TableHead className="font-bold text-center text-slate-800 dark:text-slate-200">Variantes</TableHead>
                                    <TableHead className="font-bold text-center text-slate-800 dark:text-slate-200">Personalizable</TableHead>
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
                                            No se encontraron categorías.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCategories.map((category) => (
                                        <TableRow key={category.id} className="group border-slate-100 dark:border-slate-800">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                                                        <Tag size={14} className="text-primary" />
                                                        {category.name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground italic line-clamp-1">{category.description || 'Sin descripción'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {category.available_sizes?.length > 0 && (
                                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold">
                                                            {category.available_sizes.length} Tallas
                                                        </span>
                                                    )}
                                                    {category.available_colors?.length > 0 && (
                                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold">
                                                            {category.available_colors.length} Colores
                                                        </span>
                                                    )}
                                                    {(!category.available_sizes?.length && !category.available_colors?.length) && (
                                                        <span className="text-[10px] text-muted-foreground">Sin matriz definida</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {category.has_variants ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                                        SÍ
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                        NO
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {category.is_customizable !== false ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
                                                        SÍ
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                        NO
                                                    </span>
                                                )}
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
                <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                    <DialogHeader className="px-8 pt-8 pb-4 bg-white dark:bg-slate-950 sticky top-0 z-10">
                        <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">
                            {editingCategory ? 'Editar Categoría' : 'Nueva Categoría de Productos'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                        <div className="px-8 py-4 space-y-6 overflow-y-auto custom-scrollbar">
                            <div className="space-y-2">
                                <Label htmlFor="cat-name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre</Label>
                                <Input
                                    id="cat-name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Ej: Camisetas, Sudaderas, Cosméticos..."
                                    className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-900 border-none text-lg font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cat-desc" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Descripción</Label>
                                <Textarea
                                    id="cat-desc"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detalles sobre esta categoría..."
                                    className="rounded-2xl min-h-[80px] bg-slate-50 dark:bg-slate-900 border-none font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-black uppercase tracking-tighter">Variantes</Label>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Activar Tallas/Colores</p>
                                    </div>
                                    <Switch
                                        checked={formData.has_variants}
                                        onCheckedChange={checked => setFormData({ ...formData, has_variants: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-black uppercase tracking-tighter">Personalizable</Label>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Permitir Diseños</p>
                                    </div>
                                    <Switch
                                        checked={formData.is_customizable}
                                        onCheckedChange={checked => setFormData({ ...formData, is_customizable: checked })}
                                    />
                                </div>
                            </div>

                            {formData.has_variants && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] space-y-4 border border-slate-100 dark:border-slate-800">
                                        <Label className="text-xs font-black uppercase tracking-widest text-primary ml-1">Matriz de Tallas Predeterminadas</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Ej: S, M, L, XL..."
                                                value={newSize}
                                                onChange={e => setNewSize(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSize())}
                                                className="rounded-xl h-11 bg-white dark:bg-slate-950 border-none font-bold"
                                            />
                                            <Button type="button" onClick={addSize} variant="secondary" className="rounded-xl h-11 px-4 font-bold uppercase italic text-xs">Añadir</Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.available_sizes.map(size => (
                                                <div key={size} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-black shadow-lg shadow-primary/20 group">
                                                    {size}
                                                    <button type="button" onClick={() => removeSize(size)} className="hover:text-white/50 transition-colors">
                                                        <Plus size={14} className="rotate-45" />
                                                    </button>
                                                </div>
                                            ))}
                                            {formData.available_sizes.length === 0 && <p className="text-xs text-muted-foreground italic">No hay tallas configuradas.</p>}
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] space-y-4 border border-slate-100 dark:border-slate-800">
                                        <Label className="text-xs font-black uppercase tracking-widest text-primary ml-1">Matriz de Colores Predeterminados</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Nombre del color (Ej: Negro)"
                                                value={newColor.name}
                                                onChange={e => setNewColor({ ...newColor, name: e.target.value })}
                                                className="rounded-xl h-11 bg-white dark:bg-slate-950 border-none font-bold flex-1"
                                            />
                                            <div className="w-11 h-11 rounded-xl border-none p-1 bg-white dark:bg-slate-950 flex items-center justify-center">
                                                <input
                                                    type="color"
                                                    value={newColor.hex}
                                                    onChange={e => setNewColor({ ...newColor, hex: e.target.value })}
                                                    className="w-full h-full rounded-lg cursor-pointer bg-transparent border-none"
                                                />
                                            </div>
                                            <Button type="button" onClick={addColor} variant="secondary" className="rounded-xl h-11 px-4 font-bold uppercase italic text-xs">Añadir</Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.available_colors.map(color => (
                                                <div key={color.name} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-black group">
                                                    <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: color.hex }} />
                                                    {color.name}
                                                    <button type="button" onClick={() => removeColor(color.name)} className="text-slate-400 hover:text-destructive transition-colors">
                                                        <Plus size={14} className="rotate-45" />
                                                    </button>
                                                </div>
                                            ))}
                                            {formData.available_colors.length === 0 && <p className="text-xs text-muted-foreground italic">No hay colores configurados.</p>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="px-8 py-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 z-10">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-2xl h-14 px-8 font-bold text-muted-foreground hover:bg-slate-100">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={saving} className="rounded-2xl h-14 px-10 gap-3 shadow-xl shadow-primary/30 font-black italic uppercase tracking-tighter">
                                {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
