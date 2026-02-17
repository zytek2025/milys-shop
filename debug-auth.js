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

async function debugAuth() {
    const env = getEnv();
    console.log('Debugging authentication for URL:', env.NEXT_PUBLIC_SUPABASE_URL);
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    // Check if there is a session or info we can get via anon
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
        console.error('No logged in user found via anon client:', error.message);
    } else if (user) {
        console.log('User found:', user.email);
        console.log('Metadata role:', user.user_metadata?.role);
        console.log('All metadata:', user.user_metadata);
    } else {
        console.log('No user session detected.');
    }
}

debugAuth();
