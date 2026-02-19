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
import { OrderSummary } from './order-summary';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: 'login' | 'register' | 'summary';
  message?: string | React.ReactNode;
}

export function AuthModal({ open, onOpenChange, defaultView = 'login', message }: AuthModalProps) {
  const [view, setView] = useState<'login' | 'register' | 'summary'>(defaultView);

  // Update view when defaultView prop changes
  if (defaultView !== view && !open) {
    setView(defaultView);
  }

  const handleSuccess = () => {
    onOpenChange(false);
    setView('login');
  };

  const getTitle = () => {
    switch (view) {
      case 'login': return 'Bienvenido de nuevo';
      case 'register': return 'Crear Cuenta';
      case 'summary': return 'Resumen del Pedido';
      default: return '';
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {view === 'login' && 'Inicia sesión para acceder a tu carrito y pedidos'}
            {view === 'register' && 'Por favor indica tus datos a continuación'}
            {view === 'summary' && 'Revisa los detalles antes de finalizar'}
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
          ) : view === 'register' ? (
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
          ) : (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <OrderSummary
                onConfirm={() => setView('register')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog >
  );
}
