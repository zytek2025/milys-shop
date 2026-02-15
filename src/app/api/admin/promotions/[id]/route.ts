import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function isAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    return profile?.role === 'admin';
}

// PATCH /api/admin/promotions/[id] - Update a promotion
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { id } = await params;
        const body = await req.json();
        const supabase = await createClient();

        const {
            name, description, type, target_type, target_id, value,
            min_quantity, min_orders_required, min_order_value_condition,
            reward_product_id, start_date, end_date, is_active
        } = body;

        const { data, error } = await supabase
            .from('promotions')
            .update({
                name, description, type, target_type, target_id, value,
                min_quantity,
                min_orders_required,
                min_order_value_condition,
                reward_product_id: reward_product_id || null,
                start_date,
                end_date: end_date || null,
                is_active,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/admin/promotions/[id] - Delete a promotion
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { id } = await params;
        const supabase = await createClient();

        const { error } = await supabase
            .from('promotions')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
