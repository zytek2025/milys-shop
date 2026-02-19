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

async function applySqlFix() {
    console.log('\n--- APPLYING SQL FIX (RLS RECURSION) ---');

    // Note: Standard Supabase client can't run raw SQL easily via .query().
    // We usually use RPC for this or the SQL Editor.
    // However, I can try to do the logic manually via admin client if the policies allow it,
    // but policies themselves are the issue.

    console.log('I cannot execute raw SQL directly through the JS client without an RPC.');
    console.log('Please run the content of src/lib/supabase/fix-staff-recursion.sql in your Supabase SQL Editor.');

    // Manual check/fix for the user's role in profiles to be sure
    const userId = 'dc527887-9a29-42dc-aa6a-d92bd3172513'; // dfornerino.usa@gmail.com

    console.log(`\nEnsuring admin role for user ${userId} in profiles...`);
    const { error: pError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId);

    if (pError) console.error('Error updating profile:', pError.message);
    else console.log('Profile updated successfully.');

    console.log(`\nEnsuring super admin permissions in staff_users...`);
    const { error: sError } = await supabase
        .from('staff_users')
        .upsert({
            id: userId,
            email: 'dfornerino.usa@gmail.com',
            full_name: 'Daniel Fornerino',
            is_super_admin: true,
            permissions: {
                can_manage_prices: true,
                can_view_metrics: true,
                can_manage_users: true,
                can_manage_designs: true,
                can_view_settings: true
            }
        });

    if (sError) console.error('Error updating staff_users:', sError.message);
    else console.log('staff_users updated successfully.');
}

applySqlFix();
