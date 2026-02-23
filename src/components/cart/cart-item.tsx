'use client';

import { motion } from 'framer-motion';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PriceDisplay } from '@/components/store-settings-provider';
import type { CartItem } from '@/types';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  isUpdating?: boolean;
  isRemoving?: boolean;
}

export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  isUpdating,
  isRemoving
}: CartItemRowProps) {
  const product = item.product;
  const variant = item.variant;

  // Precio base (con override si existe)
  const basePrice = variant?.price_override ?? product?.price ?? 0;

  // Estructura de metadatos (soporta formato nuevo y antiguo)
  const metadata = (item.custom_metadata || {}) as any;
  const isOnRequest = metadata?.on_request === true;
  const budgetRequest = metadata?.budget_request;

  const isNewFormat = !Array.isArray(metadata) && (!!metadata.designs || !!metadata.budget_request?.designs);
  const designList = (isNewFormat
    ? (metadata.budget_request?.designs || metadata.designs || [])
    : (Array.isArray(metadata) ? metadata : [])
  ) as any[];
  const personalization = isNewFormat ? metadata.personalization : null;
  const personalizationText = typeof personalization === 'string' ? personalization : (personalization?.text || '');
  const personalizationSize = personalization?.size || null;
  const personalizationPrice = personalization?.price || 0;

  // Precio de los logos + texto
  const designsPrice = Array.isArray(designList) ? designList.reduce((sum: number, d: any) => sum + (d.price || 0), 0) : 0;
  const finalPrice = basePrice + designsPrice + personalizationPrice;
  const subtotal = finalPrice * (item.quantity || 1);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 py-4 border-b last:border-b-0"
    >
      {/* Product Image */}
      <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {product?.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            Sin img
          </div>
        )}

        {/* Overlay preview for custom designs if it's a quote request */}
        {isOnRequest && (budgetRequest?.image_url || budgetRequest?.designs?.[0]?.image_url) && (
          <div className="absolute bottom-0 right-0 w-8 h-8 rounded-tl-lg overflow-hidden border-t border-l border-white shadow-lg bg-white">
            <img
              src={budgetRequest.image_url || budgetRequest.designs[0].image_url}
              alt="Tu diseño"
              className="w-full h-full object-contain p-0.5"
            />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-medium text-sm line-clamp-1">
            {product?.name || 'Producto Desconocido'}
          </h4>
          {isOnRequest && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-black uppercase tracking-tighter">
              A Cotizar
            </span>
          )}
        </div>

        {/* Talla y Color si hay variante */}
        {(variant?.size || variant?.color) && (
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">
            {variant.color && <span>{variant.color}</span>}
            {variant.color && variant.size && <span> / </span>}
            {variant.size && <span>Talla {variant.size}</span>}
          </p>
        )}

        <div className="flex items-center gap-2">
          <div className="text-sm font-bold text-primary">
            {isOnRequest ? (
              <span className="text-amber-600 italic">Precio pendiente</span>
            ) : (
              <PriceDisplay amount={finalPrice} />
            )}
          </div>
          {isOnRequest && finalPrice > 0 && (
            <div className="text-[10px] text-muted-foreground line-through decoration-slate-300">
              <PriceDisplay amount={finalPrice} />
            </div>
          )}
        </div>

        {/* Listado de Diseños y Personalización */}
        {designList.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {designList.map((design: any, idx: number) => (
              <div key={idx} className="flex flex-col bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  {design.name} (${design.price})
                </span>
                {(design.size || design.location) && (
                  <span className="text-[8px] text-slate-400 mt-0.5">
                    {design.size && <span>{design.size}</span>}
                    {design.size && design.location && <span> @ </span>}
                    {design.location && <span>{design.location}</span>}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {isOnRequest && budgetRequest?.notes && (
          <div className="mt-1 px-2 py-1 rounded bg-amber-50/50 border border-amber-100">
            <p className="text-[8px] font-bold text-amber-700 uppercase tracking-tighter line-clamp-2 italic">
              Nota: {budgetRequest.notes}
            </p>
          </div>
        )}

        {personalizationText && (
          <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-primary/20">
            <p className="text-[8px] uppercase font-black text-primary tracking-widest mb-0.5">
              Personalización {personalizationSize && `(${personalizationSize === 'small' ? 'Puequeño' : 'Grande'})`}
            </p>
            <p className="text-xs font-medium italic text-slate-600 dark:text-slate-300">"{personalizationText}"</p>
          </div>
        )}
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          disabled={isUpdating || item.quantity <= 1}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center text-sm font-medium">
          {item.quantity}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          disabled={isUpdating || (product?.stock !== undefined && item.quantity >= product.stock)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Subtotal & Remove */}
      <div className="flex flex-col items-end gap-1">
        <span className="font-semibold text-sm">
          <PriceDisplay amount={subtotal} />
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(item.id)}
          disabled={isRemoving}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
