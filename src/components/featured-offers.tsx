'use client';

import Link from 'next/link';
import { ArrowRight, Tag, Percent, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FeaturedOffersProps {
    promotions: any[];
}

export function FeaturedOffers({ promotions }: FeaturedOffersProps) {
    if (!promotions || promotions.length === 0) return null;

    return (
        <section className="py-16 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                    <div>
                        <Badge className="mb-3 bg-rose-500 hover:bg-rose-600 border-none text-white px-3 py-1 text-xs uppercase tracking-widest font-black">
                            Limited Time only
                        </Badge>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white italic">
                            Ofertas <span className="text-primary">Destacadas</span>
                        </h2>
                    </div>
                    <Button variant="ghost" className="text-muted-foreground hover:text-primary gap-2" asChild>
                        <Link href="/offers">
                            Ver todas las ofertas <ArrowRight size={16} />
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {promotions.slice(0, 3).map((promo, index) => (
                        <Card key={promo.id} className="group relative border-none overflow-hidden shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] h-[280px]">
                            {/* Background Decoration */}
                            <div className={`absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20 bg-gradient-to-br ${index === 0 ? 'from-purple-500 to-indigo-500' :
                                    index === 1 ? 'from-rose-500 to-pink-500' :
                                        'from-emerald-500 to-teal-500'
                                }`} />

                            <div className="absolute top-4 right-4 z-20">
                                <div className="h-12 w-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-lg font-black text-rose-500 text-lg rotate-12 group-hover:rotate-0 transition-all duration-500">
                                    {promo.type === 'percentage' ? `-${promo.value}%` : <Gift size={20} />}
                                </div>
                            </div>

                            <CardContent className="relative z-10 h-full flex flex-col justify-end p-8">
                                <div className="mb-auto pt-6">
                                    {promo.type === 'bogo' && <Tag size={32} className="text-slate-900 dark:text-white mb-4 opacity-50" />}
                                    {promo.type === 'percentage' && <Percent size={32} className="text-slate-900 dark:text-white mb-4 opacity-50" />}
                                    {promo.type === 'gift' && <Gift size={32} className="text-slate-900 dark:text-white mb-4 opacity-50" />}
                                </div>

                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    <h3 className="text-2xl font-black italic tracking-tight text-slate-900 dark:text-white mb-2 leading-none">
                                        {promo.name}
                                    </h3>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                                        {promo.description || `Aprovecha este increíble ${promo.type === 'percentage' ? 'descuento' : 'regalo'}.`}
                                    </p>

                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                        <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                            Explorar Oferta <ArrowRight size={14} />
                                        </span>
                                    </div>
                                </div>

                                {/* Clickable Area Overlay */}
                                <Link href="/offers" className="absolute inset-0 z-20" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
