
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkCategories() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase environment variables');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('--- PRODUCT CATEGORIES ---');
    const { data: categories, error: cError } = await supabase
        .from('categories')
        .select('name');

    if (cError) {
        console.error('Error fetching categories:', cError.message);
    } else {
        console.log('Categories:', categories.map(c => c.name));
    }

    console.log('\n--- PRODUCT CATEGORIES IN PRODUCTS TABLE ---');
    const { data: productCats, error: pError } = await supabase
        .from('products')
        .select('category');

    if (pError) {
        console.error('Error fetching product categories:', pError.message);
    } else {
        const uniqueCats = [...new Set(productCats.map(p => p.category))];
        console.log('Categories used in products:', uniqueCats);
    }
}

checkCategories();
