const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getEnv() {
    const envPath = path.join(process.cwd(), '.env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value.length > 0) env[key.trim()] = value.join('=').trim();
    });
    return env;
}

async function listPolicies() {
    const env = getEnv();
    // We need service role key to bypass RLS and read policies or we won't see much
    // But we don't have it in .env.local usually. Wait, I saw it was missing earlier.
    // Let's try to use the anon key first just in case, but it likely won't see pg_policies.
    // Actually, service_role is needed.

    console.log('Listing policies on profiles...');
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    // Attempting to query pg_policies via rpc or raw query if possible (likely not via anon)
    const { data, error } = await supabase.from('pg_policies').select('*').eq('tablename', 'profiles');

    if (error) {
        console.error('Error fetching policies:', error);
        console.log('Trying to check profile visibility for current user...');
    } else {
        console.log('Policies found:', data);
    }
}

listPolicies();
