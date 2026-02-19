'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: 'login' | 'register';
  message?: string | React.ReactNode;
}

export function AuthModal({ open, onOpenChange, defaultView = 'login', message }: AuthModalProps) {
  const [view, setView] = useState<'login' | 'register'>(defaultView);

  const handleSuccess = () => {
    onOpenChange(false);
    setView('login');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {view === 'login' ? 'Bienvenido de nuevo' : 'Crear Cuenta'}
          </DialogTitle>
          <DialogDescription>
            {view === 'login'
              ? 'Inicia sesión para acceder a tu carrito y pedidos'
              : (message || 'Únete a nosotros para empezar a comprar')
            }
          </DialogDescription>
        </DialogHeader>

        {message && view === 'register' && (
          <div className="mx-6 mb-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-800">
            <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium leading-relaxed italic">
              {message}
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {view === 'login' ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <LoginForm
                onSuccess={handleSuccess}
                onSwitchToRegister={() => setView('register')}
              />
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <RegisterForm
                onSuccess={handleSuccess}
                onSwitchToLogin={() => setView('login')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog >
  );
}
