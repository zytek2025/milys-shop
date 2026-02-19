'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
    Layers,
    X,
    CheckCircle2
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
import { Badge } from '@/components/ui/badge';
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
import { Progress } from '@/components/ui/progress';

// ─── Types ──────────────────────────────────────────────────────────────────
interface BulkItem {
    file: File;
    previewUrl: string;
    name: string;
    category_id: string;
    status: 'pending' | 'uploading' | 'done' | 'error';
    error?: string;
}

export default function AdminDesignsPage() {
    const [designs, setDesigns] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDesign, setEditingDesign] = useState<any | null>(null);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', image_url: '', category_id: '' });
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

    // Bulk upload state
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isBulkSaving, setIsBulkSaving] = useState(false);
    const [bulkProgress, setBulkProgress] = useState(0);
    const [defaultCategory, setDefaultCategory] = useState('');
    const bulkInputRef = useRef<HTMLInputElement>(null);

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
                    design_price_large: Number(data.design_price_large ?? 10.00),
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
            if (res.ok) toast.success('Precios actualizados correctamente');
            else toast.error('Error al guardar precios');
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setIsSavingSettings(false);
        }
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

    // ─── Single upload ─────────────────────────────────────────────────────
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const filePath = `designs/${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
            setFormData({ ...formData, image_url: publicUrl });
            toast.success('Imagen subida correctamente');
        } catch (error: any) {
            toast.error(error.message || 'Error al subir imagen');
        } finally {
            setUploading(false);
        }
    };

    const handleOpenDialog = (design?: any) => {
        if (design) {
            setEditingDesign(design);
            setFormData({ name: design.name, description: design.description || '', image_url: design.image_url, category_id: design.category_id || 'none' });
        } else {
            setEditingDesign(null);
            setFormData({ name: '', description: '', image_url: '', category_id: '' });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingDesign ? `/api/admin/designs/${editingDesign.id}` : '/api/admin/designs';
            const method = editingDesign ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, category_id: formData.category_id === 'none' ? null : formData.category_id }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Error al guardar');
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

    // ─── Bulk upload handlers ───────────────────────────────────────────────
    const addFilesToBulk = useCallback((files: FileList | File[]) => {
        const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (!arr.length) return;
        const newItems: BulkItem[] = arr.map(file => ({
            file,
            previewUrl: URL.createObjectURL(file),
            name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            category_id: defaultCategory || '',
            status: 'pending'
        }));
        setBulkItems(prev => [...prev, ...newItems]);
    }, [defaultCategory]);

    const handleBulkDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        addFilesToBulk(e.dataTransfer.files);
    };

    const removeBulkItem = (idx: number) => {
        setBulkItems(prev => {
            URL.revokeObjectURL(prev[idx].previewUrl);
            return prev.filter((_, i) => i !== idx);
        });
    };

    const updateBulkItem = (idx: number, field: 'name' | 'category_id', value: string) => {
        setBulkItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    };

    const applyDefaultCategoryToAll = () => {
        if (!defaultCategory) return;
        setBulkItems(prev => prev.map(item => ({ ...item, category_id: defaultCategory })));
    };

    const handleBulkSave = async () => {
        const pending = bulkItems.filter(i => i.status === 'pending');
        if (!pending.length) return;

        const unnamed = bulkItems.findIndex(i => i.status === 'pending' && !i.name.trim());
        if (unnamed !== -1) {
            toast.error(`El logo #${unnamed + 1} no tiene nombre`);
            return;
        }

        setIsBulkSaving(true);
        setBulkProgress(0);
        const supabase = createClient();
        let done = 0;

        for (let i = 0; i < bulkItems.length; i++) {
            const item = bulkItems[i];
            if (item.status !== 'pending') continue;

            setBulkItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'uploading' } : it));

            try {
                // 1. Upload to storage
                const fileExt = item.file.name.split('.').pop();
                const filePath = `designs/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, item.file);
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);

                // 2. Save to DB
                const res = await fetch('/api/admin/designs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: item.name.trim(),
                        image_url: publicUrl,
                        category_id: item.category_id && item.category_id !== 'none' ? item.category_id : null,
                        description: ''
                    })
                });

                if (!res.ok) throw new Error('Error al guardar en DB');

                setBulkItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'done' } : it));
            } catch (err: any) {
                setBulkItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'error', error: err.message } : it));
            }

            done++;
            setBulkProgress(Math.round((done / pending.length) * 100));
        }

        setIsBulkSaving(false);
        const errors = bulkItems.filter(i => i.status === 'error').length;
        if (errors === 0) {
            toast.success(`✅ ${done} logos publicados correctamente`);
            setTimeout(() => {
                setIsBulkOpen(false);
                setBulkItems([]);
                fetchDesigns();
            }, 800);
        } else {
            toast.warning(`${done - errors} publicados, ${errors} con error`);
            fetchDesigns();
        }
    };

    const handleCloseBulk = () => {
        if (isBulkSaving) return;
        bulkItems.forEach(i => URL.revokeObjectURL(i.previewUrl));
        setBulkItems([]);
        setIsBulkOpen(false);
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
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsBulkOpen(true)}
                        className="rounded-xl gap-2 h-11 px-5 font-bold border-2"
                    >
                        <Layers size={18} />
                        Carga Masiva
                    </Button>
                    <Button onClick={() => handleOpenDialog()} className="rounded-xl gap-2 shadow-lg shadow-primary/20 h-11 px-6 font-bold">
                        <Plus size={18} />
                        Subir Diseño
                    </Button>
                </div>
            </div>

            {/* Search & Table */}
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
                                <TableHead className="w-[100px]">ID</TableHead>
                                <TableHead className="w-[100px]">Arte</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Tipo/Categoría</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="h-48 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                            ) : filteredDesigns.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground">No hay diseños publicados.</TableCell></TableRow>
                            ) : (
                                filteredDesigns.map((design) => (
                                    <TableRow key={design.id} className="border-slate-100 dark:border-slate-800">
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono text-[9px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                {design.control_id || 'DSG-???'}
                                            </Badge>
                                        </TableCell>
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

            {/* ─── Single Upload Dialog ─────────────────────────────────────── */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[450px] rounded-3xl bg-white dark:bg-slate-950">
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
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="rounded-xl h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo/Colección</Label>
                                <Select value={formData.category_id} onValueChange={val => setFormData({ ...formData, category_id: val })}>
                                    <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sin Categoría</SelectItem>
                                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Imagen del Diseño (PNG sugerido)</Label>
                            <div className="flex gap-4">
                                <div className="h-24 w-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                                    {formData.image_url ? <img src={formData.image_url} className="w-full h-full object-contain" alt="" /> : <ImageIcon className="text-slate-300" size={32} />}
                                </div>
                                <div className="flex-1 flex flex-col justify-center gap-2">
                                    <Button type="button" variant="secondary" className="rounded-xl h-10 gap-2 relative overflow-hidden" disabled={uploading}>
                                        {uploading ? <Loader2 className="animate-spin" size={16} /> : <><Upload size={16} />Elegir Archivo</>}
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} accept="image/*" />
                                    </Button>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest px-1">PNG o JPG máx 5MB</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Descripción (Opcional)</Label>
                            <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="rounded-xl min-h-[80px]" />
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

            {/* ─── Bulk Upload Dialog ───────────────────────────────────────── */}
            <Dialog open={isBulkOpen} onOpenChange={(open) => { if (!open) handleCloseBulk(); }}>
                <DialogContent className="max-w-4xl w-full rounded-3xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50 dark:bg-slate-900 shrink-0">
                        <div>
                            <h2 className="text-xl font-black italic uppercase tracking-tight">Carga Masiva de Logos</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Sube múltiples imágenes y asigna nombre y categoría a cada una</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleCloseBulk} disabled={isBulkSaving}><X size={20} /></Button>
                    </div>

                    {/* Global category bar */}
                    {bulkItems.length > 0 && (
                        <div className="px-6 py-3 border-b bg-white dark:bg-slate-950 flex items-center gap-3 shrink-0">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Categoría global:</span>
                            <Select value={defaultCategory} onValueChange={setDefaultCategory}>
                                <SelectTrigger className="h-8 rounded-lg text-sm w-48">
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin Categoría</SelectItem>
                                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button size="sm" variant="outline" className="h-8 text-xs font-bold rounded-lg" onClick={applyDefaultCategoryToAll}>
                                Aplicar a todos
                            </Button>
                            <span className="ml-auto text-xs text-muted-foreground">{bulkItems.filter(i => i.status === 'pending').length} pendientes</span>
                        </div>
                    )}

                    {/* Content area */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Drop zone */}
                        <div
                            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer mb-6 ${isDragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={handleBulkDrop}
                            onClick={() => bulkInputRef.current?.click()}
                        >
                            <input
                                ref={bulkInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => e.target.files && addFilesToBulk(e.target.files)}
                            />
                            <Upload size={36} className={`mx-auto mb-3 transition-colors ${isDragOver ? 'text-primary' : 'text-slate-300'}`} />
                            <p className="font-bold text-sm">Arrastra tus logos aquí o haz clic para seleccionar</p>
                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG — múltiples archivos permitidos</p>
                        </div>

                        {/* Items grid */}
                        {bulkItems.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {bulkItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={`relative rounded-2xl border-2 overflow-hidden transition-all ${item.status === 'done' ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' : item.status === 'error' ? 'border-red-400 bg-red-50 dark:bg-red-950/20' : item.status === 'uploading' ? 'border-primary animate-pulse' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                                    >
                                        {/* Status overlay */}
                                        {item.status === 'done' && (
                                            <div className="absolute top-2 right-2 z-10">
                                                <CheckCircle2 size={22} className="text-emerald-500" />
                                            </div>
                                        )}
                                        {item.status === 'uploading' && (
                                            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center z-10">
                                                <Loader2 size={28} className="animate-spin text-primary" />
                                            </div>
                                        )}
                                        {item.status === 'pending' && (
                                            <button
                                                onClick={() => removeBulkItem(idx)}
                                                className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}

                                        {/* Image preview */}
                                        <div className="h-32 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                            <img src={item.previewUrl} alt="" className="h-full w-full object-contain p-2" />
                                        </div>

                                        {/* Fields */}
                                        <div className="p-3 space-y-2">
                                            <input
                                                className="w-full text-sm font-bold border rounded-lg px-2 py-1.5 bg-transparent outline-none focus:ring-2 focus:ring-primary/30 border-slate-200 dark:border-slate-700 placeholder:text-slate-400"
                                                placeholder="Nombre del logo"
                                                value={item.name}
                                                onChange={e => updateBulkItem(idx, 'name', e.target.value)}
                                                disabled={item.status !== 'pending'}
                                            />
                                            <select
                                                className="w-full text-xs border rounded-lg px-2 py-1.5 bg-transparent outline-none focus:ring-2 focus:ring-primary/30 border-slate-200 dark:border-slate-700"
                                                value={item.category_id}
                                                onChange={e => updateBulkItem(idx, 'category_id', e.target.value)}
                                                disabled={item.status !== 'pending'}
                                            >
                                                <option value="">Sin categoría</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            {item.status === 'error' && (
                                                <p className="text-[10px] text-red-500 font-medium">{item.error}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t bg-slate-50 dark:bg-slate-900 shrink-0">
                        {isBulkSaving && (
                            <div className="mb-3">
                                <Progress value={bulkProgress} className="h-2 rounded-full" />
                                <p className="text-xs text-muted-foreground mt-1 text-center">{bulkProgress}% completado</p>
                            </div>
                        )}
                        <div className="flex gap-3">
                            <Button variant="outline" className="rounded-xl flex-1 h-11" onClick={handleCloseBulk} disabled={isBulkSaving}>
                                Cancelar
                            </Button>
                            <Button
                                className="rounded-xl flex-1 h-11 font-black gap-2 shadow-lg shadow-primary/20"
                                onClick={handleBulkSave}
                                disabled={isBulkSaving || bulkItems.filter(i => i.status === 'pending').length === 0}
                            >
                                {isBulkSaving ? <><Loader2 size={18} className="animate-spin" /> Publicando...</> : <><Save size={18} /> Publicar {bulkItems.filter(i => i.status === 'pending').length} Logos</>}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
