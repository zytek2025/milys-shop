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
const SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkAdmins() {
    console.log('\n--- CHECKING ADMIN USERS ---');
    const { data: adminProfiles, error } = await supabase
        .from('profiles')
        .select('id, email, role, full_name, created_at')
        .eq('role', 'admin');

    if (error) {
        console.error('Error fetching admin profiles:', error.message);
        return;
    }

    if (adminProfiles.length === 0) {
        console.log('No users found with role "admin".');
    } else {
        console.log(`Found ${adminProfiles.length} admin user(s):`);
        adminProfiles.forEach(p => {
            console.log(`- ${p.email} (${p.full_name}) | Created: ${p.created_at}`);
        });
    }

    // Also check for super_admins if that's a thing
    const { data: superAdmins, error: saError } = await supabase
        .from('profiles')
        .select('email')
        .eq('is_super_admin', true);

    if (saError) {
        console.log('Error checking super_admins (maybe column doesnt exist):', saError.message);
    } else if (superAdmins && superAdmins.length > 0) {
        console.log(`Found ${superAdmins.length} super admin(s):`);
        superAdmins.forEach(p => console.log(`- ${p.email}`));
    }
}

checkAdmins();
