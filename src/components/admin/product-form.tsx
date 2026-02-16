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
            <DialogContent className="sm:max-w-[550px] rounded-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        {product ? 'Editar Producto' : 'Nuevo Producto'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre del Producto</Label>
                            <Input
                                id="name"
                                placeholder="Ej. Franela Retro Design"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="rounded-xl h-11"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Precio Base ($)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    required
                                    className="rounded-xl h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stock">Stock {showVariants ? '(Autocalculado)' : 'Inicial'}</Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    placeholder="0"
                                    value={showVariants ? variants.reduce((sum, v) => sum + parseInt(v.stock || 0), 0) : formData.stock}
                                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                    required
                                    disabled={showVariants}
                                    className="rounded-xl h-11"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Categoría</Label>
                            <Select
                                value={formData.category}
                                onValueChange={v => setFormData({ ...formData, category: v })}
                            >
                                <SelectTrigger className="rounded-xl h-11">
                                    <SelectValue placeholder="Seleccionar categoría" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.name}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                                id="description"
                                placeholder="Detalles sobre el producto..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="rounded-xl min-h-[80px]"
                            />
                        </div>

                        {showVariants && (
                            <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Palette size={18} className="text-primary" />
                                        <h3 className="text-sm font-bold">Variantes de Prenda</h3>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-lg text-xs"
                                        onClick={() => setVariants([...variants, { id: Math.random().toString(), color: '#000000', color_name: 'Negro', size: 'M', stock: 0, price_override: null }])}
                                    >
                                        <Plus size={14} className="mr-1" /> Añadir variante
                                    </Button>
                                </div>

                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                                    {variants.map((v, idx) => (
                                        <div key={v.id} className="grid grid-cols-[1.5fr,1fr,1fr,auto] gap-2 items-end bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                            <div className="space-y-1">
                                                <Label className="text-[10px]">Color</Label>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="color"
                                                        value={v.color}
                                                        onChange={e => {
                                                            const newVariants = [...variants];
                                                            newVariants[idx].color = e.target.value;
                                                            setVariants(newVariants);
                                                        }}
                                                        className="w-6 h-6 rounded-full border-none cursor-pointer bg-transparent"
                                                    />
                                                    <Input
                                                        placeholder="Nombre"
                                                        className="h-8 text-[10px] rounded-lg border-none bg-slate-50 p-1"
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
                                                <Label className="text-[10px]">Talla</Label>
                                                <Input
                                                    placeholder="S, M..."
                                                    className="h-8 text-[10px] rounded-lg border-none bg-slate-50 p-1"
                                                    value={v.size}
                                                    onChange={e => {
                                                        const newVariants = [...variants];
                                                        newVariants[idx].size = e.target.value;
                                                        setVariants(newVariants);
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px]">Stock</Label>
                                                <Input
                                                    type="number"
                                                    className="h-8 text-[10px] rounded-lg border-none bg-slate-50 p-1"
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
                                                className="h-8 w-8 text-destructive"
                                                onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                {variants.length > 0 && (
                                    <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                                        <Check size={10} className="text-green-500" /> Stock sumado automáticamente.
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="image_url">Imagen del Diseño</Label>
                            <div className="flex gap-3 mt-2">
                                <div className="relative group">
                                    <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
                                        {formData.image_url ? (
                                            <img
                                                src={formData.image_url}
                                                alt="Preview"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 text-slate-400">
                                                <ImageIcon size={20} />
                                                <span className="text-[10px]">Sin imagen</span>
                                            </div>
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col justify-center gap-2">
                                    <div className="relative">
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
                                            className="w-full rounded-xl gap-2 h-10 text-xs"
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                            disabled={uploading}
                                        >
                                            <Upload size={14} />
                                            {formData.image_url ? 'Cambiar Diseño' : 'Subir Diseño'}
                                        </Button>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="image_url"
                                            placeholder="O pega una URL..."
                                            value={formData.image_url}
                                            onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                            className="rounded-xl h-10 text-[10px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl h-11 px-6">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="rounded-xl h-11 px-8 gap-2 shadow-lg shadow-primary/20">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {product ? 'Actualizar' : 'Crear Producto'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
