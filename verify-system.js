const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env from .env.local
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];
const ANON_KEY = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!SUPABASE_URL || !ANON_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function verifyStockDeductionPublic() {
    console.log('\n--- VERIFYING STOCK DEDUCTION (Customer Flow) ---');
    const email = `test-customer-verify-${Date.now()}@example.com`;
    const password = 'TestPassword123!';
    let userId, productId, variantId, orderId;

    try {
        // 1. Sign Up
        const { data: { user }, error: authError } = await supabase.auth.signUp({
            email, password
        });
        if (authError) throw authError;
        userId = user.id;
        console.log('1. Customer Created:', userId);

        // 2. We need a product to buy. We can only buy existing products if we can't create them.
        // As ANON, we cannot create products.
        // We must find an existing product with stock.
        const { data: products } = await supabase.from('products').select('id, name, product_variants(id, stock)').limit(5);

        let targetVariant = null;
        for (const p of products) {
            if (p.product_variants && p.product_variants.length > 0) {
                const v = p.product_variants.find(v => v.stock > 5);
                if (v) {
                    targetVariant = { ...v, product_id: p.id, name: p.name };
                    break;
                }
            }
        }

        if (!targetVariant) {
            throw new Error('No testable product with sufficient stock found.');
        }

        productId = targetVariant.product_id;
        variantId = targetVariant.id;
        const initialStock = targetVariant.stock;

        console.log(`2. Target Product: ${targetVariant.name} (Stock: ${initialStock})`);

        // 3. Create Order
        const { data: order, error: oError } = await supabase.from('orders').insert({
            user_id: userId,
            status: 'pending',
            total: 10.00,
            full_name: 'Verification Customer',
            shipping_address: 'Test Address'
        }).select().single();

        if (oError) throw new Error(`Order Creation Failed: ${oError.message}`);
        orderId = order.id;

        // 4. Create Order Item (Trigger should fire)
        const qtyToBuy = 1;
        const { error: iError } = await supabase.from('order_items').insert({
            order_id: orderId,
            product_id: productId,
            variant_id: variantId,
            quantity: qtyToBuy,
            price: 10.00,
            name: targetVariant.name
        });

        if (iError) throw new Error(`Order Item Failed: ${iError.message}`);
        console.log('3. Order Item Created');

        // 5. Check Stock Again
        // Wait a small moment for trigger? (Usually instantaneous in same transaction or immediate)
        const { data: updatedVariant } = await supabase.from('product_variants').select('stock').eq('id', variantId).single();

        const expectedStock = initialStock - qtyToBuy;
        console.log(`4. Final Stock: ${updatedVariant.stock} (Expected: ${expectedStock})`);

        if (updatedVariant.stock === expectedStock) {
            console.log('✅ Stock Deduction PASSED');
        } else {
            console.error('❌ Stock Deduction FAILED');
        }

    } catch (e) {
        console.error('❌ Verification Error:', e.message);
    }
    // Cleanup is hard as ANON (Can't delete confirmed orders usually). 
    // Data remains as test trash. Acceptable for verification.
}

verifyStockDeductionPublic();
