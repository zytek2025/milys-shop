const pg = require('pg');

const DATABASE_URL = 'postgresql://postgres.djkmhjtkspwcbkjkcigz:9f%26.v%24vUaK3L%2BUr@aws-0-us-west-2.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function migrate() {
    try {
        const client = await pool.connect();
        console.log('--- EXECUTING MIGRATION ---');

        const sql = `
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'unit_price') THEN
                    ALTER TABLE order_items ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0.00;
                    -- Copy existing price to unit_price if beneficial, or just leave as 0
                    UPDATE order_items SET unit_price = price WHERE unit_price = 0;
                END IF;
            END $$;
        `;

        await client.query(sql);
        console.log('✅ Migration successful: unit_price added to order_items');

        client.release();
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

migrate();
