const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSync() {
    const testEmail = `test_sync_${Date.now()}@example.com`;
    console.log(`--- TESTING SYNC WITH EMAIL: ${testEmail} ---`);

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'password123',
        email_confirm: true,
        user_metadata: { full_name: 'Test Sync User' }
    });

    if (authError) {
        console.error('Error creating auth user:', authError.message);
        return;
    }

    const userId = authData.user.id;
    console.log(`Auth user created with ID: ${userId}`);

    // 2. Wait a bit for the trigger to fire
    console.log('Waiting 2 seconds for trigger to execute...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Check for profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (profileError) {
        console.error('Error checking profile:', profileError.message);
    } else if (profile) {
        console.log('✅ Success! Profile was created automatically!');
        console.log('Profile details:', JSON.stringify(profile, null, 2));
    } else {
        console.log('❌ Failure! Profile was NOT created. The trigger is either missing or failing.');
    }

    // Cleanup
    await supabase.auth.admin.deleteUser(userId);
    console.log('Test user cleaned up.');
}

testSync();
