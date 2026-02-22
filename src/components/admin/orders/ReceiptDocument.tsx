'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface ReceiptDocumentProps {
    order: any;
    settings: any;
}

export function ReceiptDocument({ order, settings }: ReceiptDocumentProps) {
    if (!order) return null;

    const items = order.order_items || [];
    const subtotal = order.total_amount || 0;
    const exchangeRate = settings?.exchange_rate || 1;
    const subtotalVes = subtotal * exchangeRate;

    return (
        <div className="bg-white p-8 text-slate-900 font-sans print:p-0 print:m-0" id="receipt-document">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 mb-1">
                        Recibo <span className="text-primary prose-stone"># {order.id?.slice(0, 8).toUpperCase()}</span>
                    </h1>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Mily's Store - Comprobante de Pago</p>
                </div>
                <div className="text-right">
                    <p className="text-lg font-black uppercase italic">{new Date(order.created_at).toLocaleDateString('es-VE')}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Control ID: {order.control_id || 'N/A'}</p>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-12 mb-10">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Cliente</p>
                    <h2 className="text-xl font-black italic uppercase tracking-tight">{order.profiles?.full_name || 'Consumidor Final'}</h2>
                    <p className="text-sm font-medium text-slate-600 mt-1">{order.profiles?.email}</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{order.profiles?.whatsapp || ''}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Estado del Pedido</p>
                    <div className={cn(
                        "inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic border-2",
                        order.status === 'completed' ? "bg-emerald-50 border-emerald-500 text-emerald-600" :
                            order.status === 'processing' ? "bg-blue-50 border-blue-500 text-blue-600" : "bg-slate-50 border-slate-500 text-slate-600"
                    )}>
                        {order.status === 'completed' ? 'Completado' : order.status === 'processing' ? 'En Proceso' : 'Pendiente'}
                    </div>
                </div>
            </div>

            {/* Table */}
            <table className="w-full mb-10 overflow-hidden">
                <thead className="bg-slate-900 text-white">
                    <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest italic">Descripción</th>
                        <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest italic">Cant.</th>
                        <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest italic">P. Unit</th>
                        <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest italic">Subtotal</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 border-x border-b border-slate-100">
                    {items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4">
                                <p className="font-black text-sm uppercase italic tracking-tight">{item.products?.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1">
                                    {item.product_variants?.size && `Talla: ${item.product_variants.size}`}
                                    {item.product_variants?.color && ` | Color: ${item.product_variants.color}`}
                                </p>
                            </td>
                            <td className="px-4 py-4 text-center font-bold text-sm">{item.quantity}</td>
                            <td className="px-4 py-4 text-right font-medium text-sm">${Number(item.unit_price).toFixed(2)}</td>
                            <td className="px-4 py-4 text-right font-black text-sm">${(item.quantity * item.unit_price).toFixed(2)}</td>
                        </tr>
                    ))}
                    {items.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-4 py-10 text-center text-slate-400 italic font-medium">No hay productos vinculados.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end pr-4">
                <div className="w-72 space-y-3">
                    <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[10px] font-black uppercase tracking-widest">Base Imponible</span>
                        <span className="font-bold text-sm">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[10px] font-black uppercase tracking-widest">Impuestos (IVA 0%)</span>
                        <span className="font-bold text-sm">$0.00</span>
                    </div>
                    <div className="flex justify-between items-center border-t-2 border-slate-100 pt-3">
                        <span className="text-[10px] font-black uppercase tracking-widest italic text-slate-900">Total USD</span>
                        <span className="text-2xl font-black italic tracking-tighter text-slate-900">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Equivalente Bs.</span>
                        <span className="text-lg font-black text-primary">Bs. {subtotalVes.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-20 border-t border-slate-100 pt-8 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-4 italic">Gracias por su Compra</p>
                <div className="grid grid-cols-3 gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <p>Mily's Store Online</p>
                    <p>Soporte: info@milysstore.com</p>
                    <p>Tasa del día: {exchangeRate.toFixed(2)}</p>
                </div>
            </div>

            {/* Print styles optimization */}
            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    header, nav, aside, footer, .no-print, button {
                        display: none !important;
                    }
                    #receipt-document {
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
