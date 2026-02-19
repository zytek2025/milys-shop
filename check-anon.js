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
const ANON_KEY = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkAnonProfiles() {
    console.log('\n--- CHECKING PROFILES WITH ANON KEY ---');
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('email, role');

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log(`Found ${profiles.length} profiles with anon key.`);
        profiles.forEach(p => console.log(`- ${p.email} [${p.role}]`));
    }
}

checkAnonProfiles();
