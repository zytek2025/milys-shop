'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, User as UserIcon, Loader2, Save, Trash2, ShieldCheck, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { UserProfile } from '@/types';
import { useAuth } from '@/store/cart-store';

export default function AdminUsersPage() {
    const { is_super_admin } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

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

    const handleToggleAdmin = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        setUpdating(userId);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: userId,
                    role: newRole
                })
            });

            if (res.ok) {
                toast.success(`Usuario cambiado a ${newRole}`);
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
            } else {
                const data = await res.json();
                toast.error(data.error || 'Error al actualizar rol');
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
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">Gestión de Usuarios</h1>
                <p className="text-muted-foreground font-medium">Administra los accesos y permisos del personal de la tienda.</p>
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
                                {!user.is_super_admin && (
                                    <Button
                                        variant={user.role === 'admin' ? "destructive" : "default"}
                                        size="sm"
                                        className="font-black italic uppercase tracking-wider"
                                        onClick={() => handleToggleAdmin(user.id, user.role || 'user')}
                                        disabled={updating === user.id}
                                    >
                                        {user.role === 'admin' ? 'Quitar Admin' : 'Hacer Admin'}
                                    </Button>
                                )}
                                {updating === user.id && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Granular Permissions Section */}
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
