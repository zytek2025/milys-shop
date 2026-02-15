'use client';

import { useState, useEffect } from 'react';
import {
    X,
    Upload,
    Save,
    Loader2,
    Image as ImageIcon,
    Palette,
    Plus,
    Trash2,
    Check
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import type { Product, Category } from '@/types';

interface ProductFormProps {
    product?: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ProductForm({ product, isOpen, onClose, onSuccess }: ProductFormProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '0',
        image_url: ''
    });

    const [variants, setVariants] = useState<any[]>([]);
    const [showVariants, setShowVariants] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            if (product) {
                setFormData({
                    name: product.name || '',
                    description: product.description || '',
                    price: product.price?.toString() || '',
                    category: product.category || '',
                    stock: product.stock?.toString() || '0',
                    image_url: product.image_url || ''
                });
                fetchVariants(product.id);
            } else {
                setFormData({
                    name: '',
                    description: '',
                    price: '',
                    category: '',
                    stock: '0',
                    image_url: ''
                });
                setVariants([]);
            }
        }
    }, [isOpen, product]);

    useEffect(() => {
        const selectedCat = categories.find(c => c.name === formData.category);
        setShowVariants(!!selectedCat?.has_variants);
    }, [formData.category, categories]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/admin/categories');
            const data = await res.json();
            if (res.ok) setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchVariants = async (productId: string) => {
        try {
            const res = await fetch(`/api/admin/variants?productId=${productId}`);
            const data = await res.json();
            if (res.ok) setVariants(data);
        } catch (error) {
            console.error('Error fetching variants:', error);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: uploadFormData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al subir imagen');

            setFormData({ ...formData, image_url: data.url });
            toast.success('Imagen subida con éxito');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = product
                ? `/api/admin/products/${product.id}`
                : '/api/admin/products';
            const method = product ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                    stock: showVariants
                        ? variants.reduce((sum, v) => sum + parseInt(v.stock || 0), 0)
                        : parseInt(formData.stock),
                    variants: showVariants ? variants : []
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error al guardar producto');
            }

            toast.success(product ? 'Producto actualizado' : 'Producto creado');
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="px-8 pt-8 pb-4">
                        <DialogTitle className="text-2xl font-bold">
                            {product ? 'Editar Producto' : 'Nuevo Producto'}
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Completa los detalles del producto para el catálogo.
                        </p>
                    </DialogHeader>

                    <ScrollArea className="max-h-[65vh] px-8">
                        <div className="grid gap-6 py-4 pb-8">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-400">Nombre del Producto</Label>
                                <Input
                                    id="name"
                                    placeholder="Ej. Franela Retro Design"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="rounded-2xl h-12 bg-slate-50 dark:bg-slate-900 border-none px-4"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-xs font-bold uppercase tracking-widest text-slate-400">Precio Base ($)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        required
                                        className="rounded-2xl h-12 bg-slate-50 dark:bg-slate-900 border-none px-4"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stock" className="text-xs font-bold uppercase tracking-widest text-slate-400">Stock {showVariants ? '(Sumado)' : 'Inicial'}</Label>
                                    <Input
                                        id="stock"
                                        type="number"
                                        placeholder="0"
                                        value={showVariants ? variants.reduce((sum, v) => sum + parseInt(v.stock || 0), 0) : formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                        required
                                        disabled={showVariants}
                                        className="rounded-2xl h-12 bg-slate-50 dark:bg-slate-900 border-none px-4"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-xs font-bold uppercase tracking-widest text-slate-400">Categoría</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={v => setFormData({ ...formData, category: v })}
                                >
                                    <SelectTrigger className="rounded-2xl h-12 bg-slate-50 dark:bg-slate-900 border-none shadow-none px-4">
                                        <SelectValue placeholder="Seleccionar categoría" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.name}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-slate-400">Descripción</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Detalles sobre el producto..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="rounded-2xl min-h-[100px] bg-slate-50 dark:bg-slate-900 border-none px-4"
                                />
                            </div>

                            {showVariants && (
                                <div className="space-y-4 p-5 rounded-[2rem] bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 animate-in fade-in slide-in-from-top duration-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Palette size={18} className="text-indigo-600" />
                                            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Variantes</h3>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8 rounded-xl text-xs bg-white dark:bg-slate-950"
                                            onClick={() => setVariants([...variants, { id: Math.random().toString(), color: '#000000', color_name: 'Negro', size: 'M', stock: 0, price_override: null }])}
                                        >
                                            <Plus size={14} className="mr-1" /> Añadir
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {variants.map((v, idx) => (
                                            <div key={v.id} className="grid grid-cols-[1fr,0.8fr,0.8fr,auto] gap-3 items-end bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black text-slate-400">Color</Label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={v.color}
                                                            onChange={e => {
                                                                const newVariants = [...variants];
                                                                newVariants[idx].color = e.target.value;
                                                                setVariants(newVariants);
                                                            }}
                                                            className="w-7 h-7 rounded-full border-none cursor-pointer bg-transparent shadow-sm"
                                                        />
                                                        <Input
                                                            placeholder="Nombre"
                                                            className="h-8 text-[11px] rounded-lg border-none bg-slate-50 dark:bg-slate-800 px-2"
                                                            value={v.color_name}
                                                            onChange={e => {
                                                                const newVariants = [...variants];
                                                                newVariants[idx].color_name = e.target.value;
                                                                setVariants(newVariants);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black text-slate-400">Talla</Label>
                                                    <Input
                                                        placeholder="S, M..."
                                                        className="h-8 text-[11px] rounded-lg border-none bg-slate-50 dark:bg-slate-800 px-2"
                                                        value={v.size}
                                                        onChange={e => {
                                                            const newVariants = [...variants];
                                                            newVariants[idx].size = e.target.value;
                                                            setVariants(newVariants);
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black text-slate-400">Stock</Label>
                                                    <Input
                                                        type="number"
                                                        className="h-8 text-[11px] rounded-lg border-none bg-slate-50 dark:bg-slate-800 px-2"
                                                        value={v.stock}
                                                        onChange={e => {
                                                            const newVariants = [...variants];
                                                            newVariants[idx].stock = e.target.value;
                                                            setVariants(newVariants);
                                                        }}
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive/60 hover:text-destructive"
                                                    onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    {variants.length > 0 && (
                                        <p className="text-[10px] text-indigo-600/60 italic flex items-center gap-1">
                                            <Check size={10} /> El stock total se actualiza solo.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Gestión de Imagen */}
                            <div className="space-y-4 pt-4">
                                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Imagen del Producto</Label>
                                <div className="grid grid-cols-2 gap-6 items-center">
                                    <div className="aspect-square rounded-[2rem] bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-800 group relative">
                                        {formData.image_url ? (
                                            <>
                                                <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button variant="ghost" className="text-white hover:text-white" onClick={() => setFormData({ ...formData, image_url: '' })}>Eliminar</Button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center space-y-2 p-6">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 group-hover:scale-110 transition-transform">
                                                    <Upload size={24} />
                                                </div>
                                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Subir archivo</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            id="file-upload"
                                            disabled={uploading}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full rounded-2xl gap-2 h-11 text-xs border-indigo-100 dark:border-indigo-900 bg-white dark:bg-slate-950 shadow-sm"
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                            disabled={uploading}
                                        >
                                            <Upload size={16} />
                                            {formData.image_url ? 'Cambiar Foto' : 'Subir desde equipo'}
                                        </Button>
                                        <Input
                                            id="image_url"
                                            placeholder="O pega link de imagen..."
                                            value={formData.image_url}
                                            onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                            className="rounded-2xl h-10 text-[10px] bg-slate-50 dark:bg-slate-900 border-none px-4 shadow-inner"
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
                            onClick={onClose}
                            className="rounded-2xl h-12 px-6 font-semibold"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="rounded-2xl h-12 px-8 font-bold gap-2 shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-primary/90 hover:scale-[1.02] transition-transform"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save size={20} />}
                            {product ? 'Guardar Cambios' : 'Crear Producto'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
