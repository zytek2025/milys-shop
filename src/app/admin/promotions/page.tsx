'use client';

import { useState, useEffect } from 'react';
import {
    Tag,
    Plus,
    Search,
    Edit2,
    Trash2,
    Loader2,
    Calendar,
    CheckCircle2,
    XCircle,
    Info,
    ChevronRight
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Promotion } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminPromotionsPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [products, setProducts] = useState<any[]>([]); // To select reward products
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'percentage' as Promotion['type'],
        target_type: 'all' as Promotion['target_type'],
        target_id: '',
        value: 0,
        min_quantity: 1,
        min_orders_required: 0,
        min_order_value_condition: 0,
        reward_product_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        is_active: true
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            const [promoRes, prodRes] = await Promise.all([
                fetch('/api/admin/promotions'),
                fetch('/api/admin/products')
            ]);

            const promoData = await promoRes.json();
            const prodData = await prodRes.json();

            if (promoRes.ok) setPromotions(promoData);
            if (prodRes.ok) setProducts(prodData.products || prodData || []);
        } catch (error) {
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (promo?: Promotion) => {
        if (promo) {
            setEditingPromo(promo);
            setFormData({
                name: promo.name,
                description: promo.description || '',
                type: promo.type,
                target_type: promo.target_type,
                target_id: promo.target_id || '',
                value: promo.value,
                min_quantity: promo.min_quantity,
                min_orders_required: promo.min_orders_required || 0,
                min_order_value_condition: promo.min_order_value_condition || 0,
                reward_product_id: promo.reward_product_id || '',
                start_date: new Date(promo.start_date).toISOString().split('T')[0],
                end_date: promo.end_date ? new Date(promo.end_date).toISOString().split('T')[0] : '',
                is_active: promo.is_active
            });
        } else {
            setEditingPromo(null);
            setFormData({
                name: '',
                description: '',
                type: 'percentage',
                target_type: 'all',
                target_id: '',
                value: 0,
                min_quantity: 1,
                min_orders_required: 0,
                min_order_value_condition: 0,
                reward_product_id: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                is_active: true
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingPromo ? `/api/admin/promotions/${editingPromo.id}` : '/api/admin/promotions';
            const method = editingPromo ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success(editingPromo ? 'Oferta actualizada' : 'Oferta creada exitosamente');
                setIsDialogOpen(false);
                fetchPromotions();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Error al guardar');
            }
        } catch (error) {
            toast.error('Error al conectar con el servidor');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta promoción?')) return;
        try {
            const res = await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Promoción eliminada');
                fetchPromotions();
            }
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    const filteredPromotions = promotions.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const typeLabels = {
        bogo: '2x1 (BOGO)',
        second_unit_50: '50% 2da Unidad',
        percentage: 'Porcentaje (%)',
        fixed: 'Monto Fijo ($)',
        gift: 'Obsequio / Regalo',
        loyalty_reward: 'Premio Fidelidad (Saldo)'
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent dark:from-white dark:to-slate-400 tracking-tighter italic uppercase">
                        Promociones & Ofertas
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic">
                        Gestiona campañas navideñas, 2x1 y descuentos estacionales.
                    </p>
                </div>
                <Button
                    onClick={() => handleOpenDialog()}
                    className="rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 gap-2 h-12 px-6 font-bold uppercase italic text-xs tracking-widest"
                >
                    <Plus size={18} /> Nueva Campaña
                </Button>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden rounded-[2rem] bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-slate-800">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                            <Input
                                placeholder="Buscar campañas..."
                                className="pl-12 h-12 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border-none ring-offset-transparent focus-visible:ring-primary/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                <TableHead className="pl-8 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Nombre</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Tipo</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Alcance</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Vigencia</TableHead>
                                <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Estado</TableHead>
                                <TableHead className="text-right pr-8 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                                            <span className="text-slate-400 italic font-medium">Cargando ofertas...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredPromotions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Tag className="h-12 w-12 text-slate-200 mb-2" />
                                            <p className="text-slate-400 italic font-medium">No hay campañas configuradas.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPromotions.map((promo) => (
                                    <TableRow key={promo.id} className="group border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <TableCell className="pl-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-white">{promo.name}</span>
                                                <span className="text-xs text-slate-400 italic mt-0.5 line-clamp-1">{promo.description || 'Sin descripción'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <Badge variant="secondary" className="max-w-fit rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none font-bold italic text-[10px]">
                                                    {typeLabels[promo.type]}
                                                </Badge>
                                                {promo.min_orders_required > 0 && (
                                                    <Badge variant="outline" className="max-w-fit rounded-lg border-amber-500/50 text-amber-600 bg-amber-50 dark:bg-amber-950/20 text-[9px] font-black italic px-2 py-0">
                                                        💎 FIDELIDAD ({promo.min_orders_required}+)
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold uppercase text-slate-500">{promo.target_type}</span>
                                                {promo.target_id && (
                                                    <Badge className="bg-primary/10 text-primary border-none text-[9px] uppercase font-black">
                                                        {promo.target_id}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-[11px] text-slate-500 font-medium">
                                                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                                    <Calendar size={10} />
                                                    {format(new Date(promo.start_date), 'dd MMM yyyy', { locale: es })}
                                                </div>
                                                {promo.end_date && (
                                                    <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                                                        <ChevronRight size={10} />
                                                        {format(new Date(promo.end_date), 'dd MMM yyyy', { locale: es })}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {promo.is_active ? (
                                                <div className="flex items-center gap-1.5 text-emerald-500 font-bold italic text-xs uppercase tracking-tighter">
                                                    <CheckCircle2 size={14} /> Activa
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-slate-300 dark:text-slate-700 font-bold italic text-xs uppercase tracking-tighter">
                                                    <XCircle size={14} /> Pausada
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-xl hover:bg-white dark:hover:bg-slate-800 shadow-sm"
                                                    onClick={() => handleOpenDialog(promo)}
                                                >
                                                    <Edit2 size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950 shadow-sm group/del"
                                                    onClick={() => handleDelete(promo.id)}
                                                >
                                                    <Trash2 size={16} className="text-slate-400 group-hover/del:text-rose-500 transition-colors" />
                                                </Button>
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
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl max-h-[95vh] flex flex-col">
                    <form onSubmit={handleSave} className="flex flex-col max-h-[95vh]">
                        <DialogHeader className="px-8 pt-8 pb-4 shrink-0">
                            <DialogTitle className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3">
                                <div className="p-2 rounded-2xl bg-primary/10 text-primary">
                                    <Tag size={24} />
                                </div>
                                {editingPromo ? 'Editar Campaña' : 'Nueva Campaña'}
                            </DialogTitle>
                            <DialogDescription className="italic font-medium">
                                Configura las reglas de descuento y vigencia de la oferta.
                            </DialogDescription>
                        </DialogHeader>

                        <ScrollArea className="flex-1 px-8 min-h-0">
                            <div className="grid grid-cols-2 gap-6 py-4 pb-8">
                                <div className="space-y-2 col-span-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Nombre de la Campaña</Label>
                                    <Input
                                        placeholder="Ej: Oferta San Valentín 2x1"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-4"
                                        required
                                    />
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Descripción</Label>
                                    <Input
                                        placeholder="Detalles internos de la oferta..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-4"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Tipo de Oferta</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(val: any) => setFormData({ ...formData, type: val })}
                                    >
                                        <SelectTrigger className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none shadow-none">
                                            <SelectValue placeholder="Seleccionar tipo" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                                            <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                                            <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
                                            <SelectItem value="bogo">2x1 (BOGO)</SelectItem>
                                            <SelectItem value="second_unit_50">50% 2da Unidad</SelectItem>
                                            <SelectItem value="gift">Obsequio / Regalo</SelectItem>
                                            <SelectItem value="loyalty_reward">Premio Fidelidad (Saldo)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                        {formData.type === 'gift' ? 'Producto de Obsequio' : 'Valor / Descuento'}
                                    </Label>
                                    {formData.type === 'gift' ? (
                                        <Select
                                            value={formData.reward_product_id}
                                            onValueChange={val => setFormData({ ...formData, reward_product_id: val })}
                                        >
                                            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none shadow-none">
                                                <SelectValue placeholder="Elegir producto" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-60 rounded-2xl border-none shadow-2xl">
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            type="number"
                                            disabled={formData.type === 'bogo' || formData.type === 'second_unit_50'}
                                            value={formData.value}
                                            onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                                            className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-4"
                                        />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Alcance (Target)</Label>
                                    <Select
                                        value={formData.target_type}
                                        onValueChange={(val: any) => setFormData({ ...formData, target_type: val, target_id: '' })}
                                    >
                                        <SelectTrigger className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none shadow-none">
                                            <SelectValue placeholder="Seleccionar alcance" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                                            <SelectItem value="all">Toda la Tienda</SelectItem>
                                            <SelectItem value="category">Categoría</SelectItem>
                                            <SelectItem value="product">Producto Específico</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">ID del Target (Nombre Cat / ID Prod)</Label>
                                    <Input
                                        disabled={formData.target_type === 'all'}
                                        value={formData.target_id}
                                        onChange={e => setFormData({ ...formData, target_id: e.target.value })}
                                        className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-4"
                                        placeholder={formData.target_type === 'category' ? 'Ej: "ropa"' : 'ID Producto'}
                                    />
                                </div>

                                {/* LOYALTY SECTION */}
                                <div className="col-span-2 space-y-4 p-5 rounded-[2rem] bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 flex items-center gap-2">
                                        💎 Configuración de Fidelidad (Opcional)
                                    </Label>
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-slate-400">Mínimo de Compras</Label>
                                            <Input
                                                type="number"
                                                value={formData.min_orders_required}
                                                onChange={e => setFormData({ ...formData, min_orders_required: parseInt(e.target.value) })}
                                                className="h-10 rounded-xl bg-white dark:bg-slate-950"
                                                placeholder="5 para descuento, 10 para regalo..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold uppercase text-slate-400">Valor Mín. por Pedido ($)</Label>
                                            <Input
                                                type="number"
                                                value={formData.min_order_value_condition}
                                                onChange={e => setFormData({ ...formData, min_order_value_condition: parseFloat(e.target.value) })}
                                                className="h-10 rounded-xl bg-white dark:bg-slate-950"
                                                placeholder="Ej: 50"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-amber-700/60 dark:text-amber-500/50 italic leading-tight">
                                        Estas condiciones limitan la oferta a clientes recurrentes. Si el tipo es "Obsequio", se recomienda 10 compras con valor mínimo.
                                    </p>
                                </div>

                                <div className="space-y-2 text-slate-600">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Fecha de Inicio</Label>
                                    <Input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                        className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-4"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Fecha de Fin (Opcional)</Label>
                                    <Input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                        className="h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none px-4"
                                    />
                                </div>

                                <div className="col-span-2 p-4 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-bold">Estado de la Campaña</Label>
                                        <p className="text-[10px] text-slate-400 italic">Activar o pausar inmediatamente.</p>
                                    </div>
                                    <Switch
                                        checked={formData.is_active}
                                        onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
                                    />
                                </div>
                            </div>
                        </ScrollArea>

                        <DialogFooter className="px-8 py-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 sm:justify-end gap-3 rounded-b-[2rem]">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsDialogOpen(false)}
                                className="rounded-2xl font-bold h-12 px-6"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 h-12 px-8 font-bold uppercase text-xs tracking-widest transition-transform hover:scale-[1.02]"
                            >
                                {saving ? <Loader2 className="animate-spin" size={18} /> : (editingPromo ? 'Guardar Cambios' : 'Crear Campaña')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* INFO PANEL */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-[2rem] shadow-xl shadow-emerald-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-black italic uppercase tracking-tighter">Motor de Descuentos</CardTitle>
                        <Info size={20} className="opacity-50" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs font-medium opacity-90 leading-relaxed italic">
                            Los descuentos se calculan en tiempo real en el carrito. El sistema suma el precio base + personalizaciones y aplica la oferta más ventajosa.
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none bg-slate-900 text-white rounded-[2rem] shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-black italic uppercase tracking-tighter">Prioridad de Ofertas</CardTitle>
                        <ChevronRight size={20} className="opacity-50" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs font-medium opacity-90 leading-relaxed italic">
                            Si un producto tiene múltiples ofertas, el motor prioriza las de "Producto Específico", luego "Categoría" y finalmente "Toda la Tienda".
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-black italic uppercase tracking-tighter text-slate-800 dark:text-slate-200">Próxima Mejora</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cupones de Descuento (Próximamente)</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
