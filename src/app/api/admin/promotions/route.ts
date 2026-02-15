import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function isAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    return profile?.role === 'admin';
}

// GET /api/admin/promotions - List all promotions
export async function GET() {
    try {
        if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('promotions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/admin/promotions - Create a new promotion
export async function POST(req: Request) {
    try {
        if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const body = await req.json();
        const supabase = await createClient();

        const {
            name, description, type, target_type, target_id, value,
            min_quantity, min_orders_required, min_order_value_condition,
            reward_product_id, start_date, end_date, is_active
        } = body;

        const { data, error } = await supabase
            .from('promotions')
            .insert([{
                name, description, type, target_type, target_id, value,
                min_quantity: min_quantity || 1,
                min_orders_required: min_orders_required || 0,
                min_order_value_condition: min_order_value_condition || 0,
                reward_product_id: reward_product_id || null,
                start_date, end_date: end_date || null,
                is_active: is_active ?? true
            }])
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
