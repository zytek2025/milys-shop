import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ReturnsPage() {
    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 pb-20">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-xs font-bold uppercase italic text-muted-foreground hover:text-primary transition-colors mb-2">
                        <ChevronLeft size={14} className="mr-1" /> Volver a la tienda
                    </Link>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-slate-100">
                        Política de Devoluciones
                    </h1>
                    <p className="text-xs font-bold uppercase italic text-muted-foreground opacity-70">
                        Última actualización: Febrero 2024
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="border-2 border-emerald-100 bg-emerald-50/20 dark:bg-emerald-950/5">
                        <CardContent className="pt-6 text-center space-y-2">
                            <RotateCcw className="mx-auto text-emerald-500" size={24} />
                            <p className="text-xs font-black uppercase italic">Cambios Permitidos</p>
                            <p className="text-[10px] text-muted-foreground font-medium">Hasta 15 días después de la compra.</p>
                        </CardContent>
                    </Card>
                    <Card className="border-2 border-amber-100 bg-amber-50/20 dark:bg-amber-950/5">
                        <CardContent className="pt-6 text-center space-y-2">
                            <AlertTriangle className="mx-auto text-amber-500" size={24} />
                            <p className="text-xs font-black uppercase italic">No hay Reembolsos</p>
                            <p className="text-[10px] text-muted-foreground font-medium">Se emitirá saldo a favor en la tienda.</p>
                        </CardContent>
                    </Card>
                    <Card className="border-2 border-rose-100 bg-rose-50/20 dark:bg-rose-950/5">
                        <CardContent className="pt-6 text-center space-y-2">
                            <AlertTriangle className="mx-auto text-rose-500" size={24} />
                            <p className="text-xs font-black uppercase italic">Personalizados</p>
                            <p className="text-[10px] text-muted-foreground font-medium">No se admiten cambios en diseños a medida.</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-2 shadow-sm">
                    <CardContent className="p-8 prose prose-slate dark:prose-invert max-w-none">
                        <h2 className="text-xl font-black uppercase italic tracking-tight mb-4">Condiciones Generales de Cambio</h2>
                        <p>
                            En Mily's Shop nuestra prioridad es que ames tus productos. Si por alguna razón no estás satisfecho con tu compra (excluyendo artículos personalizados), puedes solicitar un cambio bajo las siguientes condiciones:
                        </p>
                        <ul className="list-none pl-0 space-y-4 my-6">
                            <li className="flex gap-3 items-start">
                                <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={18} />
                                <span>El producto debe estar en perfectas condiciones, sin señales de uso y en su empaque original.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={18} />
                                <span>La solicitud debe realizarse dentro de los <strong>15 días naturales</strong> posteriores a la recepción del pedido.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={18} />
                                <span>Debe presentar el comprobante de compra o número de pedido.</span>
                            </li>
                        </ul>

                        <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 mt-8">Excepciones: Productos Personalizados</h2>
                        <p className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border-l-4 border-primary italic">
                            Debido a la naturaleza propia de los productos diseñados en nuestro <strong>Custom Studio</strong> o bajo presupuesto específico, no se aceptan cambios ni devoluciones una vez que el producto ha sido personalizado según sus instrucciones, a menos que presente un defecto de fabricación claro.
                        </p>

                        <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 mt-8">Proceso de Saldo a Favor</h2>
                        <p>
                            No realizamos reembolsos de dinero en efectivo o transferencias bancarias. En caso de una devolución aprobada:
                        </p>
                        <ol className="list-decimal pl-6 space-y-2">
                            <li>Se verificará el estado del producto recibido.</li>
                            <li>Si el cambio es por un producto de menor valor, la diferencia se cargará como <strong>Saldo a Favor</strong> en su cuenta de usuario.</li>
                            <li>Este saldo podrá ser utilizado en cualquier compra futura y no tiene fecha de vencimiento.</li>
                        </ol>

                        <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 mt-8">¿Cómo solicitar un cambio?</h2>
                        <p>
                            Para iniciar el proceso, puede dirigirse a su historial de pedidos y seleccionar "Solicitar Devolución" en el pedido correspondiente, o contactarnos directamente por WhatsApp con su número de orden.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
