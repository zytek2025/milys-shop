'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Loader2,
    Save,
    Image as ImageIcon,
    Upload,
    Palette,
    Type
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function AdminDesignsPage() {
    const [designs, setDesigns] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDesign, setEditingDesign] = useState<any | null>(null);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image_url: '',
        price: '0',
        price_small: '0',
        price_medium: '0',
        price_large: '0',
        category_id: ''
    });
    const [saving, setSaving] = useState(false);

    // Global Pricing State
    const [storeSettings, setStoreSettings] = useState({
        personalization_price_small: 1.00,
        personalization_price_large: 3.00,
        design_price_small: 2.00,
        design_price_medium: 5.00,
        design_price_large: 10.00
    });
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    useEffect(() => {
        fetchDesigns();
        fetchCategories();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (res.ok) {
                setStoreSettings({
                    personalization_price_small: Number(data.personalization_price_small ?? 1.00),
                    personalization_price_large: Number(data.personalization_price_large ?? 3.00),
                    design_price_small: Number(data.design_price_small ?? 2.00),
                    design_price_medium: Number(data.design_price_medium ?? 5.00),
                    design_price_large: Number(data.design_price_large ?? 10.00)
                });
            }
        } catch (error) { }
    };

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(storeSettings)
            });
            if (res.ok) {
                toast.success('Precios actualizados correctamente');
            } else {
                toast.error('Error al guardar precios');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setIsSavingSettings(false);
        }
    };

    const updateSettingField = (field: string, value: string) => {
        setStoreSettings(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
    };

    const fetchDesigns = async () => {
        try {
            const res = await fetch('/api/admin/designs');
            const data = await res.json();
            setDesigns(Array.isArray(data) ? data : []);
            if (!res.ok) toast.error(data.error || 'Error al cargar diseños');
        } catch (error) {
            toast.error('Error al cargar diseños');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/admin/design-categories');
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) { }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `designs/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            setFormData({ ...formData, image_url: publicUrl });
            toast.success('Imagen subida correctamente');
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error.message || 'Error al subir imagen');
        } finally {
            setUploading(false);
        }
    };

    const handleOpenDialog = (design?: any) => {
        if (design) {
            setEditingDesign(design);
            setFormData({
                name: design.name,
                description: design.description || '',
                image_url: design.image_url,
                price: design.price.toString(),
                price_small: (design.price_small || 0).toString(),
                price_medium: (design.price_medium || 0).toString(),
                price_large: (design.price_large || 0).toString(),
                category_id: design.category_id || 'none'
            });
        } else {
            setEditingDesign(null);
            setFormData({
                name: '',
                description: '',
                image_url: '',
                price: '0',
                price_small: '0',
                price_medium: '0',
                price_large: '0',
                category_id: ''
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingDesign
                ? `/api/admin/designs/${editingDesign.id}`
                : '/api/admin/designs';
            const method = editingDesign ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    category_id: formData.category_id === 'none' ? null : formData.category_id,
                    price: parseFloat(formData.price),
                    price_small: parseFloat(formData.price_small),
                    price_medium: parseFloat(formData.price_medium),
                    price_large: parseFloat(formData.price_large)
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error al guardar');
            }

            toast.success(editingDesign ? 'Diseño actualizado' : 'Diseño publicado');
            fetchDesigns();
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Borrar este diseño?')) return;
        try {
            await fetch(`/api/admin/designs/${id}`, { method: 'DELETE' });
            toast.success('Eliminado');
            setDesigns(designs.filter(d => d.id !== id));
        } catch (error) {
            toast.error('Error');
        }
    };

    const filteredDesigns = designs.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Biblioteca de Diseños</h1>
                    <p className="text-muted-foreground">Gestiona tus artes y configura sus precios globales.</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="rounded-xl gap-2 shadow-lg shadow-primary/20 h-11 px-6 font-bold">
                    <Plus size={18} />
                    Subir Diseño
                </Button>
            </div>

            {/* Search Section */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="pb-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Buscar por nombre..."
                            className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                <TableHead className="w-[100px]">Arte</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Tipo/Categoría</TableHead>
                                <TableHead>Precio Extra</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell>
                                </TableRow>
                            ) : filteredDesigns.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">No hay diseños publicados.</TableCell>
                                </TableRow>
                            ) : (
                                filteredDesigns.map((design) => (
                                    <TableRow key={design.id} className="border-slate-100 dark:border-slate-800">
                                        <TableCell>
                                            <div className="w-12 h-12 rounded-lg bg-slate-50 overflow-hidden border">
                                                <img src={design.image_url} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold">{design.name}</TableCell>
                                        <TableCell>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                                                {design.category?.name || 'Sin categoría'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-bold text-slate-400">Base: ${design.price.toFixed(2)}</span>
                                                <div className="flex gap-2 text-[10px] font-mono">
                                                    <span className="text-blue-500">S: ${design.price_small?.toFixed(2)}</span>
                                                    <span className="text-purple-500">M: ${design.price_medium?.toFixed(2)}</span>
                                                    <span className="text-orange-500">L: ${design.price_large?.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(design)}><Edit2 size={16} /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(design.id)}><Trash2 size={16} /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[450px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Palette className="text-primary" />
                            {editingDesign ? 'Editar Diseño' : 'Nuevo Diseño para Sublimación'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Nombre del Arte</Label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="rounded-xl h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo/Colección</Label>
                                <Select
                                    value={formData.category_id}
                                    onValueChange={val => setFormData({ ...formData, category_id: val })}
                                >
                                    <SelectTrigger className="rounded-xl h-11">
                                        <SelectValue placeholder="Selecciona..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sin Categoría</SelectItem>
                                        {Array.isArray(categories) && categories.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Precio Base</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    className="rounded-xl h-11"
                                />
                            </div>
                            <div className="col-span-2 grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
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

                        <div className="space-y-2">
                            <Label>Imagen del Diseño (PNG sugerido)</Label>
                            <div className="flex gap-4">
                                <div className="h-24 w-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                                    {formData.image_url ? (
                                        <img src={formData.image_url} className="w-full h-full object-contain" alt="" />
                                    ) : (
                                        <ImageIcon className="text-slate-300" size={32} />
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col justify-center gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="rounded-xl h-10 gap-2 relative overflow-hidden"
                                        disabled={uploading}
                                    >
                                        {uploading ? (
                                            <Loader2 className="animate-spin" size={16} />
                                        ) : (
                                            <>
                                                <Upload size={16} />
                                                Elegir Archivo
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleImageUpload}
                                            accept="image/*"
                                        />
                                    </Button>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest px-1">PNG o JPG máx 5MB</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Descripción (Opcional)</Label>
                            <Textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="rounded-xl min-h-[80px]"
                            />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={saving || uploading} className="rounded-xl w-full h-12 text-lg font-bold shadow-lg shadow-primary/20">
                                {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                                {editingDesign ? 'Guardar Cambios' : 'Publicar en Galería'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
