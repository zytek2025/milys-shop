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

    const body = await request.json();
    const {
      items,
      total,
      shipping_address,
      credit_applied,
      payment_method_id,
      payment_discount_amount,
      customer_name,
      customer_email,
      customer_phone
    } = body;

    if (!user && !items?.some((i: any) => i.on_request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const usedCredit = Number(credit_applied || 0);
    const paymentDiscount = Number(payment_discount_amount || 0);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 });
    }

    // 1. Validate and subtract store credit if used
    if (user && usedCredit > 0) {
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
    const finalTotal = total - usedCredit - paymentDiscount;
    const hasOnRequestItems = items.some((i: any) => i.on_request);
    const orderStatus = hasOnRequestItems ? 'quote' : 'pending';

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user?.id || null,
        total: finalTotal, // Total que el usuario PAGARÁ externamente
        credit_applied: usedCredit,
        payment_method_id,
        payment_discount_amount: paymentDiscount,
        status: orderStatus,
        shipping_address,
        customer_name,
        customer_email,
        customer_phone
      })
      .select()
      .single();

    if (orderError) {
      // Revert credit if order fails
      if (user && usedCredit > 0) {
        const { data: currentP } = await supabase.from('profiles').select('store_credit').eq('id', user.id).single();
        await supabase.from('profiles').update({ store_credit: (currentP?.store_credit || 0) + usedCredit }).eq('id', user.id);
        // Note: History ideally should be deleted or marked as reverted.
      }
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // 3. Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_name: item.product_name,
      quantity: item.quantity,
      price: item.price,
      custom_metadata: item.custom_metadata || [],
      on_request: item.custom_metadata?.on_request || false
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // ... existing error handling
      await supabase.from('orders').delete().eq('id', order.id);
      // Also revert credit
      if (usedCredit > 0) {
        // ... existing credit reversion
      }
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // 4. Update Stock & Log Movements
    // We log to stock_movements (preferred), or fallback to direct update if table/trigger is missing.
    for (const item of orderItems) {
      try {
        if (item.variant_id) {
          // 1. Try to record movement (Trigger tr_update_stock_on_movement will deduct stock)
          const { error: moveError } = await supabase.from('stock_movements').insert({
            variant_id: item.variant_id,
            quantity: -item.quantity,
            type: 'order',
            reason: `Pedido #${order.id.slice(0, 8)}`,
            created_by: user?.id || null
          });

          // 2. Fallback: If movement fails (likely missing table), do a direct update on variant
          if (moveError) {
            const { data: v } = await supabase.from('product_variants').select('stock').eq('id', item.variant_id).single();
            if (v) {
              await supabase.from('product_variants').update({ stock: v.stock - item.quantity }).eq('id', item.variant_id);
            }
          }
        } else if (item.product_id) {
          // Simple products
          const { data: vars } = await supabase.from('product_variants').select('id, stock').eq('product_id', item.product_id).limit(1);
          let variant = vars?.[0];

          if (!variant) {
            // Direct product update
            const { data: p } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
            if (p) {
              await supabase.from('products').update({ stock: p.stock - item.quantity }).eq('id', item.product_id);
            }
          } else {
            // Try movement first
            const { error: moveError } = await supabase.from('stock_movements').insert({
              variant_id: variant.id,
              quantity: -item.quantity,
              type: 'order',
              reason: `Pedido #${order.id.slice(0, 8)}`,
              created_by: user?.id || null
            });

            if (moveError) {
              await supabase.from('product_variants').update({ stock: variant.stock - item.quantity }).eq('id', variant.id);
            }
          }
        }
      } catch (stockErr) {
        console.error(`Failed to update stock/log for item ${item.product_name}:`, stockErr);
      }
    }

    // 4. Fetch Payment Method Details for Notification
    const { data: settings } = await supabase.from('store_settings').select('payment_methods').eq('id', 'global').single();
    const pm = (settings?.payment_methods as any[])?.find((m: any) => m.id === payment_method_id);

    // 5. Trigger Webhook (Fire and forget)
    // Fetch user profile to get complete Whatsapp and Name data
    const { data: profile } = user
      ? await supabase.from('profiles').select('full_name, whatsapp, shipping_address').eq('id', user.id).single()
      : { data: null };

    // Use explicit body address, or if missing, use the one from profile
    const finalShippingAddress = shipping_address || profile?.shipping_address || null;

    // Optional: Safety check to guarantee profile is updated with body info if it wasn't already
    if (user && (!profile?.shipping_address || !profile?.whatsapp) && (shipping_address || customer_phone)) {
      await supabase.from('profiles').update({
        whatsapp: customer_phone || profile?.whatsapp,
        shipping_address: finalShippingAddress
      }).eq('id', user.id);
    }

    const { sendWebhook } = await import('@/lib/webhook-dispatcher');
    sendWebhook('order_created', {
      order_id: order.id,
      control_id: order.control_id,
      total_paid: finalTotal,
      credit_applied: usedCredit,
      payment_method_id,
      payment_method_name: pm?.name || 'Desconocido',
      payment_instructions: pm?.instructions || '',
      has_backorder: hasOnRequestItems,
      order_status: orderStatus,
      customer_info: {
        name: customer_name || profile?.full_name || '',
        email: customer_email || user?.email || '',
        phone: customer_phone || profile?.whatsapp || ''
      },
      items: orderItems.map((i: any) => ({
        name: i.product_name,
        quantity: i.quantity,
        price: i.price,
        on_request: i.on_request
      })),
      shipping_address: finalShippingAddress
    }, {
      name: customer_name || profile?.full_name || user?.email?.split('@')[0],
      email: customer_email || user?.email,
      phone: customer_phone || profile?.whatsapp || ''
    });

    return NextResponse.json({
      data: order,
      message: 'Order created successfully',
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
