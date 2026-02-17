'use client';

import { useState } from 'react';
import { PaymentSelector } from '@/components/orders/payment-selector';
import { PaymentInstructions } from '@/components/orders/payment-instructions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function OrderPaymentSection({ order }: { order: any }) {
    const [isUpdating, setIsUpdating] = useState(false);
    const router = useRouter();

    const handleSelect = async (method: any) => {
        if (!method) return;
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/orders/${order.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payment_method_id: method.id })
            });

            if (res.ok) {
                toast.success('Método de pago seleccionado');
                router.refresh();
            } else {
                toast.error('Error al actualizar el método de pago');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setIsUpdating(false);
        }
    };

    if (order.payment_method_id) {
        return <PaymentInstructions paymentMethodId={order.payment_method_id} />;
    }

    return (
        <div className="space-y-4">
            {isUpdating ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-primary/20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="font-black uppercase italic tracking-tighter text-primary animate-pulse">
                        Actualizando Pedido...
                    </p>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <PaymentSelector onSelect={handleSelect} />
                </div>
            )}
        </div>
    );
}
