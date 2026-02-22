const pg = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://postgres.ufptanmihekkrgfhcuje:9f%26.v%24vUaK3L%2BUr@aws-0-us-west-2.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function migrate() {
    try {
        const client = await pool.connect();
        console.log('--- EXECUTING MULTI-PAYMENT MIGRATION ---');

        const sqlPath = path.join(__dirname, 'src', 'lib', 'supabase', 'multi_payment_db_update.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);
        console.log('✅ Migration successful: store_settings and payment_confirmations updated.');

        client.release();
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        if (err.detail) console.error('Details:', err.detail);
    } finally {
        await pool.end();
    }
}

migrate();
