'use client';

import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';

interface StoreSettingsContextType {
    store_country: string;
    currency_symbol: string;
    exchange_rate: number;
    isLoading: boolean;
}

const StoreSettingsContext = createContext<StoreSettingsContextType>({
    store_country: 'VE',
    currency_symbol: '$',
    exchange_rate: 60.0,
    isLoading: true,
});

export const useStoreSettings = () => useContext(StoreSettingsContext);

export function StoreSettingsProvider({ children }: { children: React.ReactNode }) {
    const { data, isLoading } = useQuery({
        queryKey: ['store-settings'],
        queryFn: async () => {
            const res = await fetch('/api/settings');
            if (!res.ok) throw new Error('Failed to fetch settings');
            return res.json();
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const settings = {
        store_country: data?.store_country || 'VE',
        currency_symbol: data?.currency_symbol || '$',
        exchange_rate: Number(data?.exchange_rate ?? 60.0),
        isLoading
    };

    return (
        <StoreSettingsContext.Provider value={settings}>
            {children}
        </StoreSettingsContext.Provider>
    );
}

export function formatPrice(basePriceUSD: number, settings: StoreSettingsContextType) {
    // Si NO es Venezuela, mostrar solo la moneda del país calculado según factor (o $ si base)
    if (settings.store_country !== 'VE') {
        const localVal = basePriceUSD * settings.exchange_rate;
        return `${settings.currency_symbol}${localVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Si es Venezuela, siempre mostrar $ para el base
    return `$${basePriceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// React component helper para renderizar el precio base y la equivalencia en BS si aplica
export function PriceDisplay({ amount, className = "" }: { amount: number, className?: string }) {
    const settings = useStoreSettings();

    // Loading skeleton or fallback
    if (settings.isLoading) {
        return <span className={className}>...</span>;
    }

    const safeAmount = isNaN(amount) || amount === undefined || amount === null ? 0 : amount;

    if (settings.store_country === 'VE') {
        const vesAmount = safeAmount * settings.exchange_rate;
        return (
            <div className={`flex items-baseline gap-1 ${className}`}>
                <span>${safeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-[0.6em] text-muted-foreground font-medium">
                    ({settings.currency_symbol || 'Bs'} {vesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </span>
            </div>
        );
    }

    // Others: Solo moneda de curso del país
    const localVal = safeAmount * settings.exchange_rate;
    return (
        <span className={className}>
            {settings.currency_symbol}{localVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
    );
}
