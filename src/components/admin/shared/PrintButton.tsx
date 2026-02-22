'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrintButtonProps {
    className?: string;
    label?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
}

export function PrintButton({
    className,
    label = "Imprimir / PDF",
    variant = "outline",
    size = "sm"
}: PrintButtonProps) {
    return (
        <Button
            variant={variant}
            size={size}
            onClick={() => window.print()}
            className={cn("no-print rounded-xl gap-2 font-bold uppercase italic text-[10px]", className)}
        >
            <Printer size={14} />
            {label}
        </Button>
    );
}
