'use client';

import { format } from 'date-fns';
import {
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  ShoppingBag,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OrderWithItems } from '@/types';
import { PriceDisplay } from '@/components/store-settings-provider';

interface OrderDetailProps {
  order: OrderWithItems;
  onBack?: () => void;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400',
    icon: Clock,
    description: 'Your order is being processed'
  },
  processing: {
    label: 'Processing',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400',
    icon: Truck,
    description: 'Your order is being prepared for shipping'
  },
  completed: {
    label: 'Completed',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-400',
    icon: CheckCircle,
    description: 'Your order has been delivered'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400',
    icon: XCircle,
    description: 'Your order has been cancelled'
  },
};

export function OrderDetail({ order, onBack }: OrderDetailProps) {
  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
      )}

      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <StatusIcon className={`h-6 w-6 ${order.status === 'completed' ? 'text-emerald-600' :
                  order.status === 'cancelled' ? 'text-red-600' :
                    'text-yellow-600'
                  }`} />
              </div>
              <div>
                <p>Order #{order.id.slice(0, 8)}</p>
                <p className="text-sm font-normal text-muted-foreground">
                  {format(new Date(order.created_at), 'MMMM d, yyyy at h:mm a')}
                </p>
              </div>
            </CardTitle>
            <Badge className={status.color}>
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{status.description}</p>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items?.map((item) => (
              <div key={item.id} className="border-b last:border-0 py-4 gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {item.product?.image_url ? (
                        <img src={item.product.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm tracking-tight capitalize">{item.product_name}</p>
                      <div className="text-xs text-muted-foreground flex gap-1 items-center">
                        <PriceDisplay amount={item.price} /> × {item.quantity}
                      </div>
                      {(item.variant?.size || item.variant?.color) && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                          {item.variant.color && <span>{item.variant.color}</span>}
                          {item.variant.color && item.variant.size && <span> / </span>}
                          {item.variant.size && <span>Talla {item.variant.size}</span>}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="font-black text-primary">
                    <PriceDisplay amount={item.price * item.quantity} />
                  </div>
                </div>

                {/* Customization Details */}
                {(item.custom_metadata || item.on_request) && (
                  <div className="mt-4 ml-15 space-y-3">
                    {(() => {
                      const metadata = item.custom_metadata as any;
                      const isNewFormat = !Array.isArray(metadata) && (!!metadata?.designs || !!metadata?.budget_request);

                      let designList = (isNewFormat ? (metadata.designs || []) : (Array.isArray(metadata) ? metadata : [])) as any[];

                      // If it's a budget request with multiple designs, use those
                      if (metadata?.budget_request?.designs) {
                        designList = [...designList, ...metadata.budget_request.designs];
                      } else if (metadata?.budget_request?.image_url) {
                        // Fallback for old single image format
                        designList = [...designList, { image_url: metadata.budget_request.image_url }];
                      }

                      const personalization = isNewFormat ? metadata.personalization : null;
                      const personalizationText = personalization?.text || (typeof personalization === 'string' ? personalization : null);
                      const instructions = isNewFormat ? (metadata.instructions || metadata?.budget_request?.notes) : (metadata.instructions || null);

                      return (
                        <>
                          {item.on_request && !isNewFormat && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 text-[10px] font-black uppercase mb-3">
                              Pendiente de Cotización
                            </Badge>
                          )}
                          {designList.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {designList.map((d: any, idx: number) =>
                                <div key={idx} className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-xl flex items-center gap-3">
                                  <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
                                    <img src={d.image_url} className="w-full h-full object-contain" alt="" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex justify-between items-start">
                                      <p className="text-[10px] font-black uppercase truncate">{d.name || 'Diseño de Cliente'}</p>
                                      {d.price > 0 && (
                                        <div className="text-[10px] font-black text-primary ml-2 flex items-center">+<PriceDisplay amount={d.price} className="inline-flex" /></div>
                                      )}
                                    </div>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase">
                                      {d.location || 'Ubicación Pendiente'}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {instructions && (
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <p className="text-[8px] uppercase font-black text-slate-400 tracking-widest mb-1">Instrucciones de Diseño:</p>
                              <p className="text-xs font-medium text-slate-600 leading-relaxed">{instructions}</p>
                            </div>
                          )}
                          {personalizationText && (
                            <div className="p-2 rounded-xl bg-primary/5 border border-primary/10">
                              <p className="text-[8px] uppercase font-black text-primary tracking-widest leading-none mb-1">Personalización</p>
                              <p className="text-sm font-medium italic text-slate-600 tracking-tight">"{personalizationText}"</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Order Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <PriceDisplay amount={order.total} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-emerald-600">Free</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <PriceDisplay amount={order.total} className="flex flex-col items-end" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Address */}
      {order.shipping_address && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shipping Address</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {order.shipping_address}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
