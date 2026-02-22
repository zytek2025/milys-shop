const pg = require('pg');
const fs = require('fs');
const DATABASE_URL = 'postgresql://postgres.djkmhjtkspwcbkjkcigz:9f%26.v%24vUaK3L%2BUr@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function setup() {
    console.log('--- SETTING UP INVENTORY SYSTEM ---');
    try {
        const sql = fs.readFileSync('src/lib/supabase/stock-movements-schema.sql', 'utf8');
        const client = await pool.connect();
        await client.query(sql);
        console.log('✅ Inventory system established (stock_movements table and triggers created).');
        client.release();
    } catch (err) {
        console.error('❌ Setup failed:', err.message);
    } finally {
        await pool.end();
    }
}

setup();
