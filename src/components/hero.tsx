'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag, Sparkles, Palette } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export function Hero() {
    const [vipSettings, setVipSettings] = useState({ enabled: false, description: '' });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    setVipSettings({
                        enabled: data.vip_enabled,
                        description: data.vip_benefits_desc
                    });
                }
            } catch (error) {
                console.error('Error fetching VIP settings:', error);
            }
        };
        fetchSettings();
    }, []);

    return (
        <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-background">
            {/* Background with Gradient Overlay - Light & Golden - SOLID COLOR BASE */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-background">
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background to-transparent z-10 opacity-90" />
                <motion.img
                    initial={{ scale: 1, opacity: 0.15 }}
                    animate={{ scale: 1, opacity: 0.15 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"
                    alt="Shop Interior"
                    className="w-full h-full object-cover filter sepia-[0.3]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />

                {/* Golden Glows */}
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[100px]" />
            </div>

            <div className="container relative z-20 px-8 mx-auto text-center lg:text-left">
                <motion.div
                    initial={{ opacity: 1, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="max-w-4xl"
                >
                    <div className="mb-6 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-primary/20 shadow-md">
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Colección 2026</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl md:text-9xl font-serif font-black tracking-tighter mb-8 text-foreground leading-[1] italic">
                        Tu Estilo, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-600">Tu Esencia.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl leading-relaxed font-medium">
                        Fusionamos la exclusividad de la <span className="text-primary font-bold">moda personalizada</span> con el cuidado personal artesanal. Una experiencia de lujo para tu día a día.
                    </p>

                    <div className="flex flex-col xl:flex-row gap-6 justify-center lg:justify-start items-center">
                        <Link href="/?category=Colección 2026#products" className="w-full sm:w-auto">
                            <Button
                                size="lg"
                                className="relative rounded-2xl px-12 text-lg h-16 gap-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_20px_40px_-10px_rgba(212,175,55,0.6)] transition-all duration-500 w-full sm:w-auto overflow-hidden group border-none ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                {/* Shine effect */}
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />

                                <Sparkles className="w-5 h-5 animate-pulse text-amber-200" />
                                <span className="relative z-10 font-bold tracking-tight">Ver Colección 2026</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                            </Button>
                        </Link>

                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <Link href="/coleccion-legado" className="flex-1 sm:flex-none">
                                <Button size="lg" className="rounded-2xl px-8 text-base h-16 gap-3 border-transparent text-[#e8b4b8] bg-[#3a2c2e] hover:bg-[#2a1c1e] shadow-xl w-full hover:border-[#c9a96e] transition-all">
                                    <Sparkles className="w-5 h-5 text-[#c9a96e]" />
                                    Colección Legado
                                </Button>
                            </Link>

                            <Link href="/?category=Prendas Personalizables#products" className="flex-1 sm:flex-none">
                                <Button size="lg" variant="outline" className="rounded-2xl px-8 text-base h-16 gap-3 border-primary/30 text-primary bg-white hover:bg-slate-50 w-full hover:border-primary transition-all">
                                    <Palette className="w-5 h-5" />
                                    Custom Studio
                                </Button>
                            </Link>

                            <Link href="/#products" className="flex-1 sm:flex-none">
                                <Button variant="ghost" size="lg" className="rounded-2xl px-8 text-base h-16 gap-3 text-muted-foreground hover:text-foreground w-full hover:bg-slate-100/50">
                                    Explorar Ahora
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Decorative Card */}
            {vipSettings.enabled && (
                <div className="absolute bottom-12 right-12 hidden xl:block z-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 1 }}
                        className="bg-white p-8 rounded-[2.5rem] border border-primary/20 shadow-[0_20px_60px_-15px_rgba(212,175,55,0.15)] max-w-sm group hover:-translate-y-2 transition-transform duration-500"
                    >
                        <div className="flex items-center gap-6 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary to-amber-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:rotate-6 transition-transform duration-500">
                                <ShoppingBag size={28} />
                            </div>
                            <div>
                                <h3 className="font-black text-foreground text-lg tracking-tight">VIP Access</h3>
                                <p className="text-xs text-primary uppercase tracking-widest font-black">Lanzamientos Exclusivos</p>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                            {vipSettings.description || 'Únete a nuestro club selecto y recibe un 15% de descuento en tu primer pedido personalizado.'}
                        </p>
                    </motion.div>
                </div>
            )}
        </section>
    );
}
