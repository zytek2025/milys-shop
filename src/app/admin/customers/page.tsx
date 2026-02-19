'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Mail,
    TrendingUp,
    UserPlus,
    MoreVertical,
    Clock,
    DollarSign,
    Filter,
    Edit3,
    Loader2,
    Trash2,
    Save
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CustomerLead {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    crm_status: string;
    segment: string;
    ltv: number;
    aov: number;
    orderCount: number;
    totalItemsCount: number;
    favoriteProducts: string[];
    returnsRatio: number;
    store_credit: number;
    control_id: string;
    marketing_consent: boolean;
    marketing_segment: string;
    last_marketing_contact: string | null;
    lastActive: string;
    full_history: any[];
    age?: number;
    city?: string;
    gender?: string;
    whatsapp?: string;
    notes?: string;
}

export default function AdminCRMPage() {
    const [leads, setLeads] = useState<CustomerLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [updating, setUpdating] = useState<string | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerLead | null>(null);
    const [viewDetailsOpen, setViewDetailsOpen] = useState(false);

    const [newCustomer, setNewCustomer] = useState({
        full_name: '',
        email: '',
        password: 'mily' + Math.floor(Math.random() * 1000)
    });

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/crm');
            const data = await res.json();
            if (res.ok) setLeads(data);
        } catch (error) {
            toast.error('Error al cargar clientes');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (userId: string, status: string) => {
        try {
            const res = await fetch('/api/admin/crm', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, crm_status: status }),
            });
            if (res.ok) {
                toast.success('Estado actualizado');
                setLeads(leads.map(l => l.id === userId ? { ...l, crm_status: status } : l));
            } else {
                throw new Error();
            }
        } catch (error) {
            toast.error('Error al actualizar estado');
        }
    };

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating('creating');
        try {
            const res = await fetch('/api/admin/crm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCustomer),
            });

            if (res.ok) {
                toast.success('Cliente creado correctamente');
                setAddModalOpen(false);
                setNewCustomer({ full_name: '', email: '', password: 'mily' + Math.floor(Math.random() * 1000) });
                fetchLeads();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Error al crear cliente');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setUpdating(null);
        }
    };

    const handleUpdateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer) return;

        setUpdating(selectedCustomer.id);
        try {
            const body: any = {
                userId: selectedCustomer.id,
                full_name: selectedCustomer.full_name,
                email: selectedCustomer.email,
                whatsapp: selectedCustomer.whatsapp || '',
                age: selectedCustomer.age || null,
                city: selectedCustomer.city || '',
                gender: selectedCustomer.gender || '',
                notes: selectedCustomer.notes || '',
            };
            // Only send password if filled
            if ((selectedCustomer as any).new_password) {
                body.password = (selectedCustomer as any).new_password;
            }
            const res = await fetch('/api/admin/crm', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast.success('Datos actualizados');
                setLeads(leads.map(l => l.id === selectedCustomer.id ? selectedCustomer! : l));
                setEditModalOpen(false);
            } else {
                const data = await res.json();
                toast.error(data.error || 'Error al actualizar');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setUpdating(null);
        }
    };

    const handleDeleteCustomer = async (userId: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este cliente? Se eliminará su cuenta de acceso y todo su historial. Esta acción no se puede deshacer.')) return;

        setUpdating(userId);
        try {
            const res = await fetch(`/api/admin/crm?id=${userId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('Cliente eliminado');
                setLeads(leads.filter(l => l.id !== userId));
            } else {
                const data = await res.json();
                toast.error(data.error || 'Error al eliminar');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setUpdating(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'vip': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'cliente': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'lead': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'inactivo': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getSegmentStyles = (segment: string) => {
        switch (segment) {
            case 'Champion': return 'bg-purple-100 text-purple-700 border-purple-200 font-bold';
            case 'Loyal': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'New Customer': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Interested': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-slate-100 text-slate-500 border-slate-200';
        }
    };

    const filteredLeads = leads.filter(l => {
        const matchesSearch = l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || l.crm_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        totalLeads: leads.length,
        totalCustomers: leads.filter(l => l.orderCount > 0).length,
        potentialValue: leads.reduce((sum, l) => sum + l.ltv, 0)
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">CRM Clientes</h1>
                    <p className="text-muted-foreground">Seguimiento y gestión de clientes registrados.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        className="rounded-xl gap-2 font-black italic uppercase tracking-tighter"
                        onClick={() => setAddModalOpen(true)}
                    >
                        <UserPlus size={16} />
                        Nuevo Cliente
                    </Button>
                    <Button variant="outline" className="rounded-xl gap-2 font-bold" onClick={fetchLeads}>
                        <Clock size={16} />
                        Actualizar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm bg-blue-50/50 dark:bg-blue-900/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Registrados</p>
                                <h3 className="text-2xl font-bold">{stats.totalLeads}</h3>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                <Users size={20} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-emerald-50/50 dark:bg-emerald-900/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Clientes Activos</p>
                                <h3 className="text-2xl font-bold">{stats.totalCustomers}</h3>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <UserPlus size={20} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-amber-50/50 dark:bg-amber-900/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Valor Total (LTV)</p>
                                <h3 className="text-2xl font-bold">${stats.potentialValue.toFixed(2)}</h3>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                <TrendingUp size={20} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex flex-1 items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Nombre o email..."
                                className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter size={16} className="text-muted-foreground" />
                            <select
                                className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none px-3 text-sm outline-none"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Todos los estados</option>
                                <option value="lead">Lead</option>
                                <option value="cliente">Cliente</option>
                                <option value="vip">VIP</option>
                                <option value="inactivo">Inactivo</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                    <TableHead>ID</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>KPI Segmento</TableHead>
                                    <TableHead>LTV (Valor)</TableHead>
                                    <TableHead>Principal Compra</TableHead>
                                    <TableHead>Pedidos</TableHead>
                                    <TableHead>Saldo Disp.</TableHead>
                                    <TableHead>Últ. Actividad</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                                <span>Cargando datos CRM...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLeads.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                            No se encontraron clientes.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLeads.map((lead) => (
                                        <TableRow key={lead.id} className="group border-slate-100 dark:border-slate-800">
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-[10px] bg-slate-50">
                                                    {lead.control_id || '---'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden text-xs">
                                                        {lead.avatar_url ? <img src={lead.avatar_url} alt="" className="h-full w-full object-cover" /> : <Users size={16} />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm">{lead.full_name || 'Sin nombre'}</span>
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Mail size={10} /> {lead.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn("rounded-full px-2 py-0 border capitalize font-normal text-[10px]", getStatusColor(lead.crm_status))}>
                                                    {lead.crm_status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn("text-[9px] uppercase tracking-tight", getSegmentStyles(lead.segment))}>
                                                    {lead.segment}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                                                ${lead.ltv.toFixed(2)}
                                                {lead.aov > 0 && <p className="text-[9px] font-normal text-muted-foreground italic">TP: ${lead.aov.toFixed(2)}</p>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    {lead.favoriteProducts?.slice(0, 1).map((p, i) => (
                                                        <span key={i} className="text-[10px] font-medium truncate max-w-[120px]">{p}</span>
                                                    ))}
                                                    {lead.returnsRatio > 0 && (
                                                        <span className="text-[8px] text-rose-500 font-bold uppercase">Devolución: {lead.returnsRatio.toFixed(0)}%</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs text-muted-foreground">{lead.orderCount} pedidos</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="rounded-lg bg-emerald-50 text-emerald-700 border-emerald-100 font-bold">
                                                    ${(lead.store_credit || 0).toFixed(2)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {format(new Date(lead.lastActive), 'd MMM, yyyy', { locale: es })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                            <MoreVertical size={16} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl">
                                                        <DropdownMenuItem className="gap-2 font-bold text-primary" onClick={() => { setSelectedCustomer(lead); setViewDetailsOpen(true); }}>
                                                            <TrendingUp size={14} /> Ver Insights & Historial
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="gap-2" onClick={() => { setSelectedCustomer(lead); setEditModalOpen(true); }}>
                                                            <Edit3 size={14} /> Modificar Datos
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateStatus(lead.id, 'lead')}>Cambiar a Lead</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateStatus(lead.id, 'cliente')}>Cambiar a Cliente</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateStatus(lead.id, 'vip')}>Cambiar a VIP</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateStatus(lead.id, 'inactivo')}>Cambiar a Inactivo</DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive gap-2"
                                                            onClick={() => handleDeleteCustomer(lead.id)}
                                                            disabled={updating === lead.id}
                                                        >
                                                            {updating === lead.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                            Eliminar Cliente
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
                <DialogContent className="sm:max-w-[600px] rounded-[2rem] border-2 max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-2">
                            <TrendingUp className="text-primary" /> Insights del Cliente
                        </DialogTitle>
                        <DialogDescription>Perfil de comportamiento y KPI de ventas.</DialogDescription>
                    </DialogHeader>

                    {selectedCustomer && (
                        <div className="space-y-6 py-4">
                            <div className="bg-slate-50 p-3 rounded-2xl border grid grid-cols-3 gap-2">
                                <div className="text-center">
                                    <p className="text-[9px] font-black uppercase text-muted-foreground">Edad</p>
                                    <p className="text-xs font-bold leading-tight">{selectedCustomer.age || 'N/A'}</p>
                                </div>
                                <div className="text-center border-l-2 border-slate-200">
                                    <p className="text-[9px] font-black uppercase text-muted-foreground">Ciudad</p>
                                    <p className="text-xs font-bold leading-tight truncate">{selectedCustomer.city || 'N/A'}</p>
                                </div>
                                <div className="text-center border-l-2 border-slate-200">
                                    <p className="text-[9px] font-black uppercase text-muted-foreground">Género</p>
                                    <p className="text-xs font-bold leading-tight capitalize">{selectedCustomer.gender || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Stats Summary */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 p-3 rounded-2xl border flex flex-col items-center justify-center">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground">Ticket Avg.</p>
                                    <p className="text-lg font-black">${selectedCustomer.aov.toFixed(2)}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl border flex flex-col items-center justify-center">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground">Artículos</p>
                                    <p className="text-lg font-black">{selectedCustomer.totalItemsCount || 0}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl border flex flex-col items-center justify-center">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground">Return Rate</p>
                                    <p className={cn("text-lg font-black", selectedCustomer.returnsRatio > 20 ? "text-rose-500" : "text-emerald-500")}>
                                        {selectedCustomer.returnsRatio.toFixed(0)}%
                                    </p>
                                </div>
                            </div>

                            {/* Behavioral Insights */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    Favoritos <span className="h-px bg-primary/10 flex-1"></span>
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedCustomer.favoriteProducts?.length > 0 ? selectedCustomer.favoriteProducts.map((p, i) => (
                                        <Badge key={i} variant="outline" className="bg-primary/5 border-primary/20 text-primary rounded-xl px-3 py-1 font-bold italic">
                                            {p}
                                        </Badge>
                                    )) : <span className="text-xs text-muted-foreground italic">Sin compras registradas aún.</span>}
                                </div>
                            </div>

                            {/* Order Timeline */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    Historial de Pedidos <span className="h-px bg-primary/10 flex-1"></span>
                                </h4>
                                <div className="space-y-3">
                                    {selectedCustomer.full_history?.map((order: any, idx: number) => (
                                        <div key={idx} className="flex gap-4 items-start relative pb-4 last:pb-0 border-l-2 border-slate-100 pl-4 ml-2">
                                            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-white border-2 border-primary" />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-xs font-black uppercase italic tracking-tighter">Pedido #{order.id.slice(0, 8)}</p>
                                                    <Badge variant="outline" className="text-[8px] font-bold uppercase">{order.status}</Badge>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <p className="text-[10px] text-muted-foreground">{format(new Date(order.created_at), "d 'de' MMMM, yyyy", { locale: es })}</p>
                                                    <p className="font-black text-sm text-primary">${order.total?.toFixed(2)}</p>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {order.order_items?.map((item: any, i: number) => (
                                                        <span key={i} className="text-[9px] bg-slate-50 px-1.5 py-0.5 rounded border">
                                                            x{item.quantity} {item.product_name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button className="w-full rounded-xl" onClick={() => setViewDetailsOpen(false)}>Cerrar Reporte</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-2 max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleUpdateCustomer}>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black italic uppercase tracking-tight">Modificar Cliente</DialogTitle>
                            <DialogDescription className="text-[11px] text-muted-foreground">
                                ID: <span className="font-mono font-bold">{selectedCustomer?.control_id}</span>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-3 py-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Nombre Completo</Label>
                                    <Input
                                        className="rounded-xl border-2 h-10"
                                        value={selectedCustomer?.full_name || ''}
                                        onChange={(e) => setSelectedCustomer(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">WhatsApp</Label>
                                    <Input
                                        className="rounded-xl border-2 h-10"
                                        placeholder="+58412..."
                                        value={selectedCustomer?.whatsapp || ''}
                                        onChange={(e) => setSelectedCustomer(prev => prev ? { ...prev, whatsapp: e.target.value } : null)}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Correo Electrónico</Label>
                                <Input
                                    type="email"
                                    className="rounded-xl border-2 h-10"
                                    value={selectedCustomer?.email || ''}
                                    onChange={(e) => setSelectedCustomer(prev => prev ? { ...prev, email: e.target.value } : null)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="grid gap-2">
                                    <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Edad</Label>
                                    <Input
                                        type="number"
                                        className="rounded-xl border-2 h-10"
                                        placeholder="25"
                                        value={selectedCustomer?.age || ''}
                                        onChange={(e) => setSelectedCustomer(prev => prev ? { ...prev, age: parseInt(e.target.value) || undefined } : null)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Ciudad</Label>
                                    <Input
                                        className="rounded-xl border-2 h-10"
                                        placeholder="Caracas"
                                        value={selectedCustomer?.city || ''}
                                        onChange={(e) => setSelectedCustomer(prev => prev ? { ...prev, city: e.target.value } : null)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Género</Label>
                                    <select
                                        className="rounded-xl border-2 h-10 px-3 text-sm bg-background outline-none focus:ring-2"
                                        value={selectedCustomer?.gender || ''}
                                        onChange={(e) => setSelectedCustomer(prev => prev ? { ...prev, gender: e.target.value } : null)}
                                    >
                                        <option value="">-</option>
                                        <option value="masculino">Masculino</option>
                                        <option value="femenino">Femenino</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Notas Internas</Label>
                                <textarea
                                    className="rounded-xl border-2 p-3 text-sm bg-background outline-none focus:ring-2 min-h-[70px] resize-none"
                                    placeholder="Observaciones sobre el cliente..."
                                    value={selectedCustomer?.notes || ''}
                                    onChange={(e) => setSelectedCustomer(prev => prev ? { ...prev, notes: e.target.value } : null)}
                                />
                            </div>
                            <div className="grid gap-2 border-t pt-3">
                                <Label className="font-black uppercase text-[10px] tracking-widest text-amber-600">🔑 Nueva Contraseña (opcional)</Label>
                                <Input
                                    type="password"
                                    className="rounded-xl border-2 h-10 border-amber-200"
                                    placeholder="Dejar vacío para no cambiar"
                                    onChange={(e) => setSelectedCustomer(prev => prev ? { ...prev, new_password: e.target.value } as any : null)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="submit"
                                className="w-full font-black italic uppercase tracking-wider rounded-xl h-11"
                                disabled={!!updating}
                            >
                                {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-2">
                    <form onSubmit={handleCreateCustomer}>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black italic uppercase tracking-tight">Nuevo Cliente</DialogTitle>
                            <DialogDescription>Crea una nueva cuenta de cliente manualmente.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-6">
                            <div className="grid gap-2">
                                <Label htmlFor="add-name" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Nombre Completo</Label>
                                <Input
                                    id="add-name"
                                    className="rounded-xl border-2 h-11"
                                    value={newCustomer.full_name}
                                    onChange={(e) => setNewCustomer(prev => ({ ...prev, full_name: e.target.value }))}
                                    placeholder="Juan Pérez"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="add-email" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Correo Electrónico</Label>
                                <Input
                                    id="add-email"
                                    type="email"
                                    className="rounded-xl border-2 h-11"
                                    value={newCustomer.email}
                                    onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="juan@ejemplo.com"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="add-pass" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Contraseña Temporal</Label>
                                <Input
                                    id="add-pass"
                                    className="rounded-xl border-2 h-11"
                                    value={newCustomer.password}
                                    onChange={(e) => setNewCustomer(prev => ({ ...prev, password: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="submit"
                                className="w-full font-black italic uppercase tracking-wider rounded-xl h-11"
                                disabled={!!updating}
                            >
                                {updating === 'creating' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                Crear Cliente
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
