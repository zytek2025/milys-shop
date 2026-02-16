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
    Check,
    Layers,
    Table as TableIcon
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
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
import type { Product } from '@/types';

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    has_variants: boolean;
    is_customizable: boolean;
    available_sizes: string[];
    available_colors: { name: string; hex: string }[];
}

interface ProductFormProps {
    product?: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Variant {
    id: string;
    product_id: string;
    color: string;
    color_name: string;
    size: string;
    stock: number;
    price_override: number | null;
}

export function ProductForm({ product, isOpen, onClose, onSuccess }: ProductFormProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryDetails, setSelectedCategoryDetails] = useState<Category | null>(null);
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
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<{ name: string; hex: string }[]>([]);

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
                setSelectedSizes([]);
                setSelectedColors([]);
            }
        }
    }, [isOpen, product]);

    useEffect(() => {
        const selectedCat = categories.find(c => c.name === formData.category);
        setSelectedCategoryDetails(selectedCat || null);
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

    const generateMatrix = () => {
        if (selectedColors.length === 0 || selectedSizes.length === 0) {
            toast.error('Selecciona al menos un color y una talla');
            return;
        }

        const newVariants: any[] = [];
        selectedColors.forEach(color => {
            selectedSizes.forEach(size => {
                // Check if already exists in variants
                const exists = variants.find(v => v.color_name === color.name && v.size === size);
                if (!exists) {
                    newVariants.push({
                        id: `temp-${Date.now()}-${color.name}-${size}`,
                        color: color.hex,
                        color_name: color.name,
                        size: size,
                        stock: 0,
                        price_override: null
                    });
                }
            });
        });

        if (newVariants.length === 0) {
            toast.info('Todas las combinaciones seleccionadas ya existen');
            return;
        }

        setVariants([...variants, ...newVariants]);
        toast.success(`Se agregaron ${newVariants.length} combinaciones a la matriz`);
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

    const toggleSizeSelection = (size: string) => {
        setSelectedSizes(prev =>
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
    };

    const toggleColorSelection = (color: { name: string, hex: string }) => {
        setSelectedColors(prev =>
            prev.some(c => c.name === color.name)
                ? prev.filter(c => c.name !== color.name)
                : [...prev, color]
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] rounded-[2.5rem] p-0 border-none shadow-2xl overflow-hidden max-h-[95vh] flex flex-col bg-white dark:bg-slate-950">
                <DialogHeader className="px-8 pt-8 pb-4 bg-white dark:bg-slate-950 sticky top-0 z-10">
                    <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">
                        {product ? 'Editar Producto' : 'Nuevo Producto'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    <div className="px-8 py-4 space-y-6 overflow-y-auto custom-scrollbar">
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre</Label>
                                <Input
                                    id="name"
                                    placeholder="Ej. Sudadera Oversize 'VIBES'"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-900 border-none text-lg font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2 col-span-1">
                                    <Label htmlFor="price" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Precio Base ($)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        required
                                        className="rounded-xl h-14 bg-slate-50 dark:bg-slate-900 border-none font-black text-center text-xl"
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="category" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Categoría</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={v => setFormData({ ...formData, category: v })}
                                    >
                                        <SelectTrigger className="rounded-xl h-14 bg-slate-50 dark:bg-slate-900 border-none font-bold">
                                            <SelectValue placeholder="Seleccionar categoría" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-none shadow-xl">
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.name} className="font-bold">
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Descripción</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Detalles sobre el material, ajuste, etc..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="rounded-2xl min-h-[100px] bg-slate-50 dark:bg-slate-900 border-none font-medium"
                                />
                            </div>

                            {!showVariants && (
                                <div className="space-y-2 p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                    <Label htmlFor="stock" className="text-xs font-black uppercase tracking-widest text-primary">Stock Total Disponible</Label>
                                    <Input
                                        id="stock"
                                        type="number"
                                        placeholder="0"
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                        required
                                        className="rounded-xl h-14 bg-white dark:bg-slate-950 border-none font-black text-center text-2xl"
                                    />
                                </div>
                            )}

                            {showVariants && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Layers size={16} className="text-primary" />
                                            </div>
                                            <h3 className="font-black italic uppercase tracking-tight">Generador de Matriz de Variantes</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Colores Disponibles</Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedCategoryDetails?.available_colors?.map(color => (
                                                        <button
                                                            key={color.name}
                                                            type="button"
                                                            onClick={() => toggleColorSelection(color)}
                                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border-2 ${selectedColors.some(c => c.name === color.name)
                                                                ? 'bg-primary text-primary-foreground border-primary'
                                                                : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800'
                                                                }`}
                                                        >
                                                            <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: color.hex }} />
                                                            {color.name}
                                                        </button>
                                                    ))}
                                                    {!selectedCategoryDetails?.available_colors?.length && (
                                                        <p className="text-xs italic text-muted-foreground">Configura colores en la categoría primero.</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tallas Disponibles</Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedCategoryDetails?.available_sizes?.map(size => (
                                                        <button
                                                            key={size}
                                                            type="button"
                                                            onClick={() => toggleSizeSelection(size)}
                                                            className={`min-w-[40px] h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all border-2 ${selectedSizes.includes(size)
                                                                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                                                                : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800'
                                                                }`}
                                                        >
                                                            {size}
                                                        </button>
                                                    ))}
                                                    {!selectedCategoryDetails?.available_sizes?.length && (
                                                        <p className="text-xs italic text-muted-foreground">Configura tallas en la categoría primero.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            onClick={generateMatrix}
                                            disabled={selectedColors.length === 0 || selectedSizes.length === 0}
                                            className="w-full h-12 rounded-2xl gap-2 font-black italic uppercase italic tracking-tighter shadow-lg shadow-primary/20"
                                        >
                                            <Plus size={18} /> Generar Matriz Seleccionada
                                        </Button>

                                        {variants.length > 0 && (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Matriz de Inventario ({variants.length})</Label>
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                        Total: <span className="text-primary">{variants.reduce((sum, v) => sum + parseInt(v.stock || 0), 0)}</span>
                                                    </div>
                                                </div>
                                                <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
                                                    <Table>
                                                        <TableHeader className="bg-slate-100 dark:bg-slate-800">
                                                            <TableRow className="hover:bg-transparent h-10">
                                                                <TableHead className="text-[10px] font-black">COLOR</TableHead>
                                                                <TableHead className="text-[10px] font-black">TALLA</TableHead>
                                                                <TableHead className="text-[10px] font-black text-center w-24">STOCK</TableHead>
                                                                <TableHead className="w-10"></TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody className="bg-white dark:bg-slate-950">
                                                            {variants.map((v, idx) => (
                                                                <TableRow key={v.id || idx} className="h-12 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-100 dark:border-slate-800">
                                                                    <TableCell className="py-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: v.color }} />
                                                                            <span className="text-xs font-bold">{v.color_name}</span>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="py-2">
                                                                        <span className="text-xs font-black">{v.size}</span>
                                                                    </TableCell>
                                                                    <TableCell className="py-2 px-1">
                                                                        <Input
                                                                            type="number"
                                                                            className="h-8 text-center text-xs font-black rounded-lg border-none bg-slate-100 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 transition-all"
                                                                            value={v.stock}
                                                                            onChange={e => {
                                                                                const newVariants = [...variants];
                                                                                newVariants[idx].stock = e.target.value;
                                                                                setVariants(newVariants);
                                                                            }}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell className="py-2 text-right">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                                                                            className="text-slate-400 hover:text-destructive transition-colors mr-2"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Imagen del Producto</Label>
                                <div className="flex gap-6 p-6 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                                    <div className="relative group shrink-0">
                                        <div className="h-32 w-32 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center bg-white dark:bg-slate-950 overflow-hidden shadow-inner">
                                            {formData.image_url ? (
                                                <img
                                                    src={formData.image_url}
                                                    alt="Preview"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 text-slate-300">
                                                    <ImageIcon size={32} />
                                                    <span className="text-[10px] font-bold uppercase">Sin imagen</span>
                                                </div>
                                            )}
                                            {uploading && (
                                                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col justify-center gap-3">
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
                                                className="w-full rounded-2xl gap-2 h-12 text-xs font-black uppercase tracking-tighter border-2"
                                                onClick={() => document.getElementById('file-upload')?.click()}
                                                disabled={uploading}
                                            >
                                                <Upload size={16} />
                                                {formData.image_url ? 'Cambiar Imagen' : 'Subir desde PC'}
                                            </Button>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                id="image_url"
                                                placeholder="O pega una URL de imagen..."
                                                value={formData.image_url}
                                                onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                                className="rounded-xl h-12 text-xs font-medium border-none bg-white dark:bg-slate-950 shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-8 py-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 z-10 gap-3">
                        <Button type="button" variant="ghost" onClick={onClose} className="rounded-2xl h-14 px-8 font-bold text-muted-foreground hover:bg-slate-100">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading || uploading} className="rounded-2xl h-14 px-12 gap-3 shadow-2xl shadow-primary/40 font-black italic uppercase tracking-tighter min-w-[200px]">
                            {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                            {product ? 'Actualizar Producto' : 'Lanzar Producto'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
