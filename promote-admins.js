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

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function promoteUsers() {
    console.log('\n--- PROMOTING USERS TO ADMIN ---');
    const emails = ['dfornerino@gmail.com', 'dfornerino87@gmail.com'];

    for (const email of emails) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('email', email)
            .select();

        if (error) {
            console.error(`Error promoting ${email}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(`✅ Successfully promoted ${email} to admin.`);
        } else {
            console.log(`⚠️ User ${email} not found in profiles table.`);
        }
    }
}

promoteUsers();
