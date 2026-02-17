
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Note: In a real backend script we'd want the SERVICE_ROLE_KEY to bypass RLS, 
// but we might only have ANON. If ANON, we can't see other users' data typically due to RLS.
// However, the user asked me to check.
// If I can't check via script due to RLS, I might have to tell the user to check the database or the working admin panel.

// Let's try attempting to use the service role key if available, otherwise warn.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser() {
    console.log('Searching for user "Vanessa"...');

    // Search in profiles table
    // We'll search by full_name or email (ilike)
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', '%vanessa%');

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Found users matching "Vanessa":');
        data.forEach(user => {
            console.log(`- Name: ${user.full_name}, Email: ${user.email}, Role: ${user.role}`);
        });
    } else {
        console.log('No users found with name containing "Vanessa".');
    }
}

checkUser();
