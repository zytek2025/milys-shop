const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('Checking product_variants...');
    const { error: err1 } = await supabase.from('product_variants').select('last_unit_cost,last_utility_percentage').limit(1);
    if (err1) console.error('Error variants:', err1.message);
    else console.log('Variants OK');

    console.log('Checking stock_movements...');
    const { error: err2 } = await supabase.from('stock_movements').select('exchange_rate,total_value,control_id,product_id').limit(1);
    if (err2) console.error('Error stock_movements:', err2.message);
    else console.log('Stock Movements OK');

    console.log('Checking products...');
    const { error: err3 } = await supabase.from('products').select('last_unit_cost,last_utility_percentage').limit(1);
    if (err3) console.error('Error products:', err3.message);
    else console.log('Products OK');
}

checkColumns();
