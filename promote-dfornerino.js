const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const userEmail = 'dfornerino.usa@gmail.com';

async function promote() {
    console.log(`Promoting ${userEmail} to admin...`);

    // Get user ID
    const { data: profile, error: findError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('email', userEmail)
        .single();

    if (findError) {
        console.error('Error finding user:', findError);
        return;
    }

    console.log(`Found User ID: ${profile.id}`);

    // Update profile role
    await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', profile.id);

    // Add to staff_users
    const { error: staffError } = await supabase
        .from('staff_users')
        .upsert({
            id: profile.id,
            email: userEmail,
            full_name: profile.full_name,
            is_super_admin: true,
            permissions: {
                can_manage_prices: true,
                can_view_metrics: true,
                can_manage_users: true,
                can_manage_designs: true,
                can_view_settings: true
            }
        });

    if (staffError) {
        console.error('Error promoting to staff:', staffError);
    } else {
        console.log('SUCCESS: User promoted to admin and staff_user.');
    }
}

promote();
