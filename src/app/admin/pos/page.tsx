'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Search, Plus, Minus, Trash2, ShoppingCart,
    Save, FileText, UserCircle, MapPin, Phone, Mail, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useStoreSettings, PriceDisplay } from '@/components/store-settings-provider';

interface CartItem {
    product_id: string;
    variant_id: string | null;
    product_name: string;
    quantity: number;
    price: number;
    stock: number;
    image_url?: string;
    on_request: boolean;
    custom_metadata?: any;
}

export default function AdminPOSPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editQuoteId = searchParams.get('edit');

    const settings = useStoreSettings();
    const [products, setProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [cart, setCart] = useState<CartItem[]>([]);
    const [customer, setCustomer] = useState({
        name: '', email: '', phone: '', address: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingEdit, setLoadingEdit] = useState(false);

    useEffect(() => {
        fetchProducts();
        if (editQuoteId) {
            loadQuoteForEditing(editQuoteId);
        }
    }, [editQuoteId]);

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const res = await fetch('/api/products');
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (error) {
            toast.error('Error al cargar productos');
        } finally {
            setLoadingProducts(false);
        }
    };

    const loadQuoteForEditing = async (id: string) => {
        setLoadingEdit(true);
        try {
            const res = await fetch(`/api/admin/orders/${id}`);
            if (res.ok) {
                const quote = await res.json();
                if (quote.status !== 'quote') {
                    toast.error('Solo se pueden editar presupuestos');
                    router.push('/admin/quotes');
                    return;
                }

                setCustomer({
                    name: quote.customer_name || '',
                    email: quote.customer_email || '',
                    phone: quote.customer_phone || '',
                    address: quote.shipping_address || ''
                });

                const loadedCart = quote.items.map((item: any) => ({
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    product_name: item.product_name,
                    quantity: item.quantity,
                    price: item.price,
                    stock: 999, // Assuming sufficient stock for editing, or fetch actual
                    on_request: item.on_request || false,
                    custom_metadata: item.custom_metadata
                }));
                setCart(loadedCart);
                toast.success('Presupuesto cargado para edición');
            } else {
                toast.error('No se encontró el presupuesto');
            }
        } catch (error) {
            toast.error('Error al cargar presupuesto');
        } finally {
            setLoadingEdit(false);
        }
    };

    const addToCart = (product: any, variant: any = null) => {
        const price = variant ? (variant.price_override || variant.price || product.price) : product.price;
        const stock = variant ? variant.stock : product.stock;
        const id = variant ? `${product.id}-${variant.id}` : product.id;
        const name = variant ? `${product.name} (${variant.size || ''} ${variant.color || ''})`.trim() : product.name;

        setCart(prev => {
            const existing = prev.find(item =>
                item.product_id === product.id && item.variant_id === (variant?.id || null)
            );

            if (existing) {
                if (!product.is_on_request && existing.quantity >= stock) {
                    toast.error('Stock insuficiente');
                    return prev;
                }
                return prev.map(item =>
                    item === existing
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            if (!product.is_on_request && stock < 1) {
                toast.error('Producto sin stock');
                return prev;
            }

            return [...prev, {
                product_id: product.id,
                variant_id: variant?.id || null,
                product_name: name,
                quantity: 1,
                price: price,
                stock: stock,
                image_url: product.images?.[0],
                on_request: product.is_on_request
            }];
        });
        toast.success('Producto añadido');
    };

    const updateQuantity = (index: number, delta: number) => {
        setCart(prev => {
            const newCart = [...prev];
            const item = newCart[index];
            const newQuantity = item.quantity + delta;

            if (newQuantity < 1) return prev; // Use remove instead
            if (!item.on_request && newQuantity > item.stock) {
                toast.error('Stock insuficiente');
                return prev;
            }

            newCart[index].quantity = newQuantity;
            return newCart;
        });
    };

    const removeFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const totalUSD = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalLocal = settings && !settings.isLoading ? totalUSD * settings.exchange_rate : 0;

    const handleSubmit = async (isQuote: boolean) => {
        if (cart.length === 0) {
            toast.error('El carrito está vacío');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                items: cart,
                total: totalUSD,
                customer_name: customer.name,
                customer_email: customer.email,
                customer_phone: customer.phone,
                shipping_address: customer.address,
                is_quote: isQuote
            };

            let url = '/api/admin/orders';
            let method = 'POST';

            if (editQuoteId) {
                url = `/api/admin/orders/${editQuoteId}`;
                method = 'PATCH';
                // For editing, status remains 'quote' if keeping it as quote
                if (isQuote) {
                    (payload as any).status = 'quote';
                } else {
                    (payload as any).status = 'pending'; // Convert to order
                }
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success(isQuote ? 'Presupuesto guardado' : 'Pedido creado');
                router.push(isQuote ? '/admin/quotes' : '/admin/orders');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Error al guardar');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loadingEdit) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-2">
                        <ShoppingCart size={12} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Punto de Venta Administrativo</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white leading-none">
                        {editQuoteId ? 'Editar Presupuesto' : 'Nuevo Pedido'}
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Product Selector */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <Input
                                placeholder="Buscar productos por nombre o categoría..."
                                className="pl-12 h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 border-transparent focus-visible:ring-primary/20 text-lg font-bold"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {loadingProducts ? (
                            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-300" size={32} /></div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 pb-4 scrollbar-thin">
                                {filteredProducts.map(product => (
                                    <div key={product.id} className="group relative bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all">
                                        <div className="aspect-square bg-white dark:bg-slate-900 rounded-2xl mb-4 overflow-hidden border border-slate-100 flex items-center justify-center p-2">
                                            {product.images?.[0] ? (
                                                <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="text-slate-200"><ShoppingCart size={40} /></div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-black text-sm leading-tight line-clamp-2 mb-1">{product.name}</p>
                                            <p className="text-primary font-bold italic tracking-tighter"><PriceDisplay amount={product.price} /></p>
                                        </div>

                                        {/* Quick Add Overlay */}
                                        <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 gap-2">
                                            {product.variants && product.variants.length > 0 ? (
                                                <div className="w-full max-h-full overflow-y-auto space-y-2 pr-1">
                                                    <p className="text-[10px] font-black uppercase text-center text-muted-foreground">Variantes</p>
                                                    {product.variants.map((v: any) => (
                                                        <Button
                                                            key={v.id}
                                                            onClick={(_) => addToCart(product, v)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full text-[10px] justify-between h-auto py-2"
                                                        >
                                                            <span>{v.size} {v.color}</span>
                                                            <span className="text-primary font-bold">+</span>
                                                        </Button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <Button onClick={() => addToCart(product)} className="rounded-xl font-bold uppercase italic text-xs">
                                                    <Plus size={16} className="mr-2" /> Añadir
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Cart and Customer */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Customer form */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest italic text-muted-foreground flex items-center gap-2">
                            <UserCircle size={16} /> Datos del Cliente
                        </Label>
                        <div className="space-y-3">
                            <Input
                                placeholder="Nombre completo"
                                className="bg-slate-50 dark:bg-slate-950 font-medium"
                                value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    placeholder="Teléfono / WhatsApp"
                                    className="bg-slate-50 dark:bg-slate-950 font-medium"
                                    value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                                />
                                <Input
                                    placeholder="Correo" type="email"
                                    className="bg-slate-50 dark:bg-slate-950 font-medium"
                                    value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })}
                                />
                            </div>
                            <Textarea
                                placeholder="Dirección de envío o notas..."
                                className="bg-slate-50 dark:bg-slate-950 font-medium resize-none" rows={2}
                                value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Cart Section */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[500px]">
                        <Label className="text-xs font-black uppercase tracking-widest italic text-muted-foreground flex items-center justify-between mb-4">
                            <span className="flex items-center gap-2"><ShoppingCart size={16} /> Detalle de Pedido</span>
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg">{cart.length}</span>
                        </Label>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50">
                                    <ShoppingCart size={40} />
                                    <p className="text-sm font-bold">Carrito vacío</p>
                                </div>
                            ) : cart.map((item, idx) => (
                                <div key={idx} className="flex gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black truncate">{item.product_name}</p>
                                        <p className="text-xs text-primary font-bold italic">${(item.price || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg text-slate-400 hover:text-red-500" onClick={() => updateQuantity(idx, -1)}>
                                            <Minus size={12} />
                                        </Button>
                                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg text-slate-400 hover:text-emerald-500" onClick={() => updateQuantity(idx, 1)}>
                                            <Plus size={12} />
                                        </Button>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 self-center text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => removeFromCart(idx)}>
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Totals & Submit */}
                        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                            <div className="flex justify-between items-end mb-6">
                                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground italic">Total</p>
                                <div className="text-right">
                                    <h2 className="text-4xl font-black italic tracking-tighter text-primary">${(totalUSD || 0).toFixed(2)}</h2>
                                    {settings && <p className="text-xs font-bold text-slate-400">≈ Bs {totalLocal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    className="h-14 rounded-2xl font-black uppercase italic text-xs tracking-widest border-2 hover:bg-primary/5"
                                    disabled={isSubmitting || cart.length === 0}
                                    onClick={() => handleSubmit(true)}
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><FileText size={16} className="mr-2" /> Guardar Presupuesto</>}
                                </Button>
                                <Button
                                    className="h-14 rounded-2xl font-black uppercase italic text-xs tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20"
                                    disabled={isSubmitting || cart.length === 0}
                                    onClick={() => handleSubmit(false)}
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={16} className="mr-2" /> Crear Pedido</>}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
