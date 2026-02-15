import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Cart, CartWithItems, ApiResponse } from '@/types';
import { generateSessionId } from '@/store/cart-store';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// GET /api/cart?sessionId=xxx - Get cart with items
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ cart: null });
    }

    // Get cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (cartError || !cart) {
      return NextResponse.json({ cart: null });
    }

    // Get cart items with product details
    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        cart_id,
        product_id,
        variant_id,
        quantity,
        custom_metadata,
        created_at,
        products (*),
        variant:product_variants (*)
      `)
      .eq('cart_id', cart.id);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // Transform items to include product directly and handle variant
    const transformedItems = items?.map(item => ({
      ...item,
      product: Array.isArray(item.products) ? item.products[0] : item.products,
      variant: Array.isArray(item.variant) ? item.variant[0] : item.variant
    })) || [];

    const cartWithItems = {
      ...cart,
      items: transformedItems
    };

    return NextResponse.json({ cart: cartWithItems });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Create or get cart
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    let sessionId = body.sessionId;

    // If no session ID, generate one
    if (!sessionId) {
      sessionId = generateSessionId();
    }

    // Check if cart exists
    const { data: existingCart } = await supabase
      .from('carts')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (existingCart) {
      return NextResponse.json({
        data: {
          cartId: existingCart.id,
          sessionId: existingCart.session_id
        }
      } as ApiResponse<{ cartId: string; sessionId: string }>);
    }

    // Create new cart
    const { data: newCart, error } = await supabase
      .from('carts')
      .insert({ session_id: sessionId })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        cartId: newCart.id,
        sessionId: newCart.session_id
      }
    } as ApiResponse<{ cartId: string; sessionId: string }>);
  } catch (error) {
    console.error('Error creating cart:', error);
    return NextResponse.json(
      { error: 'Failed to create cart' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart?sessionId=xxx - Clear cart
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get cart
    const { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (cart) {
      // Delete all cart items
      await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);

      // Delete cart
      await supabase
        .from('carts')
        .delete()
        .eq('id', cart.id);
    }

    return NextResponse.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
