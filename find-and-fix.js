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

async function findAndFix() {
    const emails = [
        'dfornerino@gmail.com',
        'dfornerino87@gmail.com',
        'dfornerino.usa@gmail.com'
    ];

    console.log('\n--- FINDING AND FIXING ADMINS ---');

    for (const email of emails) {
        console.log(`Checking ${email}...`);

        // 1. Find in Auth
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
        // Since listUsers failed before, let's try a different way if possible, 
        // but if it's a "Database error", maybe I can't.
        // Let's try getUserByEmail via a hack (though it's not a standard admin method, 
        // wait, supabase.auth.admin.getUserById exists but not getUserByEmail).

        // Actually, I'll just use the listUsers again but check if I can get ANY user.
        if (authError) {
            console.log(`Auth list failed: ${authError.message}. Trying to brute force update by ID if I had it...`);
        } else {
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (user) {
                console.log(`✅ Found in Auth: ${user.id}`);

                // 2. Ensure profile exists and is admin
                const { data: profile, error: pError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (!profile) {
                    console.log(`⚠️ Profile missing for ${email}. Creating...`);
                    const { error: iError } = await supabase
                        .from('profiles')
                        .insert({
                            id: user.id,
                            email: user.email,
                            role: 'admin',
                            full_name: user.user_metadata?.full_name || email.split('@')[0]
                        });
                    if (iError) console.error(`Error creating profile: ${iError.message}`);
                    else console.log(`✅ Profile created as admin.`);
                } else if (profile.role !== 'admin') {
                    console.log(`⚠️ Profile exists but role is ${profile.role}. Updating...`);
                    const { error: uError } = await supabase
                        .from('profiles')
                        .update({ role: 'admin' })
                        .eq('id', user.id);
                    if (uError) console.error(`Error updating profile: ${uError.message}`);
                    else console.log(`✅ Profile updated to admin.`);
                } else {
                    console.log(`✅ Profile is already admin.`);
                }
            } else {
                console.log(`❌ Not found in Auth.`);
            }
        }
    }
}

findAndFix();
