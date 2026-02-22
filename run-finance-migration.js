const pg = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://postgres.djkmhjtkspwcbkjkcigz:9f%26.v%24vUaK3L%2BUr@aws-0-us-west-2.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function migrate() {
    try {
        const client = await pool.connect();
        console.log('--- EXECUTING FINANCE OVERHAUL MIGRATION ---');

        const sqlPath = path.join(__dirname, 'src', 'lib', 'supabase', 'create-finance-tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // We execute it as a single block. 
        // Note: For complex scripts with multiple statements, sometimes you need to split or use a transaction block.
        // But for this case, a single query should work if it's well-formatted.
        await client.query(sql);
        console.log('✅ Migration successful: Finance tables and categories created.');

        client.release();
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        if (err.detail) console.error('Details:', err.detail);
    } finally {
        await pool.end();
    }
}

migrate();
