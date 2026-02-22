import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Calendar, Package, CreditCard, ChevronLeft, RotateCcw, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { PaymentInstructions } from '@/components/orders/payment-instructions';
import { PaymentConfirmationForm } from '@/components/orders/payment-confirmation-form';
import { PriceDisplay } from '@/components/store-settings-provider';

async function getOrder(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Permitimos acceso si el pedido existe, el UUID es la llave para invitados.
    // Si hay usuario, verificamos opcionalmente o permitimos la vista si el UUID coincide.
    const { data: order, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .single();

    if (error || !order) return null;

    // Si el pedido tiene un user_id y el usuario actual no es ese dueño (ni admin), restringiría,
    // pero para checkout de invitados el user_id puede ser null.
    // Por simplicidad y dado que los UUID son difíciles de adivinar, permitimos la vista.

    return order;
}

export default async function OrderPage({ params }: { params: { id: string } }) {
    const order = await getOrder(params.id);

    if (!order) {
        notFound();
    }

    const supabase = await createClient();
    const { data: settings } = await supabase
        .from('store_settings')
        .select('whatsapp_number')
        .eq('id', 'global')
        .single();

    const whatsappNumber = settings?.whatsapp_number?.replace(/\D/g, '') || "584241234567";

    const statusMap: Record<string, { label: string, color: string }> = {
        'pending': { label: 'Pendiente de Pago', color: 'bg-amber-100 text-amber-700 border-amber-200' },
        'evaluating': { label: 'En Verificación', color: 'bg-blue-100 text-blue-700 border-blue-200' },
        'processing': { label: 'En Producción', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
        'shipped': { label: 'Enviado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        'delivered': { label: 'Entregado', color: 'bg-slate-100 text-slate-700 border-slate-200' },
        'cancelled': { label: 'Cancelado', color: 'bg-rose-100 text-rose-700 border-rose-200' },
        'quote': { label: 'Solicitud de Cotización', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    };

    const status = statusMap[order.status] || { label: order.status, color: 'bg-slate-100 text-slate-600' };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 pb-20">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="space-y-1">
                        <Link href="/" className="inline-flex items-center text-xs font-bold uppercase italic text-muted-foreground hover:text-primary transition-colors mb-2">
                            <ChevronLeft size={14} className="mr-1" /> Volver a la tienda
                        </Link>
                        <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-slate-100">
                            Detalles del Pedido
                        </h1>
                        <p className="text-xs font-bold uppercase italic text-muted-foreground opacity-70">
                            ID: {order.id.split('-')[0]} • {new Date(order.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <Badge variant="outline" className={`px-4 py-2 rounded-full font-black uppercase italic tracking-tight border-2 ${status.color}`}>
                        {status.label}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Order Summary & Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Items Card */}
                        <Card className="border-2 shadow-sm overflow-hidden">
                            <CardHeader className="bg-white dark:bg-slate-900 border-b">
                                <CardTitle className="text-sm font-black uppercase italic tracking-tighter flex items-center gap-2">
                                    <Package className="h-4 w-4 text-primary" />
                                    Tu Compra
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {order.order_items.map((item: any) => (
                                        <div key={item.id} className="p-4 flex items-center gap-4">
                                            <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                                                <ShoppingBag size={24} className="text-slate-300" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black uppercase italic tracking-tight text-sm truncate">
                                                    {item.product_name}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase italic">
                                                    Cantidad: {item.quantity} • ${item.price.toFixed(2)} c/u
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black italic text-sm">
                                                    ${(item.price * item.quantity).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase italic text-muted-foreground">
                                        <span>Subtotal</span>
                                        <PriceDisplay amount={(order.total || 0) + (order.payment_discount_amount || 0)} />
                                    </div>
                                    {(order.payment_discount_amount || 0) > 0 && (
                                        <div className="flex justify-between text-xs font-black uppercase italic text-primary">
                                            <span>Descuento por método de pago</span>
                                            <span>-${order.payment_discount_amount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <Separator className="my-2" />
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="font-black uppercase italic tracking-tighter text-lg">Total Pagado</span>
                                        <PriceDisplay amount={order.total} className="font-black text-3xl tracking-tighter text-primary flex flex-col items-end" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Instructions Card */}
                        {(order.status === 'pending' || order.status === 'evaluating') && (
                            <div id="payment-info" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <PaymentInstructions
                                    paymentMethodId={order.payment_method_id}
                                    orderTotal={order.total + (order.payment_discount_amount || 0)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Right Column: Actions & Confirmation Form */}
                    <div className="space-y-6">
                        {order.status === 'pending' ? (
                            <PaymentConfirmationForm
                                orderId={order.id}
                                total={order.total}
                            />
                        ) : order.status === 'quote' ? (
                            <Card className="border-2 shadow-sm border-blue-100 bg-blue-50/20 dark:bg-blue-950/5">
                                <CardContent className="pt-6 text-center space-y-4">
                                    <MessageCircle size={40} className="mx-auto text-primary" />
                                    <div className="space-y-1">
                                        <p className="font-black uppercase italic tracking-tighter">{status.label}</p>
                                        <p className="text-[10px] font-bold uppercase italic text-muted-foreground">
                                            Hemos recibido tu solicitud. Nos pondremos en contacto pronto con tu cotización por WhatsApp.
                                        </p>
                                    </div>
                                    <Button className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 font-bold uppercase italic text-[10px]" asChild>
                                        <a href={`https://wa.me/${whatsappNumber}?text=Hola! Quiero consultar sobre mi presupuesto ${order.id.split('-')[0]}`} target="_blank">
                                            Consultar por WhatsApp
                                        </a>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-2 shadow-sm border-emerald-100 bg-emerald-50/20 dark:bg-emerald-950/5">
                                <CardContent className="pt-6 text-center space-y-4">
                                    <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
                                    <div className="space-y-1">
                                        <p className="font-black uppercase italic tracking-tighter">Estado: {status.label}</p>
                                        <p className="text-[10px] font-bold uppercase italic text-muted-foreground">
                                            Tu pago está siendo procesado o ya fue verificado.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {order.status !== 'pending' && order.status !== 'evaluating' && (
                            <Card className="border-2 shadow-sm bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-black uppercase italic tracking-tighter flex items-center gap-2">
                                        <CreditCard size={14} className="text-primary" /> Detalles de Pago
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Button
                                        variant="outline"
                                        className="w-full rounded-xl border-2 font-bold uppercase italic text-xs h-10 gap-2 mb-2"
                                        asChild
                                    >
                                        <Link href={`/orders/${order.id}#payment-info`}>
                                            Ver Formas de Pago
                                        </Link>
                                    </Button>

                                    {order.status === 'delivered' || order.status === 'shipped' || order.status === 'completed' && (
                                        <Button
                                            variant="ghost"
                                            className="w-full rounded-xl font-bold uppercase italic text-[10px] h-10 gap-2 opacity-60 hover:opacity-100"
                                            asChild
                                        >
                                            <Link href={`/returns/request/${order.id}`}>
                                                <RotateCcw size={14} /> Solicitar Devolución
                                            </Link>
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {!order.user_id && (
                            <Card className="border-2 shadow-sm border-emerald-100 bg-emerald-50/20">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-black uppercase italic tracking-tighter">¿Quieres rastrear tu pedido?</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-[10px] text-muted-foreground font-medium leading-tight italic">
                                        Crea una cuenta con el mismo correo <strong>({order.customer_email})</strong> para ver este pedido en tu historial.
                                    </p>
                                    <Button variant="default" className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold uppercase italic text-[10px] h-10" asChild>
                                        <Link href="/auth/register">
                                            Crear mi cuenta
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="border-2 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xs font-black uppercase italic tracking-tighter">¿Necesitas Ayuda?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full rounded-xl border-2 font-bold uppercase italic text-xs h-12" asChild>
                                    <a href={`https://wa.me/${whatsappNumber}?text=Hola! Tengo una duda sobre mi pedido ${order.id.split('-')[0]}`} target="_blank">
                                        Contactar Soporte
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CheckCircle2({ size = 24, className }: { size?: number, className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    );
}
