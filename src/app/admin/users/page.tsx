'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Shield,
    User as UserIcon,
    Loader2,
    Save,
    Trash2,
    ShieldCheck,
    Mail,
    Plus,
    Key,
    UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { UserProfile } from '@/types';
import { useAuth } from '@/store/cart-store';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function AdminUsersPage() {
    const { is_super_admin, user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newStaff, setNewStaff] = useState({
        email: '',
        password: '',
        full_name: '',
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (res.ok) {
                setUsers(data);
            } else {
                toast.error(data.error || 'Error al cargar usuarios');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating('creating');
        try {
            const res = await fetch('/api/admin/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStaff)
            });

            if (res.ok) {
                toast.success('Miembro del staff creado correctamente');
                setIsAddModalOpen(false);
                setNewStaff({ email: '', password: '', full_name: '' });
                fetchUsers();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Error al crear usuario');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setUpdating(null);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) return;

        setUpdating(userId);
        try {
            const res = await fetch(`/api/admin/users?id=${userId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('Usuario eliminado');
                setUsers(users.filter(u => u.id !== userId));
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

    const handleTogglePermission = async (userId: string, permissionKey: string, value: boolean) => {
        const userToUpdate = users.find(u => u.id === userId);
        if (!userToUpdate) return;

        const newPermissions = {
            ...(userToUpdate.permissions || {
                can_manage_prices: false,
                can_view_metrics: false,
                can_manage_users: false,
                can_manage_designs: false,
                can_view_settings: false,
            }),
            [permissionKey]: value
        };

        setUpdating(userId);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: userId,
                    permissions: newPermissions
                })
            });

            if (res.ok) {
                toast.success('Permisos actualizados');
                setUsers(users.map(u => u.id === userId ? { ...u, permissions: newPermissions } : u));
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

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter">Personal del Sistema</h1>
                    <p className="text-muted-foreground font-medium">Gestiona las cuentas y permisos de los administradores.</p>
                </div>

                {is_super_admin && (
                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="font-black italic uppercase tracking-wider gap-2 h-12 rounded-2xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                                <Plus size={18} />
                                Nuevo Miembro
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-2">
                            <form onSubmit={handleCreateStaff}>
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black italic uppercase tracking-tight">Agregar Staff</DialogTitle>
                                    <DialogDescription className="font-medium text-muted-foreground">
                                        Crea una nueva cuenta de administrador. Podrás configurar sus permisos después.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Nombre Completo</Label>
                                        <Input
                                            id="name"
                                            placeholder="Vanessa Pérez"
                                            className="rounded-xl border-2 h-11"
                                            value={newStaff.full_name}
                                            onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Correo Electrónico</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="vanessa@example.com"
                                            className="rounded-xl border-2 h-11"
                                            value={newStaff.email}
                                            onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="pass" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Contraseña Inicial</Label>
                                        <Input
                                            id="pass"
                                            type="password"
                                            placeholder="••••••••"
                                            className="rounded-xl border-2 h-11"
                                            value={newStaff.password}
                                            onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="submit"
                                        className="w-full font-black italic uppercase tracking-wider rounded-xl h-11"
                                        disabled={updating === 'creating'}
                                    >
                                        {updating === 'creating' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                        Crear Cuenta
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid gap-6">
                {users.map((user) => (
                    <Card key={user.id} className="border-2 shadow-xl bg-white dark:bg-slate-900 overflow-hidden rounded-[2rem]">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary relative">
                                    {user.is_super_admin ? <ShieldCheck className="h-8 w-8 text-emerald-500" /> : <UserIcon className="h-8 w-8" />}
                                    {user.role === 'admin' && (
                                        <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center border-2 border-white dark:border-slate-900">
                                            <Shield className="h-3 w-3 text-white" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-xl font-black tracking-tight italic">{user.full_name || 'Usuario Sin Nombre'}</CardTitle>
                                        {user.is_super_admin && <Badge className="bg-emerald-500 text-white font-bold uppercase text-[10px]">Super Admin</Badge>}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                                        <Mail size={14} /> {user.email}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {is_super_admin && !user.is_super_admin && (
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="rounded-xl h-10 w-10 shadow-lg shadow-destructive/20"
                                        onClick={() => handleDeleteUser(user.id)}
                                        disabled={updating === user.id}
                                    >
                                        {updating === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="flex flex-col gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Shield size={14} className="text-primary" /> Permisos de Gestión
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor={`prices-${user.id}`} className="font-bold cursor-pointer">Gestionar Precios</Label>
                                            <Switch
                                                id={`prices-${user.id}`}
                                                checked={user.permissions?.can_manage_prices || false}
                                                disabled={user.is_super_admin || updating === user.id}
                                                onCheckedChange={(v) => handleTogglePermission(user.id, 'can_manage_prices', v)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor={`metrics-${user.id}`} className="font-bold cursor-pointer">Ver Ventas/Ingresos</Label>
                                            <Switch
                                                id={`metrics-${user.id}`}
                                                checked={user.permissions?.can_view_metrics || false}
                                                disabled={user.is_super_admin || updating === user.id}
                                                onCheckedChange={(v) => handleTogglePermission(user.id, 'can_view_metrics', v)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Shield size={14} className="text-primary" /> Sistema y Diseño
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor={`designs-${user.id}`} className="font-bold cursor-pointer">Gestionar Diseños</Label>
                                            <Switch
                                                id={`designs-${user.id}`}
                                                checked={user.permissions?.can_manage_designs || false}
                                                disabled={user.is_super_admin || updating === user.id}
                                                onCheckedChange={(v) => handleTogglePermission(user.id, 'can_manage_designs', v)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor={`settings-${user.id}`} className="font-bold cursor-pointer">Acceso a Ajustes</Label>
                                            <Switch
                                                id={`settings-${user.id}`}
                                                checked={user.permissions?.can_view_settings || false}
                                                disabled={user.is_super_admin || updating === user.id}
                                                onCheckedChange={(v) => handleTogglePermission(user.id, 'can_view_settings', v)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Shield size={14} className="text-primary" /> Administración
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor={`users-${user.id}`} className="font-bold cursor-pointer">Gestionar Usuarios</Label>
                                            <Switch
                                                id={`users-${user.id}`}
                                                checked={user.permissions?.can_manage_users || false}
                                                disabled={user.is_super_admin || updating === user.id}
                                                onCheckedChange={(v) => handleTogglePermission(user.id, 'can_manage_users', v)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
