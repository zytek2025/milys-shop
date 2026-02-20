'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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
    const [settings, setSettings] = useState<StoreSettingsContextType>({
        store_country: 'VE',
        currency_symbol: '$',
        exchange_rate: 60.0,
        isLoading: true,
    });

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                setSettings({
                    store_country: data.store_country || 'VE',
                    currency_symbol: data.currency_symbol || '$',
                    exchange_rate: Number(data.exchange_rate ?? 60.0),
                    isLoading: false,
                });
            })
            .catch(err => {
                console.error("Error fetching store settings:", err);
                setSettings(prev => ({ ...prev, isLoading: false }));
            });
    }, []);

    return (
        <StoreSettingsContext.Provider value={settings}>
            {children}
        </StoreSettingsContext.Provider>
    );
}

export function formatPrice(basePriceUSD: number, settings: StoreSettingsContextType) {
    // Determine how to format the price based on country setting

    // Si NO es Venezuela, mostrar solo la moneda del país calculado según factor (o $ si base)
    if (settings.store_country !== 'VE') {
        const localVal = basePriceUSD * settings.exchange_rate;
        return `${settings.currency_symbol}${localVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Si es Venezuela, mostrar USD principal y VES pequeño
    // La forma de renderizar HTML doble dependerá del componente, aquí solo retornamos un objeto
    // O si solo queremos string formattter:
    return `${settings.currency_symbol}${basePriceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// React component helper para renderizar el precio base y la equivalencia en BS si aplica
export function PriceDisplay({ amount, className = "" }: { amount: number, className?: string }) {
    const settings = useStoreSettings();

    // Loading skeleton or fallback
    if (settings.isLoading) {
        return <span className={className}>...</span>;
    }

    if (settings.store_country === 'VE') {
        const vesAmount = amount * settings.exchange_rate;
        return (
            <div className={`flex items-baseline gap-1 ${className}`}>
                <span>{settings.currency_symbol}{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-[0.6em] text-muted-foreground font-medium">
                    (Bs {vesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </span>
            </div>
        );
    }

    // Others: Solo moneda de curso del país
    const localVal = amount * settings.exchange_rate;
    return (
        <span className={className}>
            {settings.currency_symbol}{localVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
    );
}
