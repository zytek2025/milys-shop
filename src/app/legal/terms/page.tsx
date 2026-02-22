import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 pb-20">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-xs font-bold uppercase italic text-muted-foreground hover:text-primary transition-colors mb-2">
                        <ChevronLeft size={14} className="mr-1" /> Volver a la tienda
                    </Link>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-slate-100">
                        Términos y Condiciones
                    </h1>
                    <p className="text-xs font-bold uppercase italic text-muted-foreground opacity-70">
                        Última actualización: Febrero 2024
                    </p>
                </div>

                <Card className="border-2 shadow-sm">
                    <CardContent className="p-8 prose prose-slate dark:prose-invert max-w-none">
                        <h2 className="text-xl font-black uppercase italic tracking-tight mb-4">1. Aceptación de los Términos</h2>
                        <p>
                            Al acceder y utilizar este sitio web (Mily's Shop), usted acepta cumplir y estar sujeto a los siguientes términos y condiciones de uso. Si no está de acuerdo con alguna parte de estos términos, no podrá utilizar nuestros servicios.
                        </p>

                        <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 mt-8">2. Pedidos y Productos</h2>
                        <p>
                            Nos reservamos el derecho de rechazar cualquier pedido que realice con nosotros. Podemos, a nuestra entera discreción, limitar o cancelar las cantidades compradas por persona, por hogar o por pedido.
                            Los precios de nuestros productos están sujetos a cambios sin previo aviso.
                        </p>

                        <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 mt-8">3. Productos Personalizados (Custom Studio)</h2>
                        <p>
                            Mily's Shop ofrece servicios de personalización. Usted es responsable de asegurar que cualquier texto, imagen o especificación proporcionada para la personalización no infrinja derechos de autor de terceros.
                            Una vez iniciado el proceso de producción de un artículo personalizado, no se aceptarán cancelaciones.
                        </p>

                        <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 mt-8">4. Pagos y Seguridad</h2>
                        <p>
                            Utilizamos métodos de pago seguros y no almacenamos sus datos bancarios directamente. Los pedidos se procesarán una vez confirmado el pago. En el caso de presupuestos, el pago se acordará tras la cotización final.
                        </p>

                        <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 mt-8">5. Propiedad Intelectual</h2>
                        <p>
                            Todo el contenido incluido en este sitio, como texto, gráficos, logotipos, imágenes y software, es propiedad de Mily's Shop o de sus proveedores de contenido y está protegido por las leyes de propiedad intelectual.
                        </p>

                        <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 mt-8">6. Limitación de Responsabilidad</h2>
                        <p>
                            Mily's Shop no será responsable de ningún daño directo, indirecto, incidental o consecuente que resulte del uso o la imposibilidad de usar este sitio o nuestros productos.
                        </p>

                        <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 mt-8">7. Ley Aplicable</h2>
                        <p>
                            Estos términos se regirán e interpretarán de acuerdo con las leyes vigentes en el territorio de operaciones de la tienda.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
