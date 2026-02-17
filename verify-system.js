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

if (!SUPABASE_URL || !ANON_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function verifySystem() {
    console.log('\n--- VERIFYING SYSTEM (FIXES) ---');
    const email = `test-user-${Date.now()}@example.com`;
    const password = 'TestPassword123!';
    let userId;

    try {
        // 1. Test Registration & Automated Profile Creation (RLS Fix)
        console.log('1. Testing Registration (RLS Fix)...');
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email, password,
            options: { data: { full_name: 'Test Automatic User' } }
        });

        if (authError) throw authError;
        userId = authData.user.id;
        console.log(`   User registered: ${userId}`);

        // Wait for profile (Check if RLS allows reading/creating)
        const { data: profile, error: pError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (pError) {
            console.error('   ❌ Profile NOT found or inaccessible:', pError.message);
        } else {
            console.log(`   ✅ Profile found! Role: ${profile.role} | Name: ${profile.full_name}`);
        }

        // 2. Check Inventory Movement History
        console.log('\n2. Testing Inventory Movement History...');
        const { data: movements, error: mError } = await supabase
            .from('stock_movements')
            .select('*')
            .limit(5);

        if (mError) {
            console.error('   ❌ Failed to fetch movements:', mError.message);
        } else {
            console.log(`   ✅ Movement logs are accessible. Found ${movements.length} recent entries.`);
            if (movements.length > 0) {
                console.log('      Latest movement type:', movements[0].type);
            }
        }

    } catch (e) {
        console.error('❌ Verification Failed:', e.message);
    }

    // FINAL SYSTEM CHECK: List profiles to debug visibility
    console.log('\n--- FINAL PROFILES LOG ---');
    const { data: allProfiles } = await supabase
        .from('profiles')
        .select('email, role, crm_status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

    fs.writeFileSync('profiles-debug.json', JSON.stringify(allProfiles || [], null, 2));
    console.log('Top 10 profiles saved to profiles-debug.json');
}

verifySystem();
