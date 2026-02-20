const pg = require('pg');

const DATABASE_URL = 'postgresql://postgres.djkmhjtkspwcbkjkcigz:9f%26.v%24vUaK3L%2BUr@aws-0-us-west-2.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function dropTrigger() {
    try {
        const client = await pool.connect();
        console.log('--- DROPPING TRIGGER ---');

        const sql = `
            DROP TRIGGER IF EXISTS tr_decrement_stock ON order_items;
            DROP FUNCTION IF EXISTS decrement_stock_on_order_item();
            NOTIFY pgrst, 'reload schema';
        `;

        await client.query(sql);
        console.log('✅ Success: tr_decrement_stock dropped');

        client.release();
    } catch (err) {
        console.error('❌ Failed:', err.message);
    } finally {
        await pool.end();
    }
}

dropTrigger();
