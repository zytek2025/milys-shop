'use client';

import { useCart, useCartTotals } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface OrderSummaryProps {
    onConfirm: () => void;
}

export function OrderSummary({ onConfirm }: OrderSummaryProps) {
    const { data: cart, isLoading } = useCart();
    const { total } = useCartTotals();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    const items = cart?.items || [];

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-2">
                    <CheckCircle size={24} />
                </div>
                <h3 className="text-lg font-bold">Resumen de tu Pedido</h3>
                <p className="text-sm text-muted-foreground">
                    Por favor revisa que todo esté correcto antes de continuar.
                </p>
            </div>

            <ScrollArea className="h-[300px] pr-4 rounded-lg border bg-slate-50/50 p-4">
                <div className="space-y-4">
                    {items.map((item) => {
                        // Price Calculation Logic duplicated for display
                        const basePrice = item.variant?.price_override ?? item.product?.price ?? 0;
                        const metadata = (item.custom_metadata || {}) as any;
                        const isNewFormat = !Array.isArray(metadata) && !!metadata.designs;
                        const designList = (isNewFormat ? metadata.designs : (Array.isArray(metadata) ? metadata : [])) as any[];
                        const personalization = isNewFormat ? metadata.personalization : null;
                        const personalizationPrice = personalization?.price || 0;
                        const designsPrice = designList.reduce((sum: number, d: any) => sum + (d.price || 0), 0);
                        const finalPrice = basePrice + designsPrice + personalizationPrice;
                        const subtotal = finalPrice * item.quantity;

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-4 p-3 bg-white rounded-xl border border-slate-100 shadow-sm"
                            >
                                <div className="h-16 w-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                    {item.product?.image_url && (
                                        <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-sm truncate">{item.product?.name}</h4>
                                        <span className="font-bold text-sm text-emerald-600">${subtotal.toFixed(2)}</span>
                                    </div>

                                    <div className="text-xs text-muted-foreground mt-1">
                                        {item.quantity} x ${finalPrice.toFixed(2)}
                                    </div>

                                    {(item.variant?.size || item.variant?.color) && (
                                        <div className="text-[10px] bg-slate-100 inline-block px-2 py-0.5 rounded text-slate-500 font-bold uppercase mt-2">
                                            {item.variant.size} {item.variant.color && `/ ${item.variant.color}`}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </ScrollArea>

            <div className="space-y-4">
                <div className="flex justify-between items-center text-lg font-black">
                    <span>Total a Pagar</span>
                    <span className="text-emerald-600">${total.toFixed(2)}</span>
                </div>

                <Button
                    onClick={onConfirm}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-12 text-lg font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                    Confirmar y Continuar <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}
