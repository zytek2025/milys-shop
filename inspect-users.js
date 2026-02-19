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

async function inspectUsers() {
    console.log('\n--- INSPECTING USERS ---');

    // Check AUTH users (needs service role)
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error('Error listing auth users:', authError.message);
        return;
    }

    console.log(`\nAuth Users found: ${users.length}`);
    users.forEach(u => {
        console.log(`- ID: ${u.id} | Email: ${u.email}`);
    });

    // Check PUBLIC profiles
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .order('email');

    if (pError) {
        console.error('Error listing profiles:', pError.message);
        return;
    }

    console.log(`\nPublic Profiles found: ${profiles.length}`);
    profiles.forEach(p => {
        const matchingAuthUser = users.find(u => u.id === p.id);
        const matchStatus = matchingAuthUser ? '✅ MATCH' : '❌ NO MATCH';
        console.log(`- ID: ${p.id} | Email: ${p.email} | Role: ${p.role} | ${matchStatus}`);
    });
}

inspectUsers();
