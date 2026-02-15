import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { CartItem, ApiResponse } from '@/types';
import { generateSessionId } from '@/store/cart-store';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// POST /api/cart/items - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { sessionId, productId, variantId, quantity = 1, customMetadata = [] } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Check if product exists and has stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // If variant is provided, check its stock instead
    let activeVariant = null;
    if (variantId) {
      const { data: variant, error: vError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('id', variantId)
        .eq('product_id', productId)
        .single();

      if (vError || !variant) {
        return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
      }
      activeVariant = variant;
      if (variant.stock < quantity) {
        return NextResponse.json({ error: 'Insufficient variant stock' }, { status: 400 });
      }
    } else if (product.stock < quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    let cartId: string;
    let actualSessionId = sessionId;

    // Get or create cart
    if (sessionId) {
      const { data: existingCart } = await supabase
        .from('carts')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (existingCart) {
        cartId = existingCart.id;
      } else {
        // Create new cart with provided session ID
        const { data: newCart, error: cartError } = await supabase
          .from('carts')
          .insert({ session_id: sessionId })
          .select()
          .single();

        if (cartError) {
          return NextResponse.json({ error: cartError.message }, { status: 500 });
        }
        cartId = newCart.id;
      }
    } else {
      // Generate new session ID and create cart
      actualSessionId = generateSessionId();
      const { data: newCart, error: cartError } = await supabase
        .from('carts')
        .insert({ session_id: actualSessionId })
        .select()
        .single();

      if (cartError) {
        return NextResponse.json({ error: cartError.message }, { status: 500 });
      }
      cartId = newCart.id;
    }

    // Check if item already exists in cart with SAME customization
    const { data: items } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .filter('variant_id', variantId ? 'eq' : 'is', variantId || null);

    // Manual check for custom_metadata equality
    const existingItem = items?.find(item =>
      JSON.stringify(item.custom_metadata || []) === JSON.stringify(customMetadata || [])
    );

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;

      const stockToCheck = activeVariant ? (activeVariant as any).stock : product.stock;
      if (stockToCheck < newQuantity) {
        return NextResponse.json({ error: 'Stock insuficiente para la cantidad combinada' }, { status: 400 });
      }

      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        data: updatedItem as CartItem,
        sessionId: actualSessionId
      } as ApiResponse<CartItem> & { sessionId: string });
    }

    // Add new item
    const { data: newItem, error: insertError } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cartId,
        product_id: productId,
        variant_id: variantId || null,
        quantity,
        custom_metadata: customMetadata
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: newItem as CartItem,
      sessionId: actualSessionId
    } as ApiResponse<CartItem> & { sessionId: string });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}
