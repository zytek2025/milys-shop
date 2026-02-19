
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStaff() {
    console.log('--- Checking staff_users table ---');
    const { data: staff, error } = await supabase
        .from('staff_users')
        .select('*');

    if (error) {
        console.error('Error fetching staff:', error.message);
    } else {
        console.log('Staff count:', staff.length);
        staff.forEach(s => {
            console.log(`- ${s.email} (ID: ${s.id}, SuperAdmin: ${s.is_super_admin})`);
        });
    }

    console.log('\n--- Checking profiles table for admins ---');
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('role', 'admin');

    if (pError) {
        console.error('Error fetching profiles:', pError.message);
    } else {
        console.log('Admin profiles in profiles table:', profiles.length);
        profiles.forEach(p => {
            console.log(`- ${p.email} (ID: ${p.id})`);
        });
    }
}

checkStaff();
