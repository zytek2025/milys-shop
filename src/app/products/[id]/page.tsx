import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, ArrowLeft, Check, Info } from 'lucide-react';
import Link from 'next/link';
import { ProductConfigurator } from '@/components/products/product-configurator';
import { notFound } from 'next/navigation';
import { ProductImageGallery } from '@/components/products/product-image-gallery';

export const dynamic = 'force-dynamic';

async function getProduct(id: string) {
    const supabase = await createClient();

    // 1. Fetch product and variants
    const { data: product } = await supabase
        .from('products')
        .select(`
            *,
            variants:product_variants(*)
        `)
        .eq('id', id)
        .maybeSingle();

    if (!product) return null;

    // 2. Fetch category data separately since it's a text field relationship
    if (product.category) {
        const { data: category } = await supabase
            .from('categories')
            .select('has_variants, is_customizable')
            .eq('name', product.category)
            .maybeSingle();

        // @ts-ignore
        product.category_data = category;
    }

    return product;
}

export default async function ProductPage(props: {
    params: Promise<{ id: string }>
}) {
    const { id } = await props.params;
    const product = await getProduct(id);

    if (!product) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <Link
                href="/"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group"
            >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Volver al catálogo
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Visuals Column */}
                <div className="space-y-4">
                    <ProductImageGallery
                        images={[product.image_url, product.image_url_2, product.image_url_3].filter(Boolean) as string[]}
                        productName={product.name}
                    />

                    {product.description && (
                        <>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 mt-8">Descripción</h3>
                            <div className="p-6 rounded-2xl bg-slate-50/90 dark:bg-slate-900/90 border border-slate-100 dark:border-slate-800 backdrop-blur-sm">
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {product.description}
                                </p>
                            </div>
                        </>
                    )}

                    {product.category_data?.is_customizable ? (
                        <div className="p-6 rounded-2xl bg-slate-50/90 dark:bg-slate-900/90 border border-slate-100 dark:border-slate-800 backdrop-blur-sm">
                            <h3 className="font-bold flex items-center gap-2 mb-2 text-primary">
                                <Info size={16} /> Sobre este diseño
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed italic">
                                Este es un diseño exclusivo para sublimación de alta calidad. El estampado no se agrieta ni se desvanece con el tiempo.
                            </p>
                        </div>
                    ) : (
                        <div className="p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 backdrop-blur-sm">
                            <h3 className="font-bold flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                                <Check size={16} /> Producto Original
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed italic">
                                Este es un producto de reventa 100% original y garantizado. Seleccionamos solo lo mejor para ti.
                            </p>
                        </div>
                    )}
                </div>

                {/* Configuration Column */}
                <div className="flex flex-col">
                    <div className="mb-6">
                        <Badge variant="outline" className="mb-2 rounded-full px-3 py-1 text-[10px] tracking-wider uppercase">
                            {product.category}
                        </Badge>
                        <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                            {product.name}
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            {product.description || 'Eleva tu estilo con nuestros diseños premium personalizados.'}
                        </p>
                    </div>

                    <Separator className="mb-8" />

                    {/* This client component handles the selection matrix */}
                    <ProductConfigurator product={product} />

                    <div className="mt-auto pt-8 flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <Check className="w-3 h-3 text-green-600" />
                            </div>
                            Envío rápido a toda Venezuela
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Check className="w-3 h-3 text-blue-600" />
                            </div>
                            Calidad Premium 100% Garantizada
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
