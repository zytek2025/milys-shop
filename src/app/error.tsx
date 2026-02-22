'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Optionally log the error to an error reporting service
        console.error('Unhandled Application Error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 font-sans">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-3xl font-black mb-2 uppercase tracking-tight text-slate-900 dark:text-white text-center">
                Algo salió mal
            </h2>
            <p className="text-muted-foreground mb-6 text-center max-w-sm">
                Ocurrió un error inesperado al procesar tu solicitud.
                {error.digest && (
                    <span className="block mt-2 text-[10px] font-mono opacity-50">
                        Error ID (Digest): {error.digest}
                    </span>
                )}
            </p>

            <div className="flex gap-4">
                <button
                    onClick={() => reset()}
                    className="h-12 px-6 inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-full font-bold hover:scale-105 active:scale-95 transition-all text-sm"
                >
                    Intentar de nuevo
                </button>
                <Link
                    href="/"
                    className="h-12 px-6 inline-flex items-center justify-center bg-primary text-white rounded-full font-bold hover:scale-105 active:scale-95 transition-all text-sm"
                >
                    Ir al Inicio
                </Link>
            </div>
        </div>
    );
}
