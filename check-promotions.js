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

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkPromotions() {
    console.log('\n--- CHECKING PROMOTIONS TABLE ---');
    const { data: promotions, error } = await supabase
        .from('promotions')
        .select('*');

    if (error) {
        console.error('Error fetching promotions:', error.message);
        if (error.code === '42P01') {
            console.error('❌ Table "promotions" does not exist.');
        }
        return;
    }

    console.log('✅ Table "promotions" exists and is accessible.');
    if (promotions.length === 0) {
        console.log('No promotions found (table is empty but exists).');
    } else {
        console.log(`Found ${promotions.length} promotion(s):`);
        promotions.forEach(p => {
            console.log(`- ${p.name} (${p.type}) | Active: ${p.is_active}`);
        });
    }
}

checkPromotions();
