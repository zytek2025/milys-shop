
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function updateCategories() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase environment variables');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('--- UPDATING CATEGORIES ---');

    const updates = [
        { from: 'Coleccion 2026', to: 'Colección 2026' },
        { from: 'Cosmeticos', to: 'Cosméticos' }
    ];

    for (const update of updates) {
        console.log(`Updating "${update.from}" to "${update.to}"...`);

        // 1. Update categories table
        const { error: catError } = await supabase
            .from('categories')
            .update({ name: update.to })
            .eq('name', update.from);

        if (catError) {
            console.error(`Error updating category "${update.from}":`, catError.message);
        } else {
            console.log(`Category table updated: ${update.from} -> ${update.to}`);
        }

        // 2. Update products table
        const { error: prodError } = await supabase
            .from('products')
            .update({ category: update.to })
            .eq('category', update.from);

        if (prodError) {
            console.error(`Error updating products in category "${update.from}":`, prodError.message);
        } else {
            console.log(`Products table updated: ${update.from} -> ${update.to}`);
        }
    }

    console.log('\n--- VERIFYING FINAL STATE ---');
    const { data: categories, error: cError } = await supabase
        .from('categories')
        .select('name');

    if (cError) {
        console.error('Error fetching categories:', cError.message);
    } else {
        console.log('Current Categories:', categories.map(c => c.name));
    }

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

updateCategories();
