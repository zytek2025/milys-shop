const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
    console.log('--- AUDITING RECENT ORDERS FOR GEL ANTIBACTERIAL ---');

    // 1. Find the product
    const { data: products } = await supabase
        .from('products')
        .select('id, name, stock')
        .ilike('name', '%gel%');

    console.log('Products found:', JSON.stringify(products, null, 2));

    if (products?.length > 0) {
        const productIds = products.map(p => p.id);

        // 2. Find variants
        const { data: variants } = await supabase
            .from('product_variants')
            .select('id, product_id, name, stock')
            .in('product_id', productIds);

        console.log('Variants found:', JSON.stringify(variants, null, 2));

        // 3. Find recent order items for these products
        const { data: items } = await supabase
            .from('order_items')
            .select('*, orders(id, control_id, created_at, status)')
            .in('product_id', productIds)
            .order('created_at', { ascending: false })
            .limit(10);

        console.log('Recent order items for Gel:', JSON.stringify(items, null, 2));
    }

    // 4. Check stock movements
    const { data: movements } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    console.log('Recent stock movements:', JSON.stringify(movements, null, 2));
}

audit();
