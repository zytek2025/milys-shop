import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Calendar, Tag, ArrowRight, Gift, Percent, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const metadata = {
    title: 'Ofertas Exclusivas | Mily\'s Shop',
    description: 'Descubre nuestras mejores promociones, descuentos y regalos por tiempo limitado.',
};

async function getActivePromotions() {
    const supabase = await createClient();
    const { data: promotions } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString().split('T')[0]) // Only valid dates
        .order('value', { ascending: false }); // Show best offers first

    return promotions || [];
}

export default async function OffersPage() {
    const promotions = await getActivePromotions();

    if (!promotions || promotions.length === 0) {
        redirect('/');
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Hero Section */}
            <section className="relative py-24 px-6 overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10">
                    <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] bg-primary/20 rounded-full blur-[150px] animate-pulse" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-secondary/20 rounded-full blur-[120px]" />
                </div>

                <div className="container mx-auto relative z-10 text-center max-w-4xl">
                    <Badge className="mb-6 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 border-none text-white px-4 py-1 text-sm uppercase tracking-widest font-black shadow-lg shadow-pink-500/30">
                        Limited Time Offers
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 text-slate-900 dark:text-white italic">
                        Ofertas <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Irresistibles</span>
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
                        Aprovecha nuestros descuentos exclusivos y obtén más por tu estilo.
                        <span className="block mt-2 text-sm opacity-75 uppercase tracking-wider font-bold">Actualizado diariamente</span>
                    </p>
                </div>
            </section>

            {/* Offers Grid */}
            <section className="container mx-auto px-6 pb-24">
                {promotions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {promotions.map((promo) => (
                            <Card key={promo.id} className="group border-none shadow-xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                                <div className="absolute top-0 right-0 p-4 z-20">
                                    <Badge variant="secondary" className="font-bold uppercase tracking-wider text-[10px] bg-white/50 backdrop-blur-md border border-white/20">
                                        {promo.type === 'percentage' ? 'Descuento' :
                                            promo.type === 'bogo' ? '2x1' :
                                                promo.type === 'gift' ? 'Regalo' : 'Promo'}
                                    </Badge>
                                </div>

                                <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-10" />
                                    <div className="text-center z-10 transform group-hover:scale-110 transition-transform duration-500">
                                        {promo.type === 'percentage' ? (
                                            <span className="text-7xl font-black text-primary tracking-tighter drop-shadow-sm">
                                                {promo.value}%
                                                <span className="block text-lg font-bold text-slate-400 uppercase tracking-widest mt-[-10px]">OFF</span>
                                            </span>
                                        ) : promo.type === 'fixed' ? (
                                            <span className="text-6xl font-black text-emerald-500 tracking-tighter">
                                                ${promo.value}
                                                <span className="block text-lg font-bold text-slate-400 uppercase tracking-widest mt-[-10px]">Ahorro</span>
                                            </span>
                                        ) : (
                                            <Gift size={80} className="text-secondary animate-bounce duration-[3s]" />
                                        )}
                                    </div>
                                </div>

                                <CardHeader>
                                    <h3 className="text-2xl font-black italic tracking-tight text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                        {promo.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                        <Calendar size={14} />
                                        <span>Válido hasta: {format(new Date(promo.end_date), "d 'de' MMMM", { locale: es })}</span>
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                                        {promo.description || "Aprovecha esta increíble oferta por tiempo limitado en productos seleccionados."}
                                    </p>

                                    {/* Conditions */}
                                    {(promo.min_orders_required > 0 || promo.min_order_value_condition > 0) && (
                                        <div className="mt-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-xs font-medium text-slate-600 dark:text-slate-300">
                                            <span className="block font-bold uppercase text-[10px] text-slate-400 mb-1">Condiciones:</span>
                                            {promo.min_orders_required > 0 && <span className="block">• Mínimo {promo.min_orders_required} compras previas</span>}
                                            {promo.min_order_value_condition > 0 && <span className="block">• Compra mínima de ${promo.min_order_value_condition}</span>}
                                        </div>
                                    )}
                                </CardContent>

                                <CardFooter>
                                    <Button className="w-full rounded-xl h-12 text-md font-bold uppercase tracking-wider group-hover:bg-primary group-hover:text-white transition-all shadow-lg shadow-slate-200 dark:shadow-none" asChild>
                                        <Link href="/">
                                            Comprar Ahora <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white/90 dark:bg-slate-900/90 rounded-[3rem] border border-dashed border-slate-300 dark:border-slate-700">
                        <ShoppingBag size={64} className="mx-auto text-slate-300 mb-6" />
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No hay ofertas activas por ahora</h3>
                        <p className="text-slate-500">Estamos preparando nuevas sorpresas para ti. Vuelve pronto.</p>
                    </div>
                )}
            </section>
        </div>
    );
}
