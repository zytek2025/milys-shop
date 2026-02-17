import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { OrderWithItems, ApiResponse } from '@/types';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// GET /api/orders/[id] - Get single order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const publicClient = getSupabaseClient();

    // Get order
    const { data: order, error: orderError } = await publicClient
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get order items
    const { data: items, error: itemsError } = await publicClient
      .from('order_items')
      .select('*')
      .eq('order_id', id);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    const orderWithItems: OrderWithItems = {
      ...order,
      items: items || [],
    };

    return NextResponse.json(orderWithItems);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
// PATCH /api/orders/[id] - Update order (payment method)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { payment_method_id } = body;

    // 1. Get Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Order cannot be modified' }, { status: 400 });
    }

    // 2. Get Payment Method Details
    const { data: settings } = await supabase
      .from('store_settings')
      .select('payment_methods')
      .eq('id', 'global')
      .single();

    const methods = (settings?.payment_methods as any[]) || [];
    const selectedMethod = methods.find(m => m.id === payment_method_id);

    if (!selectedMethod) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    // 3. Recalculate Total
    // base_amount = total_actual + descuento_actual
    const baseAmount = Number(order.total) + Number(order.payment_discount_amount || 0);
    const discountAmount = selectedMethod.is_discount_active
      ? baseAmount * (selectedMethod.discount_percentage / 100)
      : 0;
    const finalTotal = baseAmount - discountAmount;

    // 4. Update Order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_method_id,
        payment_discount_amount: discountAmount,
        total: finalTotal
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 5. Trigger Webhook (Inform about payment method selection)
    const { sendWebhook } = await import('@/lib/webhook-dispatcher');
    sendWebhook('order_updated', {
      order_id: updatedOrder.id,
      control_id: updatedOrder.control_id,
      user_id: user.id,
      email: user.email,
      total_paid: updatedOrder.total,
      payment_method_id,
      payment_method_name: selectedMethod.name,
      payment_instructions: selectedMethod.instructions,
      status: updatedOrder.status
    });

    return NextResponse.json({
      data: updatedOrder,
      message: 'Payment method updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
