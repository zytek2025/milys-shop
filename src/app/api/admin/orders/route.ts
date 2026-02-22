import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient, isAdmin } from '@/lib/supabase/server'; // Added createAdminClient

// GET /api/admin/orders - Get all orders
export async function GET(request: NextRequest) { // Added request: NextRequest
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const supabase = await createClient(); // Reversed back to normal client

        let query = supabase
            .from('orders')
            .select(`
                *,
                profiles (email, full_name, whatsapp),
                items:order_items (
                    *,
                    product:products (name),
                    variant:product_variants (size, color, color_hex)
                ),
                payment_confirmations (*)
            `)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/admin/orders - Create new order or quote (Admin POS)
export async function POST(request: NextRequest) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const adminSupabase = await createAdminClient();
        const { data: { user: currentUser } } = await adminSupabase.auth.getUser();

        const body = await request.json();
        const {
            items,
            total,
            shipping_address,
            customer_name,
            customer_email,
            customer_phone,
            is_quote = false
        } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No items in order' }, { status: 400 });
        }

        // 1. Create order
        const orderStatus = is_quote ? 'quote' : 'pending';

        const { data: order, error: orderError } = await adminSupabase
            .from('orders')
            .insert({
                user_id: null, // Admin created orders might not have a registered user ID initially
                total: Number(total),
                status: orderStatus,
                shipping_address,
                customer_name,
                customer_email,
                customer_phone
            })
            .select()
            .single();

        if (orderError) {
            console.error('Order creation error:', orderError);
            return NextResponse.json({ error: orderError.message }, { status: 500 });
        }

        // 2. Create order items
        const orderItems = items.map((item: any) => ({
            order_id: order.id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            custom_metadata: item.custom_metadata || [],
            on_request: item.on_request || false
        }));

        const { error: itemsError } = await adminSupabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('Order items error:', itemsError);
            // Optionally rollback order creation here
            return NextResponse.json({ error: itemsError.message }, { status: 500 });
        }

        // 3. Stock deduction if it's an active order (not a quote)
        if (!is_quote) {
            for (const item of items) {
                if (item.variant_id && !item.on_request) {
                    await adminSupabase.from('stock_movements').insert({
                        variant_id: item.variant_id,
                        quantity: -item.quantity,
                        type: 'order',
                        reason: `Venta POS interna #${order.id.slice(0, 8)}`,
                        created_by: currentUser?.id
                    });
                }
            }
        }

        // 4. Return created order
        return NextResponse.json(order);

    } catch (error: any) {
        console.error('Admin order creation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
