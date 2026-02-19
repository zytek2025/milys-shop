const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
    console.log('--- STAFF USERS ---');
    const { data: staff, error: staffError } = await supabase.from('staff_users').select('*');
    if (staffError) console.error(staffError);
    else console.log(staff);

    console.log('\n--- ALL PROFILES (LIMIT 10) ---');
    const { data: allProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .limit(10);
    if (profileError) console.error(profileError);
    else console.log(allProfiles);
}

checkUsers();
