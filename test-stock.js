const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInventory() {
    console.log('--- TEST: ORDER CREATION STOCK DEDUCTION ---');

    // 1. Get an active user
    const { data: users } = await supabase.from('profiles').select('id, email').limit(1);
    const userId = users[0].id;
    console.log(`Using user: ${users[0].email} (${userId})`);

    // 2. Select a product variant with stock
    const { data: variants } = await supabase.from('product_variants').select('*, products(name)').gt('stock', 5).limit(1);
    if (!variants || variants.length === 0) return console.log('No variants with stock found');
    const variant = variants[0];
    const initialStock = variant.stock;

    console.log(`Selected Variant: ${variant.id}`);
    console.log(`Product: ${variant.products.name}`);
    console.log(`Initial Stock: ${initialStock}`);

    // 3. Create Order
    const quantityToOrder = 2;
    console.log(`\nCreating order for ${quantityToOrder} units...`);

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: userId,
            total: 100,
            status: 'pending',
            shipping_address: 'Test Address'
        })
        .select()
        .single();

    if (orderError) return console.error('Order creation failed', orderError);

    // 4. Create Order Items
    const { error: itemError } = await supabase
        .from('order_items')
        .insert({
            order_id: order.id,
            product_id: variant.product_id,
            variant_id: variant.id,
            product_name: variant.products.name,
            quantity: quantityToOrder,
            price: variant.price_override || 50
        });

    if (itemError) return console.error('Order items failed', itemError);

    // 5. Create Stock Movement (API behavior)
    const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
            variant_id: variant.id,
            quantity: -quantityToOrder,
            type: 'order',
            reason: `Pedido #${order.id.slice(0, 8)}`,
            created_by: userId
        });

    if (movementError) return console.error('Stock movement failed', movementError);

    console.log('Order and stock movement created successfully.');

    // 6. Check stock immediately after
    // wait a moment for DB trigger to process
    await new Promise(r => setTimeout(r, 1000));

    const { data: checkVariant } = await supabase.from('product_variants').select('stock').eq('id', variant.id).single();
    const finalStock = checkVariant.stock;
    console.log(`\nFinal Stock: ${finalStock}`);
    console.log(`Expected Stock: ${initialStock - quantityToOrder}`);

    if (finalStock === initialStock - quantityToOrder) {
        console.log('✅ PASS: Stock was deducted EXACTLY once.');
    } else if (finalStock === initialStock - (quantityToOrder * 2)) {
        console.log('❌ FAIL: Stock was deducted TWICE (Double-deduction bug is still present).');
    } else {
        console.log('⚠️ UNKNOWN: Stock result is unexpected.');
    }

    // 7. Cleanup
    console.log('\nCleaning up test order...');
    await supabase.from('stock_movements').insert({
        variant_id: variant.id,
        quantity: quantityToOrder,
        type: 'manual',
        reason: `Reverting test stock`,
        created_by: userId
    });
    await supabase.from('orders').delete().eq('id', order.id);
    console.log('Cleanup done.');
}

testInventory();
