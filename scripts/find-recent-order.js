const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findRecentOrder() {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    console.log(`--- SEARCHING FOR ORDERS SINCE ${thirtyMinsAgo} ---`);

    const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .gt('created_at', thirtyMinsAgo)
        .order('created_at', { ascending: false });

    if (orderError) {
        console.error('Error fetching orders:', orderError.message);
        return;
    }

    console.log(`Found ${orders.length} orders in the last 30 mins.`);
    for (const order of orders) {
        console.log(`Order ID: ${order.id} | Status: ${order.status} | Total: ${order.total} | Created: ${order.created_at}`);

        const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

        items?.forEach(item => {
            console.log(`  - Item: ${item.product_name} | Qty: ${item.quantity} | Product ID: ${item.product_id}`);
        });
    }

    // Check Gel product specifically
    const { data: gel } = await supabase.from('products').select('id, name, stock').ilike('name', '%gel%');
    console.log('\n--- CURRENT GEL STOCK ---');
    console.table(gel);
}

findRecentOrder();
