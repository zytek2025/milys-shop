const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env from .env.local
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        env[key] = value;
    }
});

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testStats() {
    console.log('\n--- TESTING ADMIN STATS LOGIC ---');
    try {
        // 1. Get products count
        const { count: productsCount, error: pError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });

        if (pError) console.error('Products error:', pError.message);
        else console.log('Products count:', productsCount);

        // 2. Get orders count
        const { count: ordersCount, error: oError } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        if (oError) console.error('Orders error:', oError.message);
        else console.log('Orders count:', ordersCount);

        // 3. Get revenue
        const { data: revenueData, error: rError } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('status', 'completed');

        if (rError) console.error('Revenue error:', rError.message);
        else {
            const total = (revenueData || []).reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
            console.log('Total revenue:', total);
        }
    } catch (e) {
        console.error('System error:', e.message);
    }
}

testStats();
