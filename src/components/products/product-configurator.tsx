'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Check, Info, Plus, X, Search, Palette, Tags, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAddToCart } from '@/hooks/use-cart';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X as XIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';


interface Design {
    id: string;
    name: string;
    image_url: string;
    price: number;
    price_small?: number;
    price_medium?: number;
    price_large?: number;
    category_id: string;
}

interface DesignCategory {
    id: string;
    name: string;
    price_small?: number;
    price_medium?: number;
    price_large?: number;
}

interface Variant {
    id: string;
    model_type: string;
    color: string;
    color_hex: string;
    size: string;
    stock: number;
    price_override: number | null;
}

interface ProductConfiguratorProps {
    product: any;
}

export function ProductConfigurator({ product }: ProductConfiguratorProps) {
    const variants = product.variants as Variant[] || [];

    // State for selected designs (max 3)
    interface SelectedDesign extends Design {
        instanceId: string;
        selectedSize: 'small' | 'medium' | 'large';
        selectedLocation: string;
    }
    const [selectedDesigns, setSelectedDesigns] = useState<SelectedDesign[]>([]);
    const [designs, setDesigns] = useState<Design[]>([]);
    const [categories, setCategories] = useState<DesignCategory[]>([]);
    const [activeDesignCategory, setActiveDesignCategory] = useState<string | null>(null);
    const [designSearch, setDesignSearch] = useState('');
    const [customText, setCustomText] = useState('');
    const [customTextSize, setCustomTextSize] = useState<'small' | 'large'>('small');
    const [storeSettings, setStoreSettings] = useState<any>(null);

    // State for garment options
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    // Budget Request State
    const [designMode, setDesignMode] = useState<'gallery' | 'upload'>('gallery');
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
    const [uploadInstructions, setUploadInstructions] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const supabase = createClient();

    const addToCart = useAddToCart();

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [dRes, cRes, sRes] = await Promise.all([
                    fetch('/api/designs'),
                    fetch('/api/design-categories'),
                    fetch('/api/settings')
                ]);
                const [dData, cData, sData] = await Promise.all([dRes.json(), cRes.json(), sRes.json()]);
                setDesigns(dData);
                setCategories(cData);
                setStoreSettings(sData);
            } catch (error) {
                console.error('Error fetching initial data:', error);
            }
        };
        loadInitialData();
    }, []);

    const designLocations = [
        'Frente Centro',
        'Frente Lado Izquierdo',
        'Frente Lado Derecho',
        'Espalda Centro',
        'Espalda Cuello',
        'Manga Izquierda',
        'Manga Derecha'
    ];

    // Step 2: Available Colors
    const availableColors = useMemo(() => {
        const unique = new Map();
        variants.forEach(v => {
            if (!unique.has(v.color)) {
                unique.set(v.color, { name: v.color, hex: v.color_hex });
            }
        });
        return Array.from(unique.values());
    }, [variants]);

    // Step 3: Available Sizes for selected color
    const availableSizes = useMemo(() => {
        if (!selectedColor) return [];
        return variants
            .filter(v => v.color === selectedColor)
            .map(v => ({ size: v.size, stock: v.stock, id: v.id }));
    }, [selectedColor, variants]);

    const isPrenda = variants.length > 0;
    const hasVariants = isPrenda && (product.category_data?.has_variants ?? true);
    const isCustomizable = isPrenda && (product.category_data?.is_customizable ?? true);

    // Find active variant
    const activeVariant = useMemo(() => {
        if (!hasVariants) return null;
        return variants.find(v =>
            v.color === selectedColor &&
            v.size === selectedSize
        );
    }, [selectedColor, selectedSize, variants, hasVariants]);

    // Find hex for preview
    const activeColorHex = useMemo(() => {
        if (!selectedColor) return '#f1f5f9';
        const variant = variants.find(v => v.color === selectedColor);
        return variant?.color_hex || '#f1f5f9';
    }, [selectedColor, variants]);

    // Price Helper for Design
    const getDesignPrice = (design: Design, size: 'small' | 'medium' | 'large') => {
        // Find category
        const category = categories.find(c => c.id === design.category_id);

        if (size === 'small') {
            return category?.price_small ?? 2.00;
        }
        if (size === 'medium') {
            return category?.price_medium ?? 5.00;
        }
        return category?.price_large ?? 10.00;
    };

    // Price Calculation
    const garmentPrice = hasVariants ? (activeVariant?.price_override || product.price) : product.price;
    const designsPrice = isCustomizable ? selectedDesigns.reduce((sum, d) => {
        return sum + getDesignPrice(d, d.selectedSize);
    }, 0) : 0;

    const personalizationPrice = customText ? (
        customTextSize === 'small' ? 1.00 : 3.00
    ) : 0;

    const totalPrice = garmentPrice + designsPrice + personalizationPrice;

    const toggleDesign = (design: Design) => {
        setSelectedDesigns(prev => {
            if (prev.length >= 3) {
                toast.error('Puedes seleccionar un máximo de 3 diseños');
                return prev;
            }
            return [...prev, {
                ...design,
                instanceId: Math.random().toString(36).substr(2, 9),
                selectedSize: 'small',
                selectedLocation: 'Frente Centro'
            }];
        });
    };

    const updateDesignOption = (instanceId: string, field: 'selectedSize' | 'selectedLocation', value: string) => {
        setSelectedDesigns(prev => prev.map(d =>
            d.instanceId === instanceId ? { ...d, [field]: value } : d
        ));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (uploadedFiles.length + files.length > 5) {
            toast.error('Puedes subir un máximo de 5 diseños');
            return;
        }

        const validFiles: File[] = [];
        const validPreviews: string[] = [];

        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`El archivo ${file.name} es muy pesado. Máximo 5MB.`);
            } else {
                validFiles.push(file);
                validPreviews.push(URL.createObjectURL(file));
            }
        });

        if (validFiles.length > 0) {
            setUploadedFiles(prev => [...prev, ...validFiles]);
            setUploadPreviews(prev => [...prev, ...validPreviews]);
        }
    };

    const removeUploadedFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
        setUploadPreviews(prev => {
            const newPreviews = [...prev];
            URL.revokeObjectURL(newPreviews[index]);
            return newPreviews.filter((_, i) => i !== index);
        });
    };

    const uploadCustomDesigns = async (): Promise<string[]> => {
        if (uploadedFiles.length === 0) return [];

        const uploadPromises = uploadedFiles.map(async (file) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('custom-designs')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('custom-designs')
                .getPublicUrl(filePath);

            return data.publicUrl;
        });

        try {
            return await Promise.all(uploadPromises);
        } catch (error) {
            console.error('Error uploading:', error);
            toast.error('Error al subir las imágenes');
            return [];
        }
    };

    const handleAddToCart = async () => {
        if (hasVariants && !activeVariant) return;

        setIsAdding(true);

        try {
            let customMetadata: any = {
                personalization: customText ? {
                    text: customText,
                    size: customTextSize,
                    price: personalizationPrice
                } : null
            };

            // Logic for Budget Request vs Standard Gallery
            if (designMode === 'upload') {
                if (uploadedFiles.length === 0) {
                    toast.error('Por favor sube al menos una imagen de referencia');
                    setIsAdding(false);
                    return;
                }

                const publicUrls = await uploadCustomDesigns();
                if (publicUrls.length === 0) {
                    setIsAdding(false);
                    return;
                }

                customMetadata = {
                    ...customMetadata,
                    on_request: true, // Mark as Budget Request
                    budget_request: {
                        designs: publicUrls.map(url => ({ image_url: url })),
                        notes: uploadInstructions,
                        original_base_price: garmentPrice
                    },
                    designs: [] // No standard designs
                };

            } else {
                // Logic for Standard Gallery Designs
                const isOutOfStock = activeVariant ? activeVariant.stock <= 0 : (product.stock <= 0);

                customMetadata = {
                    ...customMetadata,
                    on_request: isOutOfStock,
                    designs: selectedDesigns.map(d => ({
                        id: d.id,
                        name: d.name,
                        size: d.selectedSize,
                        location: d.selectedLocation,
                        price: getDesignPrice(d, d.selectedSize)
                    }))
                };
            }

            // Common Add to Cart
            await addToCart.mutateAsync({
                productId: product.id,
                quantity: 1,
                // @ts-ignore
                variantId: activeVariant?.id || null,
                // @ts-ignore
                customMetadata
            });

            if (designMode === 'upload') {
                toast.success('Solicitud añadida al carrito');
                toast.info('Se calculará el presupuesto final en base a tu diseño.');
            } else {
                const isOutOfStock = activeVariant ? activeVariant.stock <= 0 : (product.stock <= 0);
                if (isOutOfStock) {
                    toast.success('Añadido al carrito (Sujeto a disponibilidad)');
                } else {
                    toast.success('¡Añadido al carrito!');
                }
            }

            // Cleanup
            if (designMode === 'upload') {
                setUploadedFiles([]);
                setUploadPreviews([]);
                setUploadInstructions('');
            } else {
                setSelectedDesigns([]);
                setCustomText('');
            }

        } catch (error: any) {
            toast.error(error.message || 'Error al añadir al carrito');
        } finally {
            setIsAdding(false);
        }
    };

    const filteredDesigns = designs.filter(d => {
        const matchesCat = activeDesignCategory ? d.category_id === activeDesignCategory : true;
        const matchesSearch = d.name.toLowerCase().includes(designSearch.toLowerCase());
        return matchesCat && matchesSearch;
    });

    return (
        <div className="space-y-8">
            {/* Price Header */}
            <div className="flex flex-col gap-1 border-b border-lavanda/30 pb-6">
                <div className="flex items-baseline gap-3">
                    <span className="text-6xl font-serif font-light text-foreground tracking-tighter">
                        {designMode === 'upload' ? (
                            <span className="text-4xl text-muted-foreground">A Cotizar</span>
                        ) : (
                            `$${totalPrice.toFixed(2)}`
                        )}
                    </span>
                    {designMode === 'gallery' && <span className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-slate-400">USD</span>}
                </div>
                {(selectedDesigns.length > 0 || customText) && designMode === 'gallery' && (
                    <p className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-widest">
                        Base: ${garmentPrice.toFixed(2)}
                        {selectedDesigns.length > 0 && <span className="text-lavanda mx-1">|</span>}
                        {selectedDesigns.length > 0 && `Logos: $${designsPrice.toFixed(2)}`}
                        {customText && <span className="text-lavanda mx-1">|</span>}
                        {customText && `Personalización: $${personalizationPrice.toFixed(2)}`}
                    </p>
                )}
                {designMode === 'upload' && (
                    <p className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-widest">
                        Base estimada: ${garmentPrice.toFixed(2)} + Personalización
                    </p>
                )}
            </div>

            {/* Step 1: Color */}
            {hasVariants && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <SectionLabel label={isCustomizable ? "Paso 1: Elige el color de prenda" : "Paso 1: Selecciona el color"} />
                        {selectedColor && <span className="text-xs font-bold text-primary px-2 py-0.5 rounded-full bg-slate-100 border border-primary/20">{selectedColor}</span>}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {availableColors.map(color => (
                            <button
                                key={color.name}
                                onClick={() => {
                                    setSelectedColor(color.name);
                                    setSelectedSize(null);
                                }}
                                title={color.name}
                                className={cn(
                                    "group relative w-12 h-12 rounded-full border-2 transition-all p-0.5",
                                    selectedColor === color.name
                                        ? "border-primary scale-110 shadow-lg"
                                        : "border-slate-100 hover:border-slate-300 dark:border-slate-800"
                                )}
                            >
                                <div
                                    className="w-full h-full rounded-full border border-black/5"
                                    style={{ backgroundColor: color.hex }}
                                />
                                {selectedColor === color.name && (
                                    <div className="absolute -top-1 -right-1 bg-primary text-white p-0.5 rounded-full shadow-sm">
                                        <Check size={10} strokeWidth={4} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Size */}
            {hasVariants && (
                <AnimatePresence>
                    {selectedColor && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <SectionLabel label={isCustomizable ? "Paso 2: Elige tu talla" : "Paso 2: Selecciona el tamaño"} />
                                {selectedSize && <span className="text-xs font-bold text-primary px-2 py-0.5 rounded-full bg-slate-100 border border-primary/20">{isCustomizable ? 'Talla' : 'Tamaño'} {selectedSize}</span>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {availableSizes.map(s => {
                                    const isOutOfStock = s.stock <= 0;
                                    return (
                                        <button
                                            key={s.size}
                                            onClick={() => setSelectedSize(s.size)}
                                            className={cn(
                                                "min-w-[75px] h-12 rounded-2xl text-sm font-bold transition-all border-2 relative overflow-hidden",
                                                isOutOfStock ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-100 hover:border-slate-300 dark:border-slate-800",
                                                selectedSize === s.size
                                                    ? "border-primary bg-primary text-white shadow-lg"
                                                    : ""
                                            )}
                                        >
                                            {s.size}
                                            {isOutOfStock && (
                                                <div className="absolute inset-x-0 bottom-0 bg-amber-500 text-white text-[7px] font-black uppercase text-center leading-tight py-0.5">Bajo Pedido</div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedSize && availableSizes.find(s => s.size === selectedSize && s.stock <= 0) && (
                                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                                    <Info size={14} className="text-amber-600 mt-0.5 shrink-0" />
                                    <p className="text-[10px] font-bold text-amber-800 uppercase italic leading-tight">
                                        Este producto no tiene existencia inmediata y se fabricará <span className="underline">bajo pedido</span>.
                                        Soporte se contactará contigo para notificarte el tiempo de espera.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Step 3: Design Mode Selection */}
            {isCustomizable && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <SectionLabel label="Paso 3: Personalización" />
                    </div>

                    <Tabs value={designMode} onValueChange={(v: any) => setDesignMode(v)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="gallery">Galería de Diseños</TabsTrigger>
                            <TabsTrigger value="upload">Subir mi Propio Diseño</TabsTrigger>
                        </TabsList>

                        <TabsContent value="gallery" className="space-y-4 mt-0">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Elige de nuestro catálogo</span>
                                <Badge variant="secondary" className="rounded-full bg-slate-100 text-primary border-none">
                                    {selectedDesigns.length} / 3 Seleccionados
                                </Badge>
                            </div>


                            <div className="flex flex-col gap-4">
                                {selectedDesigns.map(design => (
                                    <div key={design.instanceId} className="group relative rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 shadow-sm animate-in fade-in slide-in-from-left duration-300">
                                        <div className="flex gap-4">
                                            <div className="relative aspect-square w-20 rounded-xl bg-white dark:bg-slate-900 overflow-hidden border">
                                                <img src={design.image_url} alt={design.name} className="w-full h-full object-contain p-2" />
                                                <button
                                                    onClick={() => setSelectedDesigns(prev => prev.filter(d => d.instanceId !== design.instanceId))}
                                                    className="absolute -top-1 -right-1 bg-destructive text-white p-1 rounded-full shadow-md hover:scale-110 transition-transform"
                                                >
                                                    <X size={10} strokeWidth={4} />
                                                </button>
                                            </div>

                                            <div className="flex-1 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div className="font-bold text-sm uppercase truncate max-w-[150px]">{design.name}</div>
                                                    <div className="text-primary font-black text-xs">
                                                        ${getDesignPrice(design, design.selectedSize).toFixed(2)}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-[9px] uppercase font-bold text-muted-foreground">Tamaño</Label>
                                                        <select
                                                            value={design.selectedSize}
                                                            onChange={(e) => updateDesignOption(design.instanceId, 'selectedSize', e.target.value)}
                                                            className="w-full h-8 rounded-lg bg-white dark:bg-slate-800 border text-[10px] font-bold px-2 focus:ring-1 focus:ring-primary outline-none"
                                                        >
                                                            <option value="small">Pequeño</option>
                                                            <option value="medium">Mediano</option>
                                                            <option value="large">Grande</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[9px] uppercase font-bold text-muted-foreground">Ubicación</Label>
                                                        <select
                                                            value={design.selectedLocation}
                                                            onChange={(e) => updateDesignOption(design.instanceId, 'selectedLocation', e.target.value)}
                                                            className="w-full h-8 rounded-lg bg-white dark:bg-slate-800 border text-[10px] font-bold px-2 focus:ring-1 focus:ring-primary outline-none"
                                                        >
                                                            {designLocations.map(loc => (
                                                                <option key={loc} value={loc}>{loc}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-wrap gap-3">

                                {selectedDesigns.length < 3 && (
                                    <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
                                        <DialogTrigger asChild>
                                            <button className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2 group">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-primary group-hover:text-white transition-colors flex items-center justify-center">
                                                    <Plus size={18} />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Añadir Logo</span>
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col rounded-3xl p-0 overflow-hidden">
                                            <DialogHeader className="p-6 pb-0">
                                                <DialogTitle className="flex items-center gap-2 text-2xl font-black italic uppercase tracking-tighter">
                                                    <Palette className="text-primary" /> Galería de Diseños Disponibles
                                                </DialogTitle>
                                                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                                                    <div className="relative flex-1">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                                        <Input
                                                            placeholder="Busca un logo..."
                                                            className="pl-10 rounded-xl h-11 bg-slate-50 dark:bg-slate-900 border-none"
                                                            value={designSearch}
                                                            onChange={e => setDesignSearch(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                                        <Button
                                                            variant={activeDesignCategory === null ? 'default' : 'ghost'}
                                                            className="rounded-xl h-11 shrink-0 font-bold"
                                                            onClick={() => setActiveDesignCategory(null)}
                                                        >
                                                            Todos
                                                        </Button>
                                                        {categories.map(cat => (
                                                            <Button
                                                                key={cat.id}
                                                                variant={activeDesignCategory === cat.id ? 'default' : 'ghost'}
                                                                className="rounded-xl h-11 shrink-0 font-bold"
                                                                onClick={() => setActiveDesignCategory(cat.id)}
                                                            >
                                                                {cat.name}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </DialogHeader>
                                            <Separator className="mt-6" />
                                            <ScrollArea className="flex-1 p-6">
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                    {filteredDesigns.map(design => {
                                                        const count = selectedDesigns.filter(d => d.id === design.id).length;
                                                        return (
                                                            <button
                                                                key={design.id}
                                                                onClick={() => toggleDesign(design)}
                                                                className={cn(
                                                                    "group relative aspect-square rounded-2xl border-2 transition-all overflow-hidden flex flex-col p-2",
                                                                    count > 0
                                                                        ? "border-primary bg-slate-50 shadow-inner"
                                                                        : "border-slate-100 hover:border-primary/50 dark:border-slate-800"
                                                                )}
                                                            >
                                                                <div className="flex-1 w-full bg-white dark:bg-slate-900 rounded-xl mb-2 flex items-center justify-center overflow-hidden">
                                                                    <img src={design.image_url} alt={design.name} className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform" />
                                                                </div>
                                                                <div className="text-[10px] font-black uppercase truncate text-center mb-0.5">{design.name}</div>

                                                                {count > 0 && (
                                                                    <div className="absolute top-3 right-3 bg-primary text-white w-5 h-5 flex items-center justify-center rounded-full shadow-lg font-bold text-[10px]">
                                                                        {count}
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </ScrollArea>
                                            <div className="p-6 border-t bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                                                <p className="text-xs font-medium text-slate-500">
                                                    Has seleccionado {selectedDesigns.length} de 3 diseños
                                                </p>
                                                <Button onClick={() => setIsGalleryOpen(false)} className="rounded-xl px-8 font-bold h-12 shadow-xl shadow-primary/20">
                                                    Confirmar Selección
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="upload" className="space-y-4 mt-0 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {uploadPreviews.map((preview, index) => (
                                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                                        <img src={preview} alt={`Upload ${index + 1}`} className="w-full h-full object-contain p-2" />
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                removeUploadedFile(index);
                                            }}
                                            className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <XIcon size={12} />
                                        </button>
                                    </div>
                                ))}

                                {uploadPreviews.length < 5 && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2 group"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-primary group-hover:text-white transition-colors flex items-center justify-center">
                                            <Upload size={18} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Subir Logo</span>
                                    </button>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Instrucciones Adicionales</Label>
                                <Textarea
                                    placeholder="Describe cómo quieres tu diseño (ubicación, tamaño, colores...)"
                                    value={uploadInstructions}
                                    onChange={(e) => setUploadInstructions(e.target.value)}
                                    className="rounded-xl resize-none min-h-[100px]"
                                />
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                                <div className="flex gap-2">
                                    <Info size={16} className="text-amber-600 mt-0.5 shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-amber-800 dark:text-amber-200">Solicitud de Presupuesto</p>
                                        <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-relaxed">
                                            Al subir tu diseño, el precio final será calculado por nuestro equipo.
                                            Podrás finalizar el pedido sin pagar ahora, y te contactaremos con la cotización.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}

            {/* Step 4: Personalization Text */}
            {isCustomizable && designMode === 'gallery' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom duration-500 delay-200">
                    <SectionLabel label="Paso Adicional: Personalización de Texto" />
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Input
                                placeholder="Ej: Nombre o mensaje especial..."
                                maxLength={80}
                                value={customText}
                                onChange={(e) => setCustomText(e.target.value)}
                                className="rounded-2xl h-14 bg-slate-50 dark:bg-slate-900 border-none pl-4 pr-16 text-sm font-medium"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                {customText.length}/80
                            </div>
                        </div>
                        <div className="w-full sm:w-48 space-y-1">
                            <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-2">Tamaño de Texto</Label>
                            <select
                                value={customTextSize}
                                onChange={(e) => setCustomTextSize(e.target.value as 'small' | 'large')}
                                className="w-full h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-none text-xs font-bold px-4 focus:ring-1 focus:ring-primary outline-none"
                            >
                                <option value="small">Pequeño (+${storeSettings?.personalization_price_small ?? '1.00'})</option>
                                <option value="large">Grande (+${storeSettings?.personalization_price_large ?? '3.00'})</option>
                            </select>
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic px-2">
                        Puedes añadir un nombre o mensaje corto que será incluido en la prenda (bordado o vinil según disponibilidad).
                    </p>
                </div>
            )}




            {/* Final Action */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-900">
                <Button
                    className="w-full h-16 rounded-2xl text-xl font-black italic shadow-2xl shadow-primary/30 gap-4 uppercase tracking-tighter hover:scale-[1.02] active:scale-95 transition-all"
                    disabled={isAdding}
                    onClick={handleAddToCart}
                >
                    {isAdding ? (
                        <Loader2 className="animate-spin w-8 h-8" />
                    ) : (
                        <ShoppingCart className="w-7 h-7" />
                    )}
                    {!activeVariant
                        ? 'Completa los pasos'
                        : designMode === 'upload'
                            ? 'Solicitar Presupuesto'
                            : activeVariant.stock <= 0
                                ? 'Reservar Bajo Pedido'
                                : 'Personalizar y Comprar'}
                </Button>
            </div>
        </div>
    );
}

function SectionLabel({ label }: { label: string }) {
    return (
        <h3 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-lavanda rounded-full shadow-[0_0_8px_rgba(230,230,250,0.8)]"></span>
            {label}
        </h3>
    );
}
