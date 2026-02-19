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
const SEARCH_ID = 'CLI-BF659M';
const WEBHOOK_URL = 'https://zytek.app.n8n.cloud/webhook-test/milys';

async function find() {
    console.log(`--- SEARCHING FOR ${SEARCH_ID} IN LA TIENDA ---`);

    // Check orders.control_id
    const { data: orderById, error: err1 } = await supabase.from('orders').select('*, profiles(*)').eq('control_id', SEARCH_ID).maybeSingle();
    if (orderById) {
        console.log('✅ Found in orders.control_id');
        await send(orderById);
        return;
    }

    // Check custom_metadata in order_items
    const { data: items, error: err2 } = await supabase.from('order_items').select('*, orders(*, profiles(*))');
    const item = items?.find(i => JSON.stringify(i.custom_metadata).includes(SEARCH_ID));
    if (item) {
        console.log('✅ Found in order_items metadata');
        await send(item);
        return;
    }

    console.log('❌ ID not found in La Tienda database');
}

async function send(data) {
    console.log('🚀 Sending to webhook...');
    try {
        const res = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'RESEND_LA_TIENDA_DATA',
                id: SEARCH_ID,
                data,
                timestamp: new Date().toISOString()
            })
        });
        if (res.ok) console.log('✅ Success');
        else console.error('❌ Error:', res.status);
    } catch (e) {
        console.error('❌ Fetch failed:', e.message);
    }
}

find();
