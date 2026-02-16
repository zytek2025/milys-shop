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
        <section className="py-16 bg-muted/30 overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                    <div>
                        <Badge className="mb-3 bg-primary text-primary-foreground border-none px-3 py-1 text-xs uppercase tracking-widest font-black shadow-md">
                            Limited Time only
                        </Badge>
                        <h2 className="text-4xl md:text-5xl font-serif font-black tracking-tighter text-foreground italic">
                            Ofertas <span className="text-primary decoration-wavy underline decoration-2 underline-offset-4">Destacadas</span>
                        </h2>
                    </div>
                    <Button variant="ghost" className="text-muted-foreground hover:text-primary gap-2 hover:bg-transparent" asChild>
                        <Link href="/offers">
                            Ver todas las ofertas <ArrowRight size={16} />
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {promotions.slice(0, 3).map((promo, index) => (
                        <Card key={promo.id} className="group relative border-none overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-500 bg-white rounded-[2rem] h-[280px]">
                            {/* Background Decoration - Soft Pastels */}
                            <div className={`absolute inset-0 opacity-100 transition-opacity bg-gradient-to-br ${index === 0 ? 'from-secondary to-white' :
                                index === 1 ? 'from-accent to-white' :
                                    'from-primary/10 to-white'
                                }`} />

                            <div className="absolute top-4 right-4 z-20">
                                <div className="h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center font-black text-primary text-lg rotate-12 group-hover:rotate-0 transition-all duration-500 ring-2 ring-white/50">
                                    {promo.type === 'percentage' ? `-${promo.value}%` : <Gift size={20} />}
                                </div>
                            </div>

                            <CardContent className="relative z-10 h-full flex flex-col justify-end p-8">
                                <div className="mb-auto pt-6">
                                    {promo.type === 'bogo' && <Tag size={32} className="text-foreground mb-4 opacity-30" />}
                                    {promo.type === 'percentage' && <Percent size={32} className="text-foreground mb-4 opacity-30" />}
                                    {promo.type === 'gift' && <Gift size={32} className="text-foreground mb-4 opacity-30" />}
                                </div>

                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    <h3 className="text-2xl font-serif font-black italic tracking-tight text-foreground mb-2 leading-none">
                                        {promo.name}
                                    </h3>
                                    <p className="text-sm font-medium text-muted-foreground mb-4 line-clamp-2">
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
