import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { Order, OrderWithItems, OrderItem, ApiResponse } from '@/types';

// GET /api/orders - Get user's orders
export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    // Get order items for each order
    const ordersWithItems: OrderWithItems[] = await Promise.all(
      (orders || []).map(async (order) => {
        const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        return {
          ...order,
          items: items || [],
        } as OrderWithItems;
      })
    );

    return NextResponse.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, total, shipping_address, credit_applied } = body;

    const usedCredit = Number(credit_applied || 0);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 });
    }

    // 1. Validate and subtract store credit if used
    if (usedCredit > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('store_credit')
        .eq('id', user.id)
        .single();

      const availableCredit = Number(profile?.store_credit || 0);
      if (usedCredit > availableCredit) {
        return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 });
      }

      // Subtract credit
      await supabase
        .from('profiles')
        .update({ store_credit: availableCredit - usedCredit })
        .eq('id', user.id);

      // Record history
      await supabase.from('store_credit_history').insert({
        profile_id: user.id,
        amount: -usedCredit,
        type: 'purchase',
        reason: 'Uso de saldo en compra',
        created_by: user.id
      });
    }

    // 2. Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total: total - usedCredit, // Total que el usuario PAGARÁ externamente
        credit_applied: usedCredit,
        status: 'pending',
        shipping_address,
      })
      .select()
      .single();

    if (orderError) {
      // Revert credit if order fails
      if (usedCredit > 0) {
        const { data: currentP } = await supabase.from('profiles').select('store_credit').eq('id', user.id).single();
        await supabase.from('profiles').update({ store_credit: (currentP?.store_credit || 0) + usedCredit }).eq('id', user.id);
        // Note: History ideally should be deleted or marked as reverted.
      }
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // 3. Create order items
    const orderItems = items.map((item: any) => {
      // Precio total = base (o override) + logos
      const itemPrice = item.price;

      return {
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: itemPrice,
        custom_metadata: item.custom_metadata || [],
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Delete the order if items fail
      await supabase.from('orders').delete().eq('id', order.id);
      // Also revert credit
      if (usedCredit > 0) {
        const { data: currentP } = await supabase.from('profiles').select('store_credit').eq('id', user.id).single();
        await supabase.from('profiles').update({ store_credit: (currentP?.store_credit || 0) + usedCredit }).eq('id', user.id);
      }
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: order,
      message: 'Order created successfully',
    } as ApiResponse<Order>);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
