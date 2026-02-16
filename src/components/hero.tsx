'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag } from 'lucide-react';

export function Hero() {
    return (
        <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-slate-950">
            {/* Background with Gradient Overlay */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent z-10" />
                <motion.img
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.6 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"
                    alt="Shop Interior"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
            </div>

            <div className="container relative z-20 px-8 mx-auto text-center lg:text-left">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="max-w-4xl"
                >
                    <div className="mb-6 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Nueva Colección 2024</span>
                    </div>

                    <h1 className="text-6xl md:text-9xl font-serif font-black tracking-tighter mb-8 text-white leading-[1] italic">
                        Tu Estilo, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">Tu Esencia.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl leading-relaxed font-medium">
                        Fusionamos la exclusividad de la <span className="text-white">moda personalizada</span> con el cuidado personal artesanal. Una experiencia de lujo para tu día a día.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                        <Button size="lg" className="rounded-2xl px-12 text-lg h-16 gap-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_20px_40px_-10px_rgba(var(--primary),0.4)] transition-all duration-500 w-full sm:w-auto overflow-hidden group">
                            Explorar Ahora <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>

                        <Button size="lg" variant="outline" className="rounded-2xl px-12 text-lg h-16 gap-3 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm w-full sm:w-auto">
                            Custom Studio
                        </Button>
                    </div>
                </motion.div>
            </div>

            {/* Decorative Card */}
            <div className="absolute bottom-12 right-12 hidden xl:block z-20">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="bg-white/10 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/20 shadow-2xl max-w-sm group"
                >
                    <div className="flex items-center gap-6 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg group-hover:rotate-6 transition-transform duration-500">
                            <ShoppingBag size={28} />
                        </div>
                        <div>
                            <h3 className="font-black text-white text-lg tracking-tight">VIP Access</h3>
                            <p className="text-xs text-white/50 uppercase tracking-widest font-black">Lanzamientos Exclusivos</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">Únete a nuestro club selecto y recibe un 15% de descuento en tu primer pedido personalizado.</p>
                </motion.div>
            </div>
        </section>
    );
}
