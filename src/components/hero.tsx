'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag } from 'lucide-react';

export function Hero() {
    return (
        <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
            {/* Background with Gradient Overlay */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
                <img
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"
                    alt="Shop Interior"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            </div>

            <div className="container relative z-20 px-4 mx-auto text-center md:text-left">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="max-w-3xl"
                >
                    <h1 className="text-5xl md:text-8xl font-serif font-light tracking-tight mb-8 text-[#333333] leading-[1.1]">
                        Diseña tu Huella. <br />
                        <span className="text-[#6B6B8B] italic">Cuida tu Esencia.</span>
                    </h1>

                    <p className="text-2xl text-[#555555] mb-10 max-w-2xl leading-relaxed font-light">
                        Mily's Shop fusiona la exclusividad de la moda personalizada con el cuidado personal artesanal. Estilo <span className="font-semibold italic">Soft Luxury</span> para tu día a día.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center md:justify-start">
                        <a href="#products">
                            <Button size="lg" className="rounded-full px-10 text-lg h-14 gap-2 bg-primary hover:bg-primary/80 text-primary-foreground shadow-xl shadow-lavanda/20 transition-all duration-500 w-full sm:w-auto">
                                Ver Colección <ArrowRight className="w-5 h-5" />
                            </Button>
                        </a>
                        <a href="#products">
                            <Button size="lg" variant="outline" className="rounded-full px-10 text-lg h-14 gap-2 border-lavanda text-foreground hover:bg-lavanda/10 w-full sm:w-auto">
                                Custom Studio
                            </Button>
                        </a>
                    </div>
                </motion.div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute bottom-10 right-10 hidden lg:block z-20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="bg-card/80 backdrop-blur-md p-6 rounded-2xl border border-border/50 shadow-xl max-w-xs"
                >
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                            <ShoppingBag size={24} />
                        </div>
                        <div>
                            <h3 className="font-semibold">Nuevas Llegadas</h3>
                            <p className="text-xs text-muted-foreground">Colección Verano 2024</p>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Mira las últimas tendencias de esta semana.</p>
                </motion.div>
            </div>
        </section>
    );
}
