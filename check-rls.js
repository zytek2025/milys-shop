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

async function checkRLS() {
    const { data, error } = await supabase.rpc('get_policies'); // This might not work if RPC doesn't exist
    if (error) {
        // Fallback: try to just select count
        const { count, error: countError } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        console.log('Total profiles count:', count);

        // Try to select dfornerino specifically
        const { data: dprof, error: dError } = await supabase.from('profiles').select('*').eq('email', 'dfornerino@gmail.com');
        console.log('Search for dfornerino@gmail.com:', dprof);
    } else {
        console.log('Policies:', data);
    }
}

checkRLS();
