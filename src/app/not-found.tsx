import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-3xl font-black mb-2 uppercase tracking-tight">Página no encontrada</h2>
            <p className="text-muted-foreground mb-8 text-center max-w-sm">
                No pudimos encontrar el producto o la página que estás buscando. Es posible que haya sido eliminado o el enlace sea incorrecto.
            </p>
            <Link
                href="/"
                className="h-12 px-8 inline-flex items-center justify-center bg-primary text-white rounded-full font-bold hover:scale-105 active:scale-95 transition-all"
            >
                Volver a la Tienda
            </Link>
        </div>
    );
}
