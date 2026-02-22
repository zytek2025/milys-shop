const { createClient } = require('@supabase/supabase-js');
const pg = require('pg');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runDiagnostics() {
    console.log('--- SUPABASE DIAGNOSTICS ---');
    console.log('Project URL:', SUPABASE_URL);

    // 1. Test API Connectivity
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: tables, error: apiError } = await supabase.from('profiles').select('id').limit(1);

    if (apiError) {
        console.log('❌ API Check Failed:', apiError.message);
    } else {
        console.log('✅ API Check Successful: Can read profiles.');
    }

    // 2. Test DB Connection Permutations
    const password = '9f&.v$vUaK3L+Ur';
    const projectRef = SUPABASE_URL.split('//')[1].split('.')[0];

    const configs = [
        {
            name: 'Pooler (6543) with Prefix',
            config: {
                user: `postgres.${projectRef}`,
                host: 'aws-0-us-west-2.pooler.supabase.com',
                database: 'postgres',
                password: password,
                port: 6543,
                ssl: { rejectUnauthorized: false }
            }
        },
        {
            name: 'Pooler (5432) with Prefix',
            config: {
                user: `postgres.${projectRef}`,
                host: 'aws-0-us-west-2.pooler.supabase.com',
                database: 'postgres',
                password: password,
                port: 5432,
                ssl: { rejectUnauthorized: false }
            }
        }
    ];

    for (const item of configs) {
        console.log(`\nTesting ${item.name}...`);
        const pool = new pg.Pool(item.config);
        try {
            const client = await pool.connect();
            console.log(`✅ ${item.name} Connected!`);
            const res = await client.query('SELECT current_user, current_database()');
            console.log('   Results:', res.rows[0]);
            client.release();
        } catch (err) {
            console.log(`❌ ${item.name} Failed:`, err.message);
        } finally {
            await pool.end();
        }
    }
}

runDiagnostics();
