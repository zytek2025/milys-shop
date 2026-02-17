const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function checkRLS() {
    const envPath = path.resolve('.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split(/\r?\n/).forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            if (key) env[key] = value;
        }
    });

    console.log('Keys loaded:', Object.keys(env).filter(k => k.includes('SUPABASE')));

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    console.log('--- Checking RLS Policies for [profiles] ---');
    const { data: policies, error: polError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'profiles');

    if (polError) {
        console.error('Error fetching policies:', polError);
    } else {
        console.log(JSON.stringify(policies, null, 2));
    }

    console.log('\n--- Checking Profile Count (Service Role) ---');
    const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    console.log(`Total profiles in DB: ${count}`);

    console.log('\n--- Checking Profiles with role="user" ---');
    const { data: userProfiles, error: userError } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('role', 'user');

    console.log(`Profiles with role="user": ${userProfiles?.length || 0}`);
    if (userProfiles) {
        userProfiles.forEach(p => console.log(` - ${p.email}`));
    }
}

checkRLS();
