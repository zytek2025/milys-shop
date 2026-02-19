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

async function checkStaff() {
    console.log('\n--- CHECKING STAFF_USERS TABLE ---');
    const { data: staff, error } = await supabase
        .from('staff_users')
        .select('*');

    if (error) {
        console.error('Error fetching staff_users:', error.message);
        if (error.code === '42P01') {
            console.log('Table "staff_users" DOES NOT exist.');
        }
    } else {
        console.log(`Found ${staff.length} staff user(s):`);
        staff.forEach(s => {
            console.log(`- ID: ${s.id} | Email: ${s.email} | Super Admin: ${s.is_super_admin}`);
        });
    }
}

checkStaff();
