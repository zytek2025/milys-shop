const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOrders() {
    const { data, error, count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    if (error) {
        console.error('Error fetching orders:', error.message);
    } else {
        console.log('Orders count:', count);
    }
}

checkOrders();
