const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function findEmail() {
    const emailToFind = 'dfornerino87@gmail.com';
    console.log(`Searching for: ${emailToFind}`);

    // Check profiles
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', emailToFind);

    if (profiles && profiles.length > 0) {
        console.log('Found in [profiles]:');
        console.table(profiles);
    } else {
        console.log('Not found in [profiles].');
    }

    // Check orders (as guest or billing)
    const { data: orders, error: oError } = await supabase
        .from('orders')
        .select('id, email, full_name')
        .eq('email', emailToFind);

    if (orders && orders.length > 0) {
        console.log('Found in [orders]:');
        console.table(orders);
    } else {
        console.log('Not found in [orders].');
    }
}

findEmail();
