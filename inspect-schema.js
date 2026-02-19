const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    console.log('--- DB INSPECTION ---');

    // Check order_items
    const { data: item, error: iErr } = await supabase.from('order_items').select('*').limit(1).maybeSingle();
    if (iErr) console.error('order_items Error:', iErr.message);
    else {
        console.log('Columns in order_items:', Object.keys(item || {}));
    }

    // Check orders
    const { data: order, error: oErr } = await supabase.from('orders').select('*').limit(1).maybeSingle();
    if (oErr) console.error('orders Error:', oErr.message);
    else {
        console.log('Columns in orders:', Object.keys(order || {}));
    }
}

inspect();
