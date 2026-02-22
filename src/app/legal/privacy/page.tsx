import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 pb-20">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-xs font-bold uppercase italic text-muted-foreground hover:text-primary transition-colors mb-2">
                        <ChevronLeft size={14} className="mr-1" /> Volver a la tienda
                    </Link>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-slate-100">
                        Política de Privacidad
                    </h1>
                    <p className="text-xs font-bold uppercase italic text-muted-foreground opacity-70">
                        Última actualización: Febrero 2024
                    </p>
                </div>

                <Card className="border-2 shadow-sm">
                    <CardContent className="p-8 prose prose-slate dark:prose-invert max-w-none">
                        <h2 className="text-xl font-black uppercase italic tracking-tight mb-4">1. Recopilación de Información</h2>
                        <p>
                            Recopilamos información cuando usted se registra en nuestro sitio, realiza un pedido, se suscribe a nuestro boletín o completa un formulario. La información recopilada incluye su nombre, dirección de correo electrónico, número de teléfono y dirección de envío.
                        </p>

                        <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 mt-8">2. Uso de la Información</h2>
                        <p>
                            Cualquiera de la información que recopilamos de usted puede ser utilizada para:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Personalizar su experiencia y responder a sus necesidades individuales.</li>
                            <li>Mejorar nuestro sitio web y el servicio al cliente.</li>
                            <li>Procesar transacciones.</li>
                            <li>Enviar correos electrónicos periódicos o mensajes de WhatsApp sobre su pedido o promociones.</li>
                        </ul>

                        <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 mt-8">3. Protección de la Información</h2>
                        <p>
                            Implementamos una variedad de medidas de seguridad para mantener la seguridad de su información personal. Utilizamos encriptación avanzada para proteger los datos sensibles transmitidos en línea.
                        </p>

                        <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 mt-8">4. Uso de Cookies</h2>
                        <p>
                            Utilizamos cookies para mejorar el acceso a nuestro sitio e identificar a los visitantes recurrentes. Nuestras cookies mejoran la experiencia del usuario al rastrear y orientar sus intereses. Sin embargo, este uso de cookies no está de ninguna manera vinculado a ninguna información de identificación personal en nuestro sitio.
                        </p>

                        <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 mt-8">5. Divulgación a Terceros</h2>
                        <p>
                            No vendemos, intercambiamos ni transferimos de ninguna otra manera a terceros su información de identificación personal. Esto no incluye a terceros de confianza que nos asisten en la operación de nuestro sitio web o en la prestación de servicios, siempre que dichas partes acuerden mantener esta información confidencial.
                        </p>

                        <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 mt-8">6. Consentimiento</h2>
                        <p>
                            Al utilizar nuestro sitio, usted acepta nuestra política de privacidad.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
