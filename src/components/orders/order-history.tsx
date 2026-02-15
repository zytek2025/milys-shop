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
  Truck
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import type { OrderWithItems } from '@/types';

interface OrderHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: Clock
  },
  processing: {
    label: 'Processing',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    icon: Truck
  },
  completed: {
    label: 'Completed',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: CheckCircle
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: XCircle
  },
};

export function OrderHistory({ open, onOpenChange }: OrderHistoryProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);

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
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-emerald-600" />
            Order History
          </DialogTitle>
          <DialogDescription>
            View your past orders and their status
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">No orders yet</p>
            <p className="text-sm text-muted-foreground">
              Your order history will appear here
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-4">
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
                      className="border rounded-lg p-4 hover:border-emerald-500/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <StatusIcon className={`h-5 w-5 ${order.status === 'completed' ? 'text-emerald-600' :
                                order.status === 'cancelled' ? 'text-red-600' :
                                  'text-yellow-600'
                              }`} />
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
                        <span className="font-semibold">${order.total.toFixed(2)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          </ScrollArea>
        )}

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
