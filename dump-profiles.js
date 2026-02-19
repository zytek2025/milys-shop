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

async function dumpProfiles() {
    const { data: profiles, error } = await supabase.from('profiles').select('id, email, role');
    if (error) {
        fs.writeFileSync('profiles-dump.json', JSON.stringify({ error: error.message }));
    } else {
        fs.writeFileSync('profiles-dump.json', JSON.stringify(profiles, null, 2));
    }
}

dumpProfiles();
