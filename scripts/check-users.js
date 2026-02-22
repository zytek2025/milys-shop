const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- CHECKING FUNCTION EXISTENCE ---');
    // Try to execute the function with dummy data (it will fail on insert but tell us if it exists)
    const { error } = await supabase.rpc('handle_new_user_exists_check');
    // Wait, rpc only works if explicitly allowed.

    // Let's try to see if we can find any "rogue" profiles that don't match the standard role
    const { data: profiles, count } = await supabase.from('profiles').select('*', { count: 'exact' });
    console.log(`Total profiles found via select: ${count}`);

    if (profiles) {
        profiles.forEach(p => {
            console.log(`ID: ${p.id} | Email: ${p.email} | Role: ${p.role} | Name: ${p.full_name}`);
        });
    }

    // Check if there are ANY records in profiles created in the last 10 minutes
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recent } = await supabase.from('profiles').select('*').gt('created_at', tenMinsAgo);
    console.log(`Profiles created in the last 10 minutes: ${recent?.length || 0}`);
}

check();
