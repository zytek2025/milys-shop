const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- CHECKING STORE SETTINGS ---');
    const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();

    if (error) {
        console.error('Error fetching settings:', error.message);
    } else {
        console.log('Settings:', JSON.stringify(data, null, 2));
    }

    console.log('\n--- CHECKING PRODUCT VARIANTS ---');
    const productId = '1a806c0b-d227-4ca8-b283-a5835a1a3baa';
    const { data: product, error: pError } = await supabase
        .from('products')
        .select('*, variants:product_variants(*)')
        .eq('id', productId)
        .maybeSingle();

    if (pError) {
        console.error('Error fetching product:', pError.message);
    } else {
        console.log('Product:', JSON.stringify(product, null, 2));
    }
}

check();
