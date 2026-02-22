const pg = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://postgres.ufptanmihekkrgfhcuje:9f%26.v%24vUaK3L%2BUr@aws-0-us-west-2.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function migrate() {
    try {
        const client = await pool.connect();
        console.log('--- EXECUTING OAUTH SYNC MIGRATION ---');

        const sqlPath = path.join(__dirname, 'src', 'lib', 'supabase', 'fix-oauth-sync.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);
        console.log('✅ Migration successful: handle_new_user trigger created and existing users backfilled.');

        // Show count of profiles now
        const { rows } = await client.query('SELECT COUNT(*) as total FROM public.profiles');
        console.log(`📊 Total profiles in database: ${rows[0].total}`);

        client.release();
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        if (err.detail) console.error('Details:', err.detail);
    } finally {
        await pool.end();
    }
}

migrate();
