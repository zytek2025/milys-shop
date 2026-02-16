'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLogout } from '@/hooks/use-auth';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock } from 'lucide-react';

const TIMEOUT_DURATION = 60 * 60 * 1000; // 1 hour in ms

export function SessionTimeout() {
    const { isAuthenticated } = useAuth();
    const logout = useLogout();
    const [showWarning, setShowWarning] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setShowWarning(false);

        if (isAuthenticated) {
            timerRef.current = setTimeout(() => {
                setShowWarning(true);
            }, TIMEOUT_DURATION);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            resetTimer();
        } else {
            if (timerRef.current) clearTimeout(timerRef.current);
            setShowWarning(false);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isAuthenticated]);

    const handleContinue = () => {
        resetTimer();
    };

    const handleLogout = () => {
        setShowWarning(false);
        logout.mutate();
    };

    if (!showWarning) return null;

    return (
        <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
            <AlertDialogContent className="max-w-md border-primary/20 bg-background/95 backdrop-blur-none bg-white dark:bg-slate-900 shadow-2xl">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
                <AlertDialogHeader>
                    <div className="mx-auto mb-4 bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
                        <Clock className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <AlertDialogTitle className="text-2xl font-black text-center text-foreground font-serif italic">
                        ¿Sigues ahí?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center font-medium pt-2 text-muted-foreground">
                        Por seguridad, tu sesión ha estado activa por 1 hora.
                        ¿Deseas continuar trabajando o cerrar sesión?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:justify-center gap-4 mt-6">
                    <button
                        onClick={handleLogout}
                        className="px-6 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-sm transition-all"
                    >
                        Cerrar Sesión
                    </button>
                    <button
                        onClick={handleContinue}
                        className="px-8 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 transition-all hover:scale-105"
                    >
                        Continuar Sesión
                    </button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
