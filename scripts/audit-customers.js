const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function countUniqueCustomers() {
    console.log('--- AUDITING UNIQUE CUSTOMERS FROM ORDERS ---');

    const { data: orders, error } = await supabase
        .from('orders')
        .select('customer_email, user_id');

    if (error) {
        console.error('Error fetching orders:', error.message);
        return;
    }

    const uniqueEmails = new Set(orders.map(o => o.customer_email?.toLowerCase()).filter(Boolean));
    const uniqueUserIds = new Set(orders.map(o => o.user_id).filter(Boolean));

    console.log(`Total orders: ${orders.length}`);
    console.log(`Unique customer emails in orders: ${uniqueEmails.size}`);
    console.log(`Unique authenticated user IDs in orders: ${uniqueUserIds.size}`);

    console.log('\nEmails found:');
    Array.from(uniqueEmails).forEach(e => console.log(`- ${e}`));
}

countUniqueCustomers();
