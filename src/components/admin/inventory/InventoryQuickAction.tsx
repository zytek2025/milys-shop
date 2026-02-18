'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface ProductVariant {
    id: string;
    product: {
        name: string;
        control_id: string;
        image_url: string;
    };
    size: string;
    color: string;
    stock: number;
}

export function InventoryQuickAction({ onUpdate }: { onUpdate: () => void }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ProductVariant[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [adjustment, setAdjustment] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                // We'll reuse the existing search endpoint or create a lightweight one
                // For now, let's assume we can filter client-side or we need a search param
                // In a real app with "thousands" of products, we need server-side search.
                // Current /api/admin/products might be too heavy if it returns everything.
                // Let's rely on the master list fetch for now if it's cached, or add a search param

                // Optimized: Fetch minimal data for search
                // Note: ideally we should have a dedicated /api/admin/inventory/search endpoint
                // reusing the main list logic but filtering by 'search' param
                const res = await fetch(`/api/admin/products?search=${encodeURIComponent(query)}`);
                if (!res.ok) throw new Error('Failed to search');
                const data = await res.json();

                // Flatten to variants
                const variants: ProductVariant[] = [];
                const productsList = Array.isArray(data) ? data : [];

                productsList.forEach((p: any) => {
                    p.product_variants.forEach((v: any) => {
                        variants.push({
                            id: v.id,
                            product: {
                                name: p.name,
                                control_id: p.control_id,
                                image_url: p.image_url
                            },
                            size: v.size,
                            color: v.color,
                            stock: v.stock
                        });
                    });
                });

                setResults(variants.slice(0, 10)); // Limit results
            } catch (error) {
                console.error(error);
                toast.error('Error buscando productos');
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const handleAdjustment = async (type: 'add' | 'remove') => {
        if (!selectedVariant || adjustment <= 0) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/inventory/quick-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    variant_id: selectedVariant.id,
                    type,
                    adjustment: adjustment,
                    reason: 'Ajuste Rápido Manual'
                })
            });

            if (!res.ok) throw new Error('Update failed');

            const data = await res.json();

            toast.success(`Stock actualizado: ${data.newStock} unidades`, {
                description: `${selectedVariant.product.name} (${selectedVariant.size}/${selectedVariant.color})`
            });

            // Reset
            setAdjustment(0);
            setSelectedVariant(null);
            setQuery('');
            setOpen(false);
            onUpdate(); // Refresh parent

        } catch (error) {
            toast.error('Error al actualizar stock');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Search size={20} />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Ajuste Rápido</CardTitle>
                        <CardDescription>Busca por nombre o código (PRD-...) para mover inventario</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex flex-col gap-6">
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between h-14 text-base px-4 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                            >
                                {selectedVariant ? (
                                    <div className="flex items-center gap-3 text-left">
                                        {selectedVariant.product.image_url && (
                                            <img src={selectedVariant.product.image_url} alt="" className="w-8 h-8 rounded-md object-cover" />
                                        )}
                                        <div className="flex flex-col">
                                            <span className="font-bold truncate">{selectedVariant.product.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {selectedVariant.product.control_id} • {selectedVariant.size} / {selectedVariant.color}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <Search className="h-4 w-4" /> Buscar producto...
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                            <Command shouldFilter={false}>
                                <CommandInput
                                    placeholder="Escribe para buscar..."
                                    value={query}
                                    onValueChange={setQuery}
                                />
                                <CommandList>
                                    {loading && <CommandItem disabled>Buscando...</CommandItem>}
                                    {!loading && results.length === 0 && query.length > 2 && (
                                        <CommandEmpty>No se encontraron productos.</CommandEmpty>
                                    )}
                                    <CommandGroup heading="Resultados">
                                        {results.map((variant) => (
                                            <CommandItem
                                                key={variant.id}
                                                onSelect={() => {
                                                    setSelectedVariant(variant);
                                                    setOpen(false);
                                                }}
                                                className="flex items-center gap-3 cursor-pointer p-3"
                                            >
                                                {variant.product.image_url ? (
                                                    <img src={variant.product.image_url} alt="" className="w-10 h-10 rounded-md object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-md bg-slate-100 dark:bg-slate-800" />
                                                )}
                                                <div className="flex flex-col flex-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold">{variant.product.name}</span>
                                                        <Badge variant="outline" className={cn(
                                                            variant.stock < 5 ? "text-red-500 border-red-200 bg-red-50" : "text-slate-600"
                                                        )}>
                                                            Stock: {variant.stock}
                                                        </Badge>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {variant.product.control_id} • {variant.size} • {variant.color}
                                                    </span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {selectedVariant && (
                        <div className="animate-in slide-in-from-top-4 fade-in duration-300 space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                <span className="text-sm font-medium text-muted-foreground">Stock Actual</span>
                                <span className="text-3xl font-black">{selectedVariant.stock}</span>
                            </div>

                            <Separator />

                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative">
                                    <Input
                                        type="number"
                                        min="1"
                                        value={adjustment || ''}
                                        onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
                                        placeholder="Cantidad"
                                        className="h-12 text-lg text-center font-bold"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground uppercase">Unidades</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleAdjustment('add')}
                                        disabled={isSubmitting || !adjustment}
                                        className="h-12 w-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                    >
                                        <Plus className="h-6 w-6" />
                                    </Button>
                                    <Button
                                        onClick={() => handleAdjustment('remove')}
                                        disabled={isSubmitting || !adjustment || adjustment > selectedVariant.stock}
                                        className="h-12 w-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20"
                                    >
                                        <Minus className="h-6 w-6" />
                                    </Button>
                                </div>
                            </div>

                            <p className="text-xs text-center text-muted-foreground">
                                Esta acción quedará registrada en el historial de movimientos.
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
