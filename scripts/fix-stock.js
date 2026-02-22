const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixStock() {
    const productId = '1a806c0b-d227-4ca8-b283-a5835a1a3baa';
    console.log(`--- CORRECTING STOCK FOR PRODUCT ${productId} ---`);

    // 1. Get current stock
    const { data: p } = await supabase.from('products').select('name, stock').eq('id', productId).single();
    if (!p) {
        console.error('Product not found');
        return;
    }

    console.log(`Current stock for ${p.name}: ${p.stock}`);

    // Deduct 2
    const newStock = Math.max(0, p.stock - 2);
    console.log(`Updating stock to: ${newStock}`);

    const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);

    if (updateError) {
        console.error('Error updating stock:', updateError.message);
    } else {
        console.log('✅ Stock updated successfully!');
    }

    // 2. Log a manual movement for history
    await supabase.from('stock_movements').insert({
        variant_id: null, // Since it's a simple product, or we can find variant if any
        quantity: -2,
        type: 'correction',
        reason: 'Corrección manual: Pedido ORD-5RDNS2 o similar no descontado por RLS',
        created_by: null
    }).catch(e => console.log('Movement log failed (expected if table missing)'));
}

fixStock();
