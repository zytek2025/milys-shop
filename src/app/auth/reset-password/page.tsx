'use client';

import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { motion } from 'framer-motion';

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-primary/5 border border-slate-200/50 dark:border-slate-800/50 p-8 sm:p-12"
            >
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        Mily's Shop
                    </h1>
                    <div className="w-12 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto rounded-full mt-2" />
                </div>

                <ResetPasswordForm />

                <p className="mt-8 text-center text-xs text-muted-foreground uppercase tracking-widest font-bold">
                    Diseña tu Huella. Cuida tu Esencia.
                </p>
            </motion.div>
        </div>
    );
}
