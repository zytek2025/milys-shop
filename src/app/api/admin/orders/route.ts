import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase/server';

// GET /api/admin/orders - Get all orders
export async function GET() {
    try {
        const supabase = await createClient();
        if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                control_id,
                profiles (email, full_name, whatsapp),
                order_items (*, products(name), product_variants(size, color, color_hex)),
                payment_confirmations (*)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/admin/orders/[id] - Update order status
// Note: This needs to be in [id]/route.ts but I'll create the base first
