'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Package,
  Loader2,
  ChevronRight,
  ShoppingBag,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Wallet,
  Settings,
  Bell,
  Trash2,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { useUser, useUpdateProfile, useRequestAccountDeletion, useLogout } from '@/hooks/use-auth';
import type { OrderWithItems } from '@/types';
import { toast } from 'sonner';

import { PriceDisplay } from '@/components/store-settings-provider';

interface OrderHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig = {
  pending: {
    label: 'Pendiente',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: Clock
  },
  processing: {
    label: 'Procesando',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    icon: Truck
  },
  completed: {
    label: 'Completado',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: CheckCircle
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: XCircle
  },
  quote: {
    label: 'Cotización',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    icon: Clock
  },
  evaluating: {
    label: 'Verificando',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    icon: Clock
  },
};

export function OrderHistory({ open, onOpenChange }: OrderHistoryProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const { data: user } = useUser();
  const updateProfile = useUpdateProfile();
  const requestDeletion = useRequestAccountDeletion();
  const logout = useLogout();

  const handleDeleteAccount = async () => {
    try {
      await requestDeletion.mutateAsync();
      toast.success('Solicitud de baja recibida. Tu cuenta será desactivada.');
      onOpenChange(false);
      logout.mutate();
    } catch (error) {
      toast.error('Error al procesar la solicitud');
    }
  };

  const { data: orders, isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-emerald-600" />
              Historial de Pedidos
            </div>
            {user?.balance !== undefined && user.balance > 0 && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5 px-3 py-1 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Saldo a favor: ${user.balance.toFixed(2)}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Consulta tus pedidos anteriores y su estado actual
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800">
            <TabsTrigger value="orders" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 flex items-center gap-2 text-xs font-black uppercase italic tracking-wider">
              <Package size={14} /> Mis Pedidos
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 flex items-center gap-2 text-xs font-black uppercase italic tracking-wider">
              <Settings size={14} /> Ajustes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !orders || orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">Aún no tienes pedidos</p>
                <p className="text-sm text-muted-foreground">
                  Tu historial de compras aparecerá aquí
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[50vh] pr-4">
                <AnimatePresence>
                  <div className="space-y-4">
                    {orders.map((order, index) => {
                      const status = statusConfig[order.status];
                      const StatusIcon = status.icon;

                      return (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                          className="border rounded-lg p-4 hover:border-emerald-500/50 transition-colors cursor-pointer bg-white dark:bg-slate-900/50"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-emerald-600">
                                <StatusIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  Order #{order.id.slice(0, 8)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(order.created_at), 'MMM d, yyyy • h:mm a')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={status.color}>
                                {status.label}
                              </Badge>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                            </span>
                            <span className="font-semibold text-emerald-600">
                              <PriceDisplay amount={order.total} />
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </AnimatePresence>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <ScrollArea className="max-h-[50vh] pr-4">
              <div className="space-y-6 pb-2">
                {/* Marketing Consent */}
                <div className="p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-emerald-500" />
                        <h4 className="text-sm font-black uppercase italic tracking-tight">Notificaciones VIP</h4>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-medium italic leading-tight">
                        Recibe ofertas exclusivas, novedades y promociones de Mily's Shop por WhatsApp y Email.
                      </p>
                    </div>
                    <Switch
                      checked={user?.marketing_consent !== false}
                      onCheckedChange={(checked) => {
                        updateProfile.mutate({ marketing_consent: checked });
                        toast.success(checked ? 'Suscrito a promociones' : 'Te has dado de baja de las promociones');
                      }}
                    />
                  </div>
                </div>

                {/* Account Deletion */}
                <div className="p-4 rounded-2xl border-2 border-rose-100/50 dark:border-rose-900/20 bg-rose-50/20 dark:bg-rose-950/5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-rose-600">
                        <Trash2 className="h-4 w-4" />
                        <h4 className="text-sm font-black uppercase italic tracking-tight">Darme de baja</h4>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-medium italic leading-tight">
                        Al solicitar la baja, tu perfil será desactivado y tus datos marcados para eliminación total. Esta acción no se puede deshacer.
                      </p>
                    </div>
                  </div>

                  {user?.deletion_requested_at ? (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      <p className="text-[10px] font-bold text-amber-700 uppercase italic">
                        Baja solicitada el {format(new Date(user.deletion_requested_at), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-10 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white transition-all text-[10px] font-black uppercase italic tracking-wider"
                        >
                          SOLICITAR ELIMINACIÓN DE CUENTA
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción marcará tu cuenta para eliminación. Perderás el acceso a tu historial de pedidos y cualquier saldo a favor pendiente. Nuestro equipo procesará la eliminación total en las próximas 48 horas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            className="bg-rose-600 hover:bg-rose-700 text-white"
                          >
                            Sí, deseo darme de baja
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                <div className="pt-4 flex flex-col items-center gap-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 text-center">
                    ID de Usuario: <span className="opacity-70">{user?.id}</span>
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => logout.mutate()}
                    className="text-muted-foreground hover:text-rose-600 text-[10px] font-black uppercase italic tracking-widest"
                  >
                    Deseo cerrar sesión temporalmente
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Order Detail Modal */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Order #{selectedOrder?.id.slice(0, 8)}</span>
                {selectedOrder && (
                  <Badge className={statusConfig[selectedOrder.status].color}>
                    {statusConfig[selectedOrder.status].label}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {selectedOrder && format(new Date(selectedOrder.created_at), 'MMMM d, yyyy at h:mm a')}
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {selectedOrder.items?.map((item) => {
                    const metadata = (item.custom_metadata || {}) as any;
                    const isNewFormat = !Array.isArray(metadata) && !!metadata.designs;
                    const designList = (isNewFormat ? metadata.designs : (Array.isArray(metadata) ? metadata : [])) as any[];
                    const personalization = isNewFormat ? metadata.personalization : null;
                    const personalizationText = personalization?.text || (typeof personalization === 'string' ? personalization : null);

                    return (
                      <div key={item.id} className="border-b last:border-0 pb-3 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm capitalize">{item.product_name}</p>
                          <p className="font-semibold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                          <span>${item.price.toFixed(2)} × {item.quantity}</span>
                          {(item.variant?.size || item.variant?.color) && (
                            <span className="text-slate-400">
                              {item.variant.color && <span>{item.variant.color}</span>}
                              {item.variant.color && item.variant.size && <span> / </span>}
                              {item.variant.size && <span>Talla {item.variant.size}</span>}
                            </span>
                          )}
                        </div>

                        {/* Metadata in History */}
                        {(designList.length > 0 || personalizationText) && (
                          <div className="mt-2 space-y-1 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                            {designList.map((d: any, idx: number) => (
                              <div key={idx} className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-primary/40"></span>
                                {d.name} {d.size && <span className="text-[8px] text-slate-400">({d.size})</span>}
                              </div>
                            ))}
                            {personalizationText && (
                              <div className="mt-1 pt-1 border-t border-slate-200 dark:border-slate-800">
                                <p className="text-[8px] uppercase font-black text-primary mb-0.5">Texto:</p>
                                <p className="text-[10px] italic line-clamp-1">"{personalizationText}"</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${selectedOrder.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-emerald-600">Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
