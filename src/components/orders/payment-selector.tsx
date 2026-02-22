'use client';

import { useState, useEffect } from 'react';
import { Check, Landmark, Smartphone, Wallet, CreditCard, Zap, Bitcoin, DollarSign, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const ICON_MAP: Record<string, any> = {
    Smartphone,
    Landmark,
    Wallet,
    Bitcoin,
    Zap,
    CreditCard,
    DollarSign
};

interface PaymentMethod {
    id: string;
    name: string;
    instructions: string;
    icon: string;
    discount_percentage: number;
    is_discount_active: boolean;
}

interface PaymentSelectorProps {
    onSelect: (method: PaymentMethod | null) => void;
    selectedId?: string;
}

export function PaymentSelector({ onSelect, selectedId }: PaymentSelectorProps) {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMethods = async () => {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (res.ok && data.payment_methods) {
                    setMethods(data.payment_methods);
                }
            } catch (error) {
                console.error('Error fetching payment methods:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMethods();
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-3 my-4">
                <Skeleton className="h-4 w-32" />
                <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-16 rounded-xl" />
                    <Skeleton className="h-16 rounded-xl" />
                </div>
            </div>
        );
    }

    if (methods.length === 0) return null;

    return (
        <div className="space-y-3 my-4">
            <h3 className="text-xs font-black uppercase italic tracking-tighter text-muted-foreground flex items-center justify-between">
                Elige tu método de pago
                <Badge variant="outline" className="text-[9px] border-primary/20 text-primary uppercase font-black italic">
                    Descuento disponible
                </Badge>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {methods.map((method) => {
                    const Icon = ICON_MAP[method.icon] || Landmark;
                    const isSelected = selectedId === method.id;

                    return (
                        <Card
                            key={method.id}
                            onClick={() => onSelect(method)}
                            className={cn(
                                "relative p-2 cursor-pointer transition-all border-2 overflow-hidden group min-h-[60px] flex flex-col items-center justify-center text-center",
                                isSelected
                                    ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                                    : "border-slate-100 hover:border-primary/40 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/50"
                            )}
                        >
                            <div className={cn(
                                "p-1.5 rounded-lg mb-1",
                                isSelected ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-primary"
                            )}>
                                <Icon size={14} />
                            </div>
                            <p className={cn(
                                "text-[10px] font-black uppercase italic leading-tight tracking-tighter line-clamp-2",
                                isSelected ? "text-primary" : "text-slate-700 dark:text-slate-200"
                            )}>
                                {method.name}
                            </p>

                            {method.is_discount_active && method.discount_percentage > 0 && (
                                <div className="absolute top-0 right-0 bg-emerald-500 text-white px-1 py-0.5 rounded-bl-lg">
                                    <span className="text-[7px] font-black italic">-{method.discount_percentage}%</span>
                                </div>
                            )}

                            {isSelected && (
                                <div className="absolute top-1 left-1 bg-primary rounded-full p-0.5 text-white">
                                    <Check size={8} />
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
